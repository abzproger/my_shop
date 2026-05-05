from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.category import Category
from app.models.product import Product, ProductImage
from app.schemas.catalog import ProductCreate, ProductRead, ProductUpdate


def product_to_read(product: Product) -> ProductRead:
    return ProductRead(
        id=product.id,
        name=product.name,
        description=product.description,
        price=product.price,
        category_id=product.category_id,
        category_name=product.category.name,
        images=[image.url for image in product.images],
        is_active=product.is_active,
    )


def product_query(include_inactive: bool = False) -> Select[tuple[Product]]:
    statement = select(Product).options(selectinload(Product.images), selectinload(Product.category))
    if not include_inactive:
        statement = statement.where(Product.is_active.is_(True))
    return statement.order_by(Product.id.desc())


async def create_product(session: AsyncSession, payload: ProductCreate) -> Product:
    product = Product(
        name=payload.name,
        description=payload.description,
        price=payload.price,
        category_id=payload.category_id,
        images=[ProductImage(url=url) for url in payload.images],
    )
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return product


async def update_product(session: AsyncSession, product: Product, payload: ProductUpdate) -> Product:
    data = payload.model_dump(exclude_unset=True)
    images = data.pop("images", None)
    for key, value in data.items():
        setattr(product, key, value)

    if images is not None:
        product.images = [ProductImage(url=url) for url in images]

    await session.commit()
    await session.refresh(product)
    return product


async def get_category_or_none(session: AsyncSession, category_id: int) -> Category | None:
    return await session.get(Category, category_id)
