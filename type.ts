export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  image_url: string;
  description: string;
  tags: string[];
  companions: string[];
}

export interface Guardrails {
  max_price_percentage: number;
  min_cart_value_rupees: number;
  max_recommendations_count: number;
  max_absolute_price_ceiling_rupees: number;
  explicit_confirmation_required: boolean;
}

export interface CartLine {
  product_id: string;
  quantity: number;
}

export interface AgentProduct extends Omit<Product, "price"> {
  price_inr: number;
}

export interface AgentCatalogResponse {
  schema: string;
  merchant: string;
  currency: string;
  guardrails: Guardrails;
  generated_at: string;
  count: number;
  products: AgentProduct[];
}

export interface Suggestion {
  id: string;
  product_id: string;
  reason: string;
  price_inr: number;
}

export interface SuggestResponse {
  status: string;
  session_id: string;
  cap_rupees: number;
  subtotal_rupees: number;
  suggestion?: Suggestion | null;
  explanation: string;
}

export interface SuggestRequest {
  session_id?: string | null;
  cart: CartLine[];
}

export interface ConfirmRequest {
  session_id?: string | null;
  accepted_suggestion_id?: string | null;
  final_cart: CartLine[];
  simulate_failure: boolean;
}

export interface Order {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
}

export interface ConfirmResponse {
  status: string;
  order: Order;
  session_id: string;
}

export interface AuditSession {
  id: string;
  created_at: string;
  event_count: number;
}

export interface AuditEvent {
  id: string;
  event_type: string;
  title: string;
  detail: string;
  status: string;
  created_at: string;
}
