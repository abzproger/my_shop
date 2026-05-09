from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_admin_user
from app.core.config import get_settings
from app.db.session import get_session
from app.models.category import Category
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.catalog import CategoryCreate, CategoryRead, CategoryUpdate, ProductCreate, ProductRead, ProductUpdate
from app.schemas.order import OrderRead, OrderStatusUpdate
from app.services.catalog import create_product, get_category_or_none, product_query, product_to_read, update_product
from app.services.notifier import customer_order_status_message, notify_bot
from app.services.orders import get_order, order_to_read

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_admin_user)])


@router.get("/categories", response_model=list[CategoryRead])
async def admin_list_categories(session: AsyncSession = Depends(get_session)) -> list[CategoryRead]:
    result = await session.execute(select(Category).order_by(Category.name))
    return list(result.scalars().all())


@router.post("/categories", response_model=CategoryRead, status_code=201)
async def admin_create_category(payload: CategoryCreate, session: AsyncSession = Depends(get_session)) -> CategoryRead:
    category = Category(name=payload.name)
    session.add(category)
    await session.commit()
    await session.refresh(category)
    return category


@router.patch("/categories/{category_id}", response_model=CategoryRead)
async def admin_update_category(
    category_id: int,
    payload: CategoryUpdate,
    session: AsyncSession = Depends(get_session),
) -> CategoryRead:
    category = await session.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    category.name = payload.name
    await session.commit()
    await session.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=204)
async def admin_delete_category(category_id: int, session: AsyncSession = Depends(get_session)) -> None:
    category = await session.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    in_use = await session.execute(select(Product.id).where(Product.category_id == category_id).limit(1))
    if in_use.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category is used by products",
        )

    await session.delete(category)
    await session.commit()


@router.get("/products", response_model=list[ProductRead])
async def admin_list_products(session: AsyncSession = Depends(get_session)) -> list[ProductRead]:
    result = await session.execute(product_query(include_inactive=True))
    return [product_to_read(product) for product in result.scalars().unique().all()]


@router.post("/products", response_model=ProductRead, status_code=201)
async def admin_create_product(payload: ProductCreate, session: AsyncSession = Depends(get_session)) -> ProductRead:
    if await get_category_or_none(session, payload.category_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category not found")
    product = await create_product(session, payload)
    result = await session.execute(
        select(Product)
        .where(Product.id == product.id)
        .options(selectinload(Product.images), selectinload(Product.category))
        .execution_options(populate_existing=True)
    )
    return product_to_read(result.scalar_one())


@router.patch("/products/{product_id}", response_model=ProductRead)
async def admin_update_product(
    product_id: int,
    payload: ProductUpdate,
    session: AsyncSession = Depends(get_session),
) -> ProductRead:
    result = await session.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(selectinload(Product.images), selectinload(Product.category))
    )
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if payload.category_id is not None and await get_category_or_none(session, payload.category_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category not found")
    product = await update_product(session, product, payload)
    result = await session.execute(
        select(Product)
        .where(Product.id == product.id)
        .options(selectinload(Product.images), selectinload(Product.category))
        .execution_options(populate_existing=True)
    )
    return product_to_read(result.scalar_one())


@router.delete("/products/{product_id}", status_code=204)
async def admin_delete_product(product_id: int, session: AsyncSession = Depends(get_session)) -> None:
    product = await session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    product.is_active = False
    await session.commit()


@router.post("/uploads/image", status_code=201)
async def admin_upload_image(image: UploadFile = File(...)) -> dict[str, str]:
    content_type = image.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image files are allowed")

    extension = Path(image.filename or "").suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        extension = ".jpg"

    settings = get_settings()
    media_root = Path(settings.media_root).resolve()
    upload_dir = media_root / "products"
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_name = f"{uuid4().hex}{extension}"
    target = upload_dir / file_name
    content = await image.read()
    target.write_bytes(content)
    return {"url": f"{settings.media_url_prefix}/products/{file_name}"}


@router.get("/orders", response_model=list[OrderRead])
async def admin_list_orders(
    status_filter: OrderStatus | None = Query(default=None, alias="status"),
    session: AsyncSession = Depends(get_session),
) -> list[OrderRead]:
    statement = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.created_at.desc())
    )
    if status_filter is not None:
        statement = statement.where(Order.status == status_filter)
    result = await session.execute(statement)
    return [order_to_read(order) for order in result.scalars().unique().all()]


@router.patch("/orders/{order_id}/status", response_model=OrderRead)
async def admin_update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    session: AsyncSession = Depends(get_session),
) -> OrderRead:
    order = await get_order(session, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    previous_status = order.status
    order.status = payload.status
    await session.commit()
    order = await get_order(session, order_id)
    assert order is not None
    read_model = order_to_read(order)
    if (
        order.user
        and previous_status != payload.status
        and (customer_text := customer_order_status_message(read_model.id, payload.status))
    ):
        await notify_bot(customer=(order.user.telegram_id, customer_text))
    return read_model
