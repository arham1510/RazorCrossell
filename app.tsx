import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { Activity, ArrowLeft, ArrowRight, Bot, Check, CheckCircle2, ChevronDown, Clipboard, Code2, Copy, CreditCard, FileJson, Filter, Gauge, Link2, Minus, Package, Plus, RefreshCw, Search, ShieldCheck, ShoppingBag, Sparkles, Trash2, TriangleAlert, X, Zap } from "lucide-react";
import { toast, Toaster } from "sonner";
import "@/App.css";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import type { AgentCatalogResponse, AuditEvent, AuditSession, CartLine, ConfirmRequest, ConfirmResponse, Guardrails, Order, Product, SuggestRequest, SuggestResponse } from "@/types";

const CATEGORIES = ["All", "Peripherals", "Wearables", "Audio", "Accessories", "Lifestyle"];
const formatINR = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const formatDate = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

interface CartContextValue {
  cart: CartLine[];
  addToCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      const saved = window.localStorage.getItem("razorcrossell-cart");
      return saved ? (JSON.parse(saved) as CartLine[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem("razorcrossell-cart", JSON.stringify(cart));
  }, [cart]);

  const value = useMemo<CartContextValue>(() => ({
    cart,
    addToCart: (productId) => setCart((current) => {
      const existing = current.find((line) => line.product_id === productId);
      if (existing) return current.map((line) => line.product_id === productId ? { ...line, quantity: line.quantity + 1 } : line);
      return [...current, { product_id: productId, quantity: 1 }];
    }),
    updateQuantity: (productId, quantity) => setCart((current) => quantity > 0 ? current.map((line) => line.product_id === productId ? { ...line, quantity } : line) : current.filter((line) => line.product_id !== productId)),
    removeFromCart: (productId) => setCart((current) => current.filter((line) => line.product_id !== productId)),
    clearCart: () => setCart([]),
  }), [cart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}

function useCatalog() {
  return useQuery<Product[]>({ queryKey: ["catalog"], queryFn: () => apiGet<Product[]>("/api/catalog"), staleTime: 60_000 });
}

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><ShieldCheck size={18} /></span>;
}

function Layout() {
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  return <div className="app-shell">
    <header className="topbar" data-testid="site-header">
      <Link to="/" className="brand-lockup" data-testid="brand-home-link">
        <BrandMark />
        <span className="brand-copy"><strong data-testid="brand-name">RazorCrossell<span>AI</span></strong><small>BOUNDED · GATED · AUDITABLE</small></span>
      </Link>
      <nav className="main-nav" aria-label="Primary navigation" data-testid="primary-navigation">
        <NavLink to="/" end className="nav-link" data-testid="catalog-nav-link"><Sparkles size={15} /> Catalog</NavLink>
        <NavLink to="/cart" className="nav-link" data-testid="cart-nav-link"><ShoppingBag size={15} /> Cart {cartCount > 0 && <b className="nav-count" data-testid="cart-count">{cartCount}</b>}</NavLink>
        <NavLink to="/audit" className="nav-link" data-testid="audit-nav-link"><Activity size={15} /> Audit Trail</NavLink>
        <NavLink to="/agent-catalog" className="nav-link" data-testid="agent-catalog-nav-link"><Code2 size={15} /> Agent Catalog</NavLink>
      </nav>
    </header>
    <main className="page-content"><Outlet /></main>
    <footer className="site-footer" data-testid="site-footer">RazorCrossellAI · Razorpay Test-Mode <span>(MOCKED)</span> · Every money action explainable, bounded and gated.</footer>
  </div>;
}

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="page-intro" data-testid={`page-intro-${eyebrow.toLowerCase().replace(/\s+/g, "-")}`}>
    <p className="eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    {description && <p className="intro-description">{description}</p>}
  </div>;
}

function CatalogPage() {
  const { data: products, isLoading, isError } = useCatalog();
  const { addToCart } = useCart();
  const [category, setCategory] = useState("All");
  const filteredProducts = useMemo(() => products?.filter((product) => category === "All" || product.category === category) ?? [], [category, products]);
  if (isLoading) return <LoadingState label="Loading the catalog" />;
  if (isError || !products) return <ErrorState message="The catalog is temporarily unavailable." />;
  return <>
    <section className="hero-panel" data-testid="catalog-hero">
      <div className="hero-copy">
        <div className="eyebrow-row"><p className="eyebrow">AGENTIC COMMERCE INFRASTRUCTURE</p><span className="mode-pill"><Zap size={12} /> Razorpay Test Mode</span></div>
        <h1>Every upsell decision.<br /><em>Bounded, gated, auditable.</em></h1>
        <p>An AI agent that sits inside your checkout — decides whether to offer an add-on, explains why in plain English, respects hard monetary bounds, and never charges without explicit user confirmation.</p>
        <div className="hero-actions"><Link to="/cart" className="button primary" data-testid="hero-view-cart-button">View Cart · {useCart().cart.reduce((sum, line) => sum + line.quantity, 0)} items <ArrowRight size={16} /></Link><Link to="/agent-catalog" className="button ghost" data-testid="hero-agent-catalog-button"><Bot size={15} /> Agent-readable catalog</Link></div>
        <div className="guardrail-strip" data-testid="hero-guardrail-strip"><span><ShieldCheck size={14} /> ≤ 30% of subtotal cap</span><span><ShieldCheck size={14} /> Min cart ₹200</span><span><ShieldCheck size={14} /> Exactly 1 suggestion</span><span><ShieldCheck size={14} /> Explicit confirm gate</span><span><ShieldCheck size={14} /> Full audit trail</span></div>
      </div>
      <div className="hero-orbit" aria-hidden="true"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><Bot size={28} /></div><span className="orbit-label label-one">GUARDRAIL ENGINE</span><span className="orbit-label label-two">CHECKOUT AI</span></div>
    </section>
    <section className="catalog-section" data-testid="catalog-section">
      <div className="catalog-toolbar"><div className="category-tabs" role="tablist" aria-label="Product categories">{CATEGORIES.map((item) => <button type="button" key={item} className={`category-tab ${category === item ? "active" : ""}`} onClick={() => setCategory(item)} data-testid={`category-filter-${item.toLowerCase()}`}>{item}</button>)}</div><span className="catalog-total" data-testid="catalog-total">{filteredProducts.length} SKUs · Subtotal: {formatINR(0)}</span></div>
      <div className="product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={() => { addToCart(product.id); toast.success(`${product.name.slice(0, 22)}… added`); }} />)}</div>
    </section>
  </>;
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return <article className="product-card" data-testid={`product-card-${product.id}`}>
    <div className="product-image-wrap"><img src={product.image_url} alt={product.name} data-testid={`product-image-${product.id}`} /><span className="category-badge">{product.category}</span></div>
    <div className="product-body"><div className="product-title-row"><h2 data-testid={`product-name-${product.id}`}>{product.name}</h2><span className="rating" data-testid={`product-rating-${product.id}`}>★ {product.rating}</span></div><p className="product-description" data-testid={`product-description-${product.id}`}>{product.description}</p><div className="product-footer"><div><span className="price-label">PRICE</span><strong data-testid={`product-price-${product.id}`}>{formatINR(product.price)}</strong></div><button type="button" className="add-button" onClick={onAdd} data-testid={`product-add-button-${product.id}`}><Plus size={16} /> Add</button></div></div>
  </article>;
}

function CartPage() {
  const { data: products, isLoading } = useCatalog();
  const { cart, updateQuantity, removeFromCart } = useCart();
  const productMap = useMemo(() => new Map((products ?? []).map((product) => [product.id, product])), [products]);
  const subtotal = cart.reduce((sum, line) => sum + (productMap.get(line.product_id)?.price ?? 0) * line.quantity, 0);
  if (isLoading) return <LoadingState label="Loading your cart" />;
  if (cart.length === 0) return <EmptyState icon={<ShoppingBag size={28} />} title="Your cart is empty" description="Add a product to see the agent in action." action={<Link to="/" className="button primary" data-testid="empty-cart-browse-button">Browse catalog <ArrowRight size={16} /></Link>} />;
  return <section className="cart-page" data-testid="cart-page"><PageIntro eyebrow="YOUR CART" title="Your Cart" description={`${cart.reduce((sum, line) => sum + line.quantity, 0)} ${cart.length === 1 ? "ITEM" : "ITEMS"}`} /><div className="cart-layout"><div className="cart-lines" data-testid="cart-lines">{cart.map((line) => { const product = productMap.get(line.product_id); if (!product) return null; return <div className="cart-line" key={line.product_id} data-testid={`cart-line-${product.id}`}><img src={product.image_url} alt={product.name} /><div className="cart-product"><h2>{product.name}</h2><p>{product.category} · {formatINR(product.price)} each</p></div><div className="quantity-control" data-testid={`quantity-control-${product.id}`}><button type="button" onClick={() => updateQuantity(product.id, line.quantity - 1)} data-testid={`quantity-decrease-${product.id}`} aria-label={`Decrease ${product.name}`}><Minus size={14} /></button><span data-testid={`quantity-value-${product.id}`}>{line.quantity}</span><button type="button" onClick={() => updateQuantity(product.id, line.quantity + 1)} data-testid={`quantity-increase-${product.id}`} aria-label={`Increase ${product.name}`}><Plus size={14} /></button></div><strong className="line-price">{formatINR(product.price * line.quantity)}</strong><button type="button" className="icon-button subtle" onClick={() => removeFromCart(product.id)} data-testid={`remove-cart-item-${product.id}`} aria-label={`Remove ${product.name}`}><Trash2 size={16} /></button></div>; })}</div><aside className="summary-card" data-testid="order-summary"><p className="eyebrow">ORDER SUMMARY</p><div className="summary-total"><span>Subtotal</span><strong>{formatINR(subtotal)}</strong></div><p className="muted-note">Taxes calculated at checkout · MOCKED</p><Link to="/checkout" className="button primary full-width" data-testid="proceed-checkout-button">Proceed to Agentic Checkout <ArrowRight size={16} /></Link><div className="summary-points"><span><ShieldCheck size={14} /> Explicit confirmation required before any charge</span><span><ShieldCheck size={14} /> Upsell capped at 30% of subtotal</span></div><div className="ai-ready"><span className="status-pill">AI ready</span><p>RazorCrossellAI will inspect this cart at checkout and (maybe) suggest one bounds-safe add-on.</p></div></aside></div></section>;
}

function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: products } = useCatalog();
  const { cart } = useCart();
  const productMap = useMemo(() => new Map((products ?? []).map((product) => [product.id, product])), [products]);
  const subtotal = cart.reduce((sum, line) => sum + (productMap.get(line.product_id)?.price ?? 0) * line.quantity, 0);
  const [failureRecovery, setFailureRecovery] = useState(false);
  const [guardrailsOpen, setGuardrailsOpen] = useState(true);
  const [acceptedSuggestion, setAcceptedSuggestion] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const guardrailsQuery = useQuery<Guardrails>({ queryKey: ["guardrails"], queryFn: () => apiGet<Guardrails>("/api/guardrails") });
  const suggestPayload: SuggestRequest = { cart };
  const suggestionQuery = useQuery<SuggestResponse>({ queryKey: ["checkout-suggestion", cart], queryFn: () => apiPost<SuggestResponse, SuggestRequest>("/api/checkout/suggest", suggestPayload), enabled: cart.length > 0, staleTime: 0 });
  const confirmMutation = useMutation<ConfirmResponse, ApiError, ConfirmRequest>({ mutationFn: (payload) => apiPost<ConfirmResponse, ConfirmRequest>("/api/checkout/confirm", payload), onSuccess: (result) => { queryClient.invalidateQueries({ queryKey: ["audit-sessions"] }); navigate(`/order/${result.order.id}?session=${result.session_id}`, { state: { order: result.order, sessionId: result.session_id } }); }, onError: (error) => setErrorMessage(error.message) });
  if (cart.length === 0) return <EmptyState icon={<ShoppingBag size={28} />} title="Your cart is empty" description="Add a product before opening the agentic checkout." action={<Link to="/" className="button primary" data-testid="checkout-empty-browse-button">Browse catalog <ArrowRight size={16} /></Link>} />;
  const guardrails = guardrailsQuery.data;
  const suggestion = suggestionQuery.data?.suggestion;
  const finalCart = acceptedSuggestion && suggestion ? [...cart, { product_id: suggestion.product_id, quantity: 1 }] : cart;
  const finalTotal = subtotal + (acceptedSuggestion && suggestion ? suggestion.price_inr : 0);
  return <section className="checkout-page" data-testid="checkout-page"><PageIntro eyebrow="STEP 1 · REVIEW" title="Checkout" /><div className="checkout-layout"><div className="checkout-main"><div className="checkout-cart-panel panel"><p className="eyebrow">CART</p>{cart.map((line) => { const product = productMap.get(line.product_id); if (!product) return null; return <div className="checkout-line" key={product.id}><img src={product.image_url} alt={product.name} /><div><strong>{product.name}</strong><span>× {line.quantity} · {formatINR(product.price)}</span></div><b>{formatINR(product.price * line.quantity)}</b></div>; })}<div className="checkout-total"><span>Total</span><strong>{formatINR(finalTotal)}</strong></div></div><div className="recovery-card panel"><div><TriangleAlert size={18} /><div><strong>Failure recovery demo</strong><p>Toggle to simulate a Razorpay API error at payment. The customer must never be charged incorrectly.</p></div></div><button type="button" role="switch" aria-checked={failureRecovery} className={`switch ${failureRecovery ? "on" : ""}`} onClick={() => setFailureRecovery((value) => !value)} data-testid="failure-recovery-switch"><span /></button></div><div className="payment-bar panel"><div><CreditCard size={18} /><div><strong>Razorpay · Test Mode <span>(MOCKED)</span></strong><small>No real charge. Explicit confirmation gates every attempt.</small></div></div><button type="button" className="button primary" onClick={() => { setErrorMessage(""); confirmMutation.mutate({ session_id: suggestionQuery.data?.session_id ?? null, accepted_suggestion_id: acceptedSuggestion && suggestion ? suggestion.id : null, final_cart: finalCart, simulate_failure: failureRecovery }); }} disabled={confirmMutation.isPending} data-testid="confirm-pay-button">{confirmMutation.isPending ? <RefreshCw size={15} className="spin" /> : null}{confirmMutation.isPending ? "Authorising…" : `Confirm & Pay ${formatINR(finalTotal)}`} <ArrowRight size={16} /></button></div>{errorMessage && <div className="error-banner" data-testid="checkout-error-banner"><TriangleAlert size={16} /><span>{errorMessage}</span><button type="button" onClick={() => setErrorMessage("")} data-testid="dismiss-checkout-error"><X size={15} /></button></div>}</div><aside className="checkout-side"><div className="agent-card panel" data-testid="agent-decision-card"><div className="agent-card-head"><span className="agent-avatar"><Bot size={18} /></span><div><strong>RazorCrossell<span>AI</span></strong><small>BOUNDED UPSELL AGENT</small></div></div>{suggestionQuery.isLoading ? <div className="evaluating"><RefreshCw size={15} className="spin" /> Evaluating cart within bounds…</div> : suggestion ? <div className="suggestion-result"><div className="suggestion-badge"><Sparkles size={13} /> One safe suggestion</div><h3>Complete your setup</h3><p>{suggestion.reason}</p><div className={`suggestion-choice ${acceptedSuggestion ? "selected" : ""}`}><div><strong>{productMap.get(suggestion.product_id)?.name}</strong><span>{formatINR(suggestion.price_inr)} · under the {formatINR(suggestionQuery.data?.cap_rupees ?? 0)} cap</span></div><button type="button" className={`choice-button ${acceptedSuggestion ? "selected" : ""}`} onClick={() => setAcceptedSuggestion((value) => !value)} data-testid="suggestion-accept-button">{acceptedSuggestion ? <Check size={15} /> : <Plus size={15} />} {acceptedSuggestion ? "Added" : "Accept"}</button></div><small className="suggestion-note">Nothing is added without your explicit confirmation.</small></div> : <div className="no-suggestion"><Gauge size={18} /><strong>No bounds-safe add-on</strong><p>{suggestionQuery.data?.explanation ?? "The agent will explain its decision here."}</p></div>}<button type="button" className="inspector-toggle" onClick={() => setGuardrailsOpen((value) => !value)} data-testid="guardrails-inspector-toggle"><span><ShieldCheck size={15} /> Guardrails · server-enforced</span><span>{guardrailsOpen ? "hide" : "show"}<ChevronDown size={14} className={guardrailsOpen ? "rotate" : ""} /></span></button>{guardrailsOpen && guardrails && <div className="guardrail-table" data-testid="guardrails-table"><span>Max % of subtotal <b>{guardrails.max_price_percentage}%</b></span><span>Min cart value <b>{formatINR(guardrails.min_cart_value_rupees)}</b></span><span>Max recommendations <b>{guardrails.max_recommendations_count}</b></span><span>Absolute price ceiling <b>{formatINR(guardrails.max_absolute_price_ceiling_rupees)}</b></span><span>Explicit confirmation <b>REQUIRED</b></span><span>Computed cap this cart <b>{formatINR(suggestionQuery.data?.cap_rupees ?? 0)} <small>(of {formatINR(subtotal)})</small></b></span></div>}</div></aside></div></section>;
}

function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const state = location.state as { order?: Order; sessionId?: string } | null;
  const orderQuery = useQuery<Order>({ queryKey: ["order", orderId], queryFn: () => apiGet<Order>(`/api/orders/${orderId}`), enabled: Boolean(orderId && !state?.order) });
  const order = state?.order ?? orderQuery.data;
  const sessionId = state?.sessionId ?? "";
  if (!order) return <LoadingState label="Retrieving your test order" />;
  return <section className="order-page" data-testid="order-page"><div className="order-success panel"><div className="success-icon"><CheckCircle2 size={30} /></div><span className="mode-pill">Razorpay · Test Mode (MOCKED)</span><h1>Payment authorised</h1><p>Your test order was created successfully. No real money was moved.</p><div className="order-details"><span><small>ORDER ID</small><b data-testid="order-id">{order.id}</b></span><span><small>SESSION</small><b>{sessionId || "—"}</b></span><span><small>PROVIDER</small><b>razorpay · test · mocked</b></span></div><div className="order-actions"><Link to={`/audit${sessionId ? `?session=${sessionId}` : ""}`} className="button primary" data-testid="view-audit-button"><Activity size={15} /> View full audit trail <ArrowRight size={16} /></Link><Link to="/" className="button ghost" data-testid="back-to-catalog-button"><Package size={15} /> Back to catalog</Link></div></div></section>;
}

function AgentCatalogPage() {
  const { data, isLoading, isError } = useQuery<AgentCatalogResponse>({ queryKey: ["agent-catalog"], queryFn: () => apiGet<AgentCatalogResponse>("/api/agent-catalog") });
  const [copied, setCopied] = useState(false);
  if (isLoading) return <LoadingState label="Preparing the agent feed" />;
  if (isError || !data) return <ErrorState message="The agent feed is temporarily unavailable." />;
  const feedUrl = `${window.location.origin}/api/agent-catalog`;
  const json = JSON.stringify(data, null, 2);
  const copyUrl = async () => { await navigator.clipboard?.writeText(feedUrl); setCopied(true); toast.success("Agent catalog URL copied"); window.setTimeout(() => setCopied(false), 2000); };
  return <section className="agent-catalog-page" data-testid="agent-catalog-page"><PageIntro eyebrow="FOR AI SHOPPING AGENTS" title="Agent-readable Catalog" description="A stable, machine-readable JSON feed of every SKU on this store — including guardrail bounds and companion mappings. External AI agents (buyers, comparison bots, personal shoppers) can consume this directly." /><div className="feed-callout panel"><div className="feed-label"><Code2 size={18} /><span>GET · SCHEMA V1</span></div><code data-testid="agent-feed-url">{feedUrl}</code><div className="feed-actions"><button type="button" className="button ghost" onClick={copyUrl} data-testid="copy-agent-feed-button"><Copy size={15} /> {copied ? "Copied" : "Copy URL"}</button><a href="/api/agent-catalog" target="_blank" rel="noreferrer" className="button primary" data-testid="open-agent-feed-link">Open <Link2 size={15} /></a></div></div><div className="agent-grid"><div className="agent-sidebar"><div className="stat-grid panel"><div><small>SCHEMA</small><strong>{data.schema}</strong></div><div><small>CURRENCY</small><b>{data.currency}</b></div><div><small>COUNT</small><b>{data.count}</b></div><div><small>MERCHANT</small><b>{data.merchant}</b></div></div><div className="guardrail-card panel"><h3><ShieldCheck size={16} /> Guardrails advertised to agents</h3>{Object.entries(data.guardrails).map(([key, value]) => <div key={key}><span>{key}</span><b>{String(value)}</b></div>)}</div><div className="try-card panel"><p className="eyebrow">TRY IT</p><code>curl {feedUrl}</code></div></div><div className="json-panel panel"><div className="json-header"><span><FileJson size={16} /> JSON RESPONSE</span><small>application/json</small></div><pre data-testid="agent-catalog-json">{json}</pre></div></div></section>;
}

function AuditPage() {
  const location = useLocation();
  const initialSession = new URLSearchParams(location.search).get("session");
  const [filter, setFilter] = useState("");
  const [selectedSession, setSelectedSession] = useState<string | null>(initialSession);
  const sessionsQuery = useQuery<AuditSession[]>({ queryKey: ["audit-sessions"], queryFn: () => apiGet<AuditSession[]>("/api/audit/sessions") });
  const eventsQuery = useQuery<AuditEvent[]>({ queryKey: ["audit-events", selectedSession], queryFn: () => apiGet<AuditEvent[]>(`/api/audit/sessions/${selectedSession}`), enabled: Boolean(selectedSession) });
  const sessions = sessionsQuery.data?.filter((session) => session.id.toLowerCase().includes(filter.toLowerCase())) ?? [];
  return <section className="audit-page" data-testid="audit-page"><PageIntro eyebrow="TRANSPARENCY" title="Agent Audit Trail" description="Immutable per-session log of every agent invocation, decision, guardrail block, user confirmation, Razorpay call, and recovery event." /><div className="audit-toolbar"><label className="search-field"><Search size={15} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter sessions" data-testid="audit-session-filter" /></label><span className="audit-count"><Filter size={14} /> {sessions.length} sessions</span></div><div className="audit-layout"><div className="session-list panel"><p className="eyebrow">RECENT SESSIONS</p>{sessionsQuery.isLoading ? <p className="muted-note">Loading sessions…</p> : sessions.length === 0 ? <p className="muted-note" data-testid="audit-empty-state">No sessions yet. Complete a checkout to create an auditable timeline.</p> : sessions.map((session) => <button type="button" key={session.id} className={`session-row ${selectedSession === session.id ? "selected" : ""}`} onClick={() => setSelectedSession(session.id)} data-testid={`audit-session-${session.id}`}><span><strong>{session.id}</strong><small>{formatDate(session.created_at)}</small></span><b>{session.event_count}</b></button>)}</div><div className="timeline-panel panel">{!selectedSession ? <div className="timeline-empty"><Activity size={28} /><p>Select a session on the left to view its full event timeline.</p></div> : eventsQuery.isLoading ? <LoadingState label="Loading session timeline" /> : <div className="timeline" data-testid="audit-timeline"><div className="timeline-heading"><div><p className="eyebrow">SESSION</p><h2>{selectedSession}</h2></div><span className="status-pill">{eventsQuery.data?.length ?? 0} events</span></div>{(eventsQuery.data ?? []).map((event) => <div className="timeline-event" key={event.id}><div className={`event-dot ${event.status}`}><Check size={13} /></div><div className="event-copy"><div><strong>{event.title}</strong><small>{formatDate(event.created_at)}</small></div><p>{event.detail}</p><span className={`event-type ${event.status}`}>{event.event_type.replaceAll("_", " ")}</span></div></div>)}</div>}</div></div><Link to="/" className="back-link" data-testid="audit-back-to-catalog"><ArrowLeft size={15} /> Back to catalog</Link></section>;
}

function LoadingState({ label }: { label: string }) { return <div className="state-page" data-testid="loading-state"><RefreshCw size={22} className="spin" /><p>{label}…</p></div>; }
function ErrorState({ message }: { message: string }) { return <div className="state-page" data-testid="error-state"><TriangleAlert size={24} /><p>{message}</p></div>; }
function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action: ReactNode }) { return <div className="state-page empty-state" data-testid="empty-state"><span className="empty-icon">{icon}</span><h1>{title}</h1><p>{description}</p>{action}</div>; }

export default function App() {
  return <CartProvider><Routes><Route element={<Layout />}><Route path="/" element={<CatalogPage />} /><Route path="/cart" element={<CartPage />} /><Route path="/checkout" element={<CheckoutPage />} /><Route path="/order/:orderId" element={<OrderPage />} /><Route path="/audit" element={<AuditPage />} /><Route path="/agent-catalog" element={<AgentCatalogPage />} /></Route></Routes><Toaster position="top-right" theme="dark" /></CartProvider>;
}
