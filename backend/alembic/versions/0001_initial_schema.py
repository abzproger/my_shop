"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-05-05
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None

order_status = PG_ENUM(
    "NEW",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    name="order_status",
)

order_status_col = PG_ENUM(
    "NEW",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    name="order_status",
    create_type=False,  # не создаём type второй раз при create_table()
)

payment_method = PG_ENUM(
    "CASH",
    "TRANSFER",
    name="payment_method",
)

payment_method_col = PG_ENUM(
    "CASH",
    "TRANSFER",
    name="payment_method",
    create_type=False,  # не создаём type второй раз при create_table()
)


def upgrade() -> None:
    order_status.create(op.get_bind(), checkfirst=True)
    payment_method.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("telegram_id", sa.BigInteger(), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=True),
        sa.Column("first_name", sa.String(length=255), nullable=True),
        sa.Column("last_name", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("telegram_id"),
    )
    op.create_index("ix_users_telegram_id", "users", ["telegram_id"])

    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_products_category_id", "products", ["category_id"])

    op.create_table(
        "product_images",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("url", sa.String(length=1024), nullable=False),
    )
    op.create_index("ix_product_images_product_id", "product_images", ["product_id"])

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", order_status_col, nullable=False, server_default="NEW"),
        sa.Column("total_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=False),
        sa.Column("address", sa.String(length=1024), nullable=False),
        sa.Column("payment_method", payment_method_col, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_orders_user_id", "orders", ["user_id"])
    op.create_index("ix_orders_status", "orders", ["status"])

    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])


def downgrade() -> None:
    op.drop_index("ix_order_items_order_id", table_name="order_items")
    op.drop_table("order_items")
    op.drop_index("ix_orders_status", table_name="orders")
    op.drop_index("ix_orders_user_id", table_name="orders")
    op.drop_table("orders")
    op.drop_index("ix_product_images_product_id", table_name="product_images")
    op.drop_table("product_images")
    op.drop_index("ix_products_category_id", table_name="products")
    op.drop_table("products")
    op.drop_table("categories")
    op.drop_index("ix_users_telegram_id", table_name="users")
    op.drop_table("users")
    payment_method.drop(op.get_bind(), checkfirst=True)
    order_status.drop(op.get_bind(), checkfirst=True)
