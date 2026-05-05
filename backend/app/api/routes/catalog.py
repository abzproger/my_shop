from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_session
from app.models.category import Category
from app.models.product import Product
from app.schemas.catalog import CategoryRead, ProductRead
from app.services.catalog import product_query, product_to_read

router = APIRouter(tags=["catalog"])


@router.get("/categories", response_model=list[CategoryRead])
async def list_categories(session: AsyncSession = Depends(get_session)) -> list[CategoryRead]:
    result = await session.execute(select(Category).order_by(Category.name))
    return list(result.scalars().all())


@router.get("/products", response_model=list[ProductRead])
async def list_products(
    category_id: int | None = None,
    search: str | None = Query(default=None, min_length=2),
    session: AsyncSession = Depends(get_session),
) -> list[ProductRead]:
    statement = product_query()
    if category_id is not None:
        statement = statement.where(Product.category_id == category_id)
    if search:
        statement = statement.where(Product.name.ilike(f"%{search}%"))

    result = await session.execute(statement)
    return [product_to_read(product) for product in result.scalars().unique().all()]


@router.get("/products/{product_id}", response_model=ProductRead)
async def get_product(product_id: int, session: AsyncSession = Depends(get_session)) -> ProductRead:
    result = await session.execute(
        select(Product)
        .where(Product.id == product_id, Product.is_active.is_(True))
        .options(selectinload(Product.images), selectinload(Product.category))
    )
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product_to_read(product)
