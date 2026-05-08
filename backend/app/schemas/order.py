from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.order import OrderStatus, PaymentMethod


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=99)


class OrderPreviewRequest(BaseModel):
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderPreviewLine(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class OrderPreviewResponse(BaseModel):
    items: list[OrderPreviewLine]
    total_price: Decimal


class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = Field(min_length=1)
    phone: str = Field(min_length=5, max_length=32)
    address: str = Field(min_length=5, max_length=1024)
    payment_method: PaymentMethod


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    price: Decimal


class OrderRead(BaseModel):
    id: int
    status: OrderStatus
    total_price: Decimal
    phone: str
    address: str
    payment_method: PaymentMethod
    created_at: datetime
    items: list[OrderItemRead]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
