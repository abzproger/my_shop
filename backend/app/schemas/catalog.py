from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)


class CategoryUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=255)


class ProductBase(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=1)
    price: Decimal = Field(gt=0)
    category_id: int


class ProductCreate(ProductBase):
    images: list[str] = Field(default_factory=list)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    price: Decimal | None = Field(default=None, gt=0)
    category_id: int | None = None
    is_active: bool | None = None
    images: list[str] | None = None


class ProductRead(BaseModel):
    id: int
    name: str
    description: str
    price: Decimal
    category_id: int
    category_name: str
    images: list[str]
    is_active: bool
