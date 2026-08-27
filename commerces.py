from datetime import datetime, timezone
import secrets
from typing import Dict, List

from fastapi import APIRouter, HTTPException

from models.commerce import (
    AgentCatalogResponse,
    AgentProduct,
    AuditEvent,
    AuditSession,
    CartLine,
    ConfirmRequest,
    ConfirmResponse,
    Guardrails,
    Order,
    Product,
    SuggestRequest,
    SuggestResponse,
    Suggestion,
)


router = APIRouter()

GUARDRAILS = Guardrails(
    max_price_percentage=30,
    min_cart_value_rupees=200,
    max_recommendations_count=1,
    max_absolute_price_ceiling_rupees=3000,
    explicit_confirmation_required=True,
)

PRODUCTS = [
    Product(id="prod_1", name="Apex Pro Wireless Mechanical Keyboard", category="Peripherals", price=4999, rating=4.9, image_url="https://images.unsplash.com/photo-1674308423121-78686bb1d648?auto=format&fit=crop&w=900&q=85", description="Hot-swappable tactile mechanical switches with aerospace aluminum chassis.", tags=["keyboard", "mechanical", "wireless"], companions=["prod_10", "prod_7", "prod_8"]),
    Product(id="prod_2", name="ErgoGlide Precision Bluetooth Mouse", category="Peripherals", price=1899, rating=4.8, image_url="https://images.unsplash.com/photo-1619183744799-68f1fd8f1edb?auto=format&fit=crop&w=900&q=85", description="Sculpted ergonomic grip with hyper-fast scroll wheel and multi-device pairing.", tags=["mouse", "ergonomic"], companions=["prod_8", "prod_7"]),
    Product(id="prod_3", name="Veloce Smart Track Edition 4", category="Wearables", price=8499, rating=4.9, image_url="https://images.unsplash.com/photo-1548960254-5139d80bd5ec?auto=format&fit=crop&w=900&q=85", description="Sapphire glass smartwatch with continuous biometric & payment telemetry.", tags=["smartwatch", "wearable"], companions=["prod_9", "prod_7"]),
    Product(id="prod_4", name="SonicAir Studio ANC Earbuds", category="Audio", price=3299, rating=4.7, image_url="https://images.unsplash.com/photo-1621570555334-66a1f48e48eb?auto=format&fit=crop&w=900&q=85", description="Active noise cancellation with studio acoustic drivers and spatial audio.", tags=["earbuds", "audio", "anc"], companions=["prod_9", "prod_7"]),
    Product(id="prod_5", name="Artisan Matte Ceramic Coaster & Mug Set", category="Lifestyle", price=799, rating=4.6, image_url="https://images.unsplash.com/photo-1603219950587-b4f3f7ee87e7?auto=format&fit=crop&w=900&q=85", description="Double-walled ceramic tumbler for high-productivity desk workflow.", tags=["lifestyle", "desk"], companions=["prod_8"]),
    Product(id="prod_6", name="Studio Flow Ultra-wide Monitor Stand", category="Peripherals", price=2499, rating=4.8, image_url="https://images.unsplash.com/photo-1594636797501-ef436e157819?auto=format&fit=crop&w=900&q=85", description="Walnut wood riser with integrated cable management and magnetic dock.", tags=["desk", "stand"], companions=["prod_8", "prod_7"]),
    Product(id="prod_7", name="Braided USB-C 240W Ultra Cable", category="Accessories", price=499, rating=4.9, image_url="https://images.unsplash.com/photo-1603025832572-c5ba1fb6be8b?auto=format&fit=crop&w=900&q=85", description="Kevlar-reinforced high-speed charging and display transfer cable.", tags=["cable", "usb-c"], companions=[]),
    Product(id="prod_8", name="Premium Felt Desk Mat (Large)", category="Lifestyle", price=899, rating=4.7, image_url="https://images.pexels.com/photos/17136616/pexels-photo-17136616.jpeg?auto=compress&cs=tinysrgb&w=900", description="Wool-blend minimalist desk pad providing acoustic damping and smooth tracking.", tags=["desk", "mat"], companions=[]),
    Product(id="prod_9", name="Magnetic 3-in-1 Fast Charging Station", category="Accessories", price=1499, rating=4.8, image_url="https://images.unsplash.com/photo-1598717873846-0418a74950f5?auto=format&fit=crop&w=900&q=85", description="Simultaneous inductive power station for phone, smartwatch, and audio buds.", tags=["charging", "wireless"], companions=["prod_7"]),
    Product(id="prod_10", name="Mechanical Switch Care & Lubricant Kit", category="Accessories", price=349, rating=4.9, image_url="https://images.unsplash.com/photo-1650384673223-64bae2a80193?auto=format&fit=crop&w=900&q=85", description="Precision keycap puller, stem holder, and synthetic lube for enthusiast acoustics.", tags=["accessory", "keyboard"], companions=[]),
]

PRODUCT_BY_ID = {product.id: product for product in PRODUCTS}
ORDERS: Dict[str, Order] = {}
EVENTS: Dict[str, List[AuditEvent]] = {}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _new_session() -> str:
    return f"sess_{secrets.token_hex(6)}"


def _event(session_id: str, event_type: str, title: str, detail: str, status: str = "success") -> None:
    EVENTS.setdefault(session_id, []).append(
        AuditEvent(
            id=f"evt_{secrets.token_hex(6)}",
            event_type=event_type,
            title=title,
            detail=detail,
            status=status,
            created_at=_now(),
        )
    )


def _subtotal(cart: List[CartLine]) -> int:
    return sum(PRODUCT_BY_ID[line.product_id].price * line.quantity for line in cart if line.product_id in PRODUCT_BY_ID)


@router.get("/catalog", response_model=List[Product])
async def get_catalog() -> List[Product]:
    return PRODUCTS


@router.get("/guardrails", response_model=Guardrails)
async def get_guardrails() -> Guardrails:
    return GUARDRAILS


@router.get("/agent-catalog", response_model=AgentCatalogResponse)
async def get_agent_catalog() -> AgentCatalogResponse:
    return AgentCatalogResponse(
        schema_url="https://aegis.checkout/agent-catalog/v1",
        merchant="RazorCrossellAI Demo Store",
        currency="INR",
        guardrails=GUARDRAILS,
        generated_at=_now(),
        count=len(PRODUCTS),
        products=[
            AgentProduct(
                id=product.id,
                name=product.name,
                category=product.category,
                price_inr=product.price,
                rating=product.rating,
                description=product.description,
                tags=product.tags,
                companions=product.companions,
                image_url=product.image_url,
            )
            for product in PRODUCTS
        ],
    )


@router.post("/checkout/suggest", response_model=SuggestResponse)
async def suggest_checkout(input: SuggestRequest) -> SuggestResponse:
    if not input.cart:
        raise HTTPException(status_code=400, detail="Cart cannot be empty")
    session_id = input.session_id or _new_session()
    subtotal = _subtotal(input.cart)
    cap = min(int(subtotal * GUARDRAILS.max_price_percentage / 100), GUARDRAILS.max_absolute_price_ceiling_rupees)
    cart_ids = {line.product_id for line in input.cart}
    suggestion_product = next(
        (
            PRODUCT_BY_ID[companion_id]
            for line in input.cart
            for companion_id in PRODUCT_BY_ID.get(line.product_id, Product(id="", name="", category="", price=0, rating=0, image_url="", description="", tags=[], companions=[])).companions
            if companion_id not in cart_ids and companion_id in PRODUCT_BY_ID and PRODUCT_BY_ID[companion_id].price <= cap
        ),
        None,
    )
    _event(session_id, "agent_invocation", "Upsell agent evaluated the cart", f"Inspected {len(input.cart)} cart line(s) against server guardrails.")
    _event(session_id, "guardrail_evaluation", "Guardrails passed", f"Computed add-on cap is ₹{cap:,} from a ₹{subtotal:,} subtotal.")
    if subtotal < GUARDRAILS.min_cart_value_rupees:
        explanation = "The cart is below the ₹200 minimum required for an agent suggestion."
        return SuggestResponse(status="blocked", session_id=session_id, cap_rupees=cap, subtotal_rupees=subtotal, explanation=explanation)
    if suggestion_product is None:
        explanation = "No companion item fits the percentage and absolute price bounds for this cart."
        _event(session_id, "guardrail_block", "No safe add-on found", explanation, "blocked")
        return SuggestResponse(status="none", session_id=session_id, cap_rupees=cap, subtotal_rupees=subtotal, explanation=explanation)
    suggestion = Suggestion(id=f"sug_{suggestion_product.id}", product_id=suggestion_product.id, price_inr=suggestion_product.price, reason=f"Pairs with your {PRODUCT_BY_ID[input.cart[0].product_id].name} and stays under the ₹{cap:,} cap.")
    _event(session_id, "suggestion_created", "One bounds-safe add-on suggested", suggestion.reason)
    return SuggestResponse(status="suggested", session_id=session_id, cap_rupees=cap, subtotal_rupees=subtotal, suggestion=suggestion, explanation="Exactly one companion is shown. Nothing is added without your explicit confirmation.")


@router.post("/checkout/confirm", response_model=ConfirmResponse)
async def confirm_checkout(input: ConfirmRequest) -> ConfirmResponse:
    if not input.final_cart:
        raise HTTPException(status_code=400, detail="Cart cannot be empty")
    session_id = input.session_id or _new_session()
    amount = _subtotal(input.final_cart)
    _event(session_id, "user_confirmation", "Customer confirmed payment", f"Final cart total: ₹{amount:,}.")
    if input.simulate_failure:
        _event(session_id, "razorpay_call", "Razorpay test call failed", "Failure recovery demo was enabled; no money was moved.", "error")
        _event(session_id, "recovery", "Payment safely recovered", "The order was not created and the cart remains available for retry.")
        raise HTTPException(status_code=402, detail={"message": "Razorpay test failure simulated. No charge was made.", "session_id": session_id})
    order_id = f"order_test_{secrets.token_hex(7)}"
    order = Order(id=order_id, amount=amount * 100, amount_due=amount * 100, receipt=f"rcpt_{secrets.token_hex(5)}", created_at=int(_now().timestamp()))
    ORDERS[order_id] = order
    _event(session_id, "razorpay_call", "Razorpay test order created", f"Created mocked order {order_id} for ₹{amount:,}.")
    _event(session_id, "payment_authorized", "Payment authorised", "Test mode only. No real money moved.")
    return ConfirmResponse(status="created", order=order, session_id=session_id)


@router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str) -> Order:
    order = ORDERS.get(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/audit/sessions", response_model=List[AuditSession])
async def get_audit_sessions() -> List[AuditSession]:
    session_items = []
    for session_id, events in EVENTS.items():
        session_items.append(AuditSession(id=session_id, created_at=events[0].created_at, event_count=len(events)))
    return sorted(session_items, key=lambda item: item.created_at, reverse=True)


@router.get("/audit/sessions/{session_id}", response_model=List[AuditEvent])
async def get_audit_events(session_id: str) -> List[AuditEvent]:
    return EVENTS.get(session_id, [])
