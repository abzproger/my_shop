import asyncio
from decimal import Decimal

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.category import Category
from app.models.product import Product, ProductImage


SEED_DATA = [
    {
        "category": "Дом",
        "products": [
            {
                "name": "Керамическая кружка Nord",
                "description": "Плотная матовая керамика, объем 350 мл. Подходит для ежедневного использования.",
                "price": Decimal("890.00"),
                "images": [
                    "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80"
                ],
            },
            {
                "name": "Льняной плед Warm",
                "description": "Мягкий плед из смеси льна и хлопка для дивана, кровати или поездок.",
                "price": Decimal("3490.00"),
                "images": [
                    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80"
                ],
            },
        ],
    },
    {
        "category": "Аксессуары",
        "products": [
            {
                "name": "Шоппер Graphite",
                "description": "Прочный хлопковый шоппер с внутренним карманом и усиленными ручками.",
                "price": Decimal("1290.00"),
                "images": [
                    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80"
                ],
            },
            {
                "name": "Термобутылка Flow",
                "description": "Стальная бутылка 500 мл, держит температуру напитка до 12 часов.",
                "price": Decimal("2190.00"),
                "images": [
                    "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80"
                ],
            },
        ],
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        existing = await session.execute(select(Category.id).limit(1))
        if existing.scalar_one_or_none() is not None:
            return

        for category_data in SEED_DATA:
            category = Category(name=category_data["category"])
            session.add(category)
            await session.flush()

            for product_data in category_data["products"]:
                product = Product(
                    name=product_data["name"],
                    description=product_data["description"],
                    price=product_data["price"],
                    category_id=category.id,
                    images=[ProductImage(url=url) for url in product_data["images"]],
                )
                session.add(product)

        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())
