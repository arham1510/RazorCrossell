from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    category: str
    price: int
    rating: float
    image_url: str
    description: str
    tags: List[str]
    companions: List[str]


class Guardrails(BaseModel):
    max_price_percentage: int
    min_cart_value_rupees: int
    max_recommendations_count: int
    max_absolute_price_ceiling_rupees: int
    explicit_confirmation_required: bool


class CartLine(BaseModel):
    product_id: str
    quantity: int


class AgentProduct(BaseModel):
    id: str
    name: str
    category: str
    price_inr: int
    rating: float
    description: str
    tags: List[str]
    companions: List[str]
    image_url: str


class AgentCatalogResponse(BaseModel):
    schema_url: str
    merchant: str
    currency: str
    guardrails: Guardrails
    generated_at: datetime
    count: int
    products: List[AgentProduct]


class SuggestRequest(BaseModel):
    session_id: Optional[str] = None
    cart: List[CartLine]


class Suggestion(BaseModel):
    id: str
    product_id: str
    reason: str
    price_inr: int


class SuggestResponse(BaseModel):
    status: str
    session_id: str
    cap_rupees: int
    subtotal_rupees: int
    suggestion: Optional[Suggestion] = None
    explanation: str


class ConfirmRequest(BaseModel):
    session_id: Optional[str] = None
    accepted_suggestion_id: Optional[str] = None
    final_cart: List[CartLine]
    simulate_failure: bool = False


class Order(BaseModel):
    id: str
    entity: str = "order"
    amount: int
    amount_paid: int = 0
    amount_due: int
    currency: str = "INR"
    receipt: str
    status: str = "created"
    attempts: int = 0
    created_at: int


class ConfirmResponse(BaseModel):
    status: str
    order: Order
    session_id: str


class AuditEvent(BaseModel):
    id: str
    event_type: str
    title: str
    detail: str
    status: str
    created_at: datetime


class AuditSession(BaseModel):
    id: str
    created_at: datetime
    event_count: int
