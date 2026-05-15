from datetime import datetime
from decimal import Decimal
import re

from pydantic import BaseModel, Field, field_validator

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
    phone: str = Field(min_length=10, max_length=20)
    address: str = Field(min_length=8, max_length=255)
    payment_method: PaymentMethod

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        normalized = value.strip()
        if not re.fullmatch(r"\+?[0-9][0-9\-\s\(\)]{8,18}", normalized):
            raise ValueError("Некорректный формат телефона")
        return normalized

    @field_validator("address")
    @classmethod
    def validate_address(cls, value: str) -> str:
        normalized = re.sub(r"\s+", " ", value.strip())
        if len(normalized) < 8:
            raise ValueError("Адрес слишком короткий")
        if not re.search(r"[A-Za-zА-Яа-я]", normalized):
            raise ValueError("Укажите адрес текстом")
        return normalized


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
