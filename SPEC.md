# RazorCrossellAI Commerce Spec

## Purpose
RazorCrossellAI is a dark, agentic-commerce storefront recreated from the reference commerce flow. It demonstrates bounded AI upsells, explicit payment confirmation, mocked Razorpay outcomes, and transparent audit timelines.

## Routes and key flows
- `/` — catalog hero, guardrail summary, category filters, and ten product cards with local cart actions.
- `/cart` — quantity controls, item removal, subtotal summary, and link to checkout.
- `/checkout` — server-provided guardrails, one companion suggestion, optional suggestion acceptance, failure-recovery demo switch, and explicit confirm-and-pay gate.
- `/order/:orderId` — mocked payment authorization receipt with order/session details and audit link.
- `/audit` — filterable audit sessions and event timeline for agent evaluation, guardrail decisions, confirmation, payment, and recovery.
- `/agent-catalog` — machine-readable catalog feed, advertised guardrails, copy/open controls, and JSON response viewer.

## Data model
Products include id, name, category, price, rating, image URL, description, tags, and companion IDs. Cart lines contain product ID and quantity. Guardrails are 30% of subtotal, ₹200 minimum cart, one recommendation, ₹3000 absolute ceiling, and required explicit confirmation. Orders and audit events are held by the demo backend in memory.

## Integrations and auth
There is no authentication or role system. Razorpay is **MOCKED** in test mode; no real money is moved. Agent suggestions and checkout confirmation are local FastAPI demo endpoints under `/api`.
