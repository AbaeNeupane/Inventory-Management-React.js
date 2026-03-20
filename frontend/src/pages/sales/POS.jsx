import React, { useState, useEffect, useMemo } from "react";
import api from "../../api";
import { formatCurrencyNPR } from "../../utils/currency";

const PAYMENT_METHODS = [
  { value: "cash",   label: "Cash" },
  { value: "card",   label: "Card" },
  { value: "esewa",  label: "eSewa" },
  { value: "khalti", label: "Khalti" },
  { value: "bank",   label: "Bank Transfer" },
];

export default function POS() {
  const [products,       setProducts]       = useState([]);
  const [loadingProducts,setLoadingProducts]= useState(true);
  const [cart,           setCart]           = useState([]);
  const [search,         setSearch]         = useState("");
  const [paymentMethod,  setPaymentMethod]  = useState("cash");
  const [amountPaid,     setAmountPaid]     = useState("");
  const [discount,       setDiscount]       = useState(0);
  const [placing,        setPlacing]        = useState(false);
  const [receipt,        setReceipt]        = useState(null); // completed order
  const [orderError,     setOrderError]     = useState(null);

  // ── Load products ────────────────────────────────────────────────────────
  useEffect(() => {
    api.list("/products/", { page_size: 100, is_active: true })
      .then(data => setProducts(data.results ?? data))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? products : products.filter(p =>
      p.name.toLowerCase().includes(q) || (p.sku||"").toLowerCase().includes(q)
    );
  }, [products, search]);

  // ── Cart helpers ─────────────────────────────────────────────────────────
  function addToCart(product) {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev; // can't exceed stock
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        id:       product.id,
        name:     product.name,
        price:    parseFloat(product.price),
        tax_rate: parseFloat(product.tax_rate || 13),
        stock:    product.stock,
        qty:      1,
      }];
    });
  }

  function setQty(id, qty) {
    const n = parseInt(qty) || 0;
    setCart(prev =>
      n <= 0
        ? prev.filter(i => i.id !== id)
        : prev.map(i => {
            if (i.id !== id) return i;
            return { ...i, qty: Math.min(n, i.stock) };
          })
    );
  }

  function removeFromCart(id) { setCart(prev => prev.filter(i => i.id !== id)); }
  function clearCart() { setCart([]); setAmountPaid(""); setDiscount(0); setOrderError(null); }

  // ── Totals ───────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const taxTotal = cart.reduce((s, i) => s + (i.price * i.qty * i.tax_rate) / 100, 0);
    const disc     = parseFloat(discount) || 0;
    const grand    = Math.max(subtotal + taxTotal - disc, 0);
    const paid     = parseFloat(amountPaid) || 0;
    const change   = Math.max(paid - grand, 0);
    return { subtotal, taxTotal, disc, grand, paid, change };
  }, [cart, discount, amountPaid]);

  // ── Place order ──────────────────────────────────────────────────────────
  async function handleCheckout() {
    if (!cart.length) return;
    setPlacing(true); setOrderError(null);
    try {
      const order = await api.post("/sales/orders/", {
        payment_method: paymentMethod,
        discount:       totals.disc,
        amount_paid:    totals.paid || totals.grand,
        items: cart.map(i => ({
          product:    i.id,
          quantity:   i.qty,
          unit_price: i.price.toFixed(2),
          tax_rate:   i.tax_rate.toFixed(2),
        })),
      });
      setReceipt(order);
      // Refresh product stock counts
      const updated = await api.list("/products/", { page_size: 100, is_active: true });
      setProducts(updated.results ?? updated);
      clearCart();
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  // ── Receipt modal ────────────────────────────────────────────────────────
  if (receipt) {
    return (
      <div>
        <div className="main-header">
          <div><div className="main-title">POS</div></div>
          <button className="button primary" onClick={() => setReceipt(null)}>+ New Sale</button>
        </div>
        <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Payment received</div>
            <div style={{ color: "var(--muted)", fontSize: "0.83rem", marginTop: "0.25rem" }}>
              Order #{receipt.id}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.875rem" }}>
            {receipt.items?.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{item.product_name} × {item.quantity}</span>
                <span>{formatCurrencyNPR(item.line_total)}</span>
              </div>
            ))}
          </div>
          <hr className="divider" />
          {[
            ["Subtotal",      formatCurrencyNPR(receipt.subtotal)],
            ["Tax",           formatCurrencyNPR(receipt.tax_total)],
            ["Discount",      formatCurrencyNPR(receipt.discount)],
            ["Grand Total",   formatCurrencyNPR(receipt.grand_total)],
            ["Amount Paid",   formatCurrencyNPR(receipt.amount_paid)],
            ["Change Due",    formatCurrencyNPR(receipt.change_due)],
          ].map(([label, value]) => (
            <div key={label} style={{ display:"flex", justifyContent:"space-between", fontSize:"0.875rem",
              fontWeight: label === "Grand Total" ? 700 : 400, marginBottom: "0.3rem" }}>
              <span style={{ color: label === "Grand Total" ? "var(--text)" : "var(--muted)" }}>{label}</span>
              <span>{value}</span>
            </div>
          ))}
          <div style={{ marginTop: "1rem", padding: "0.6rem", background: "rgba(52,211,153,0.08)",
            borderRadius: "0.5rem", textAlign: "center", fontSize: "0.83rem", color: "var(--success)" }}>
            Payment via {receipt.payment_method} · {new Date(receipt.created_at).toLocaleString()}
          </div>
          <button className="button primary" onClick={() => setReceipt(null)}
            style={{ width: "100%", marginTop: "1rem" }}>
            Start New Sale
          </button>
        </div>
      </div>
    );
  }

  // ── Main POS layout ──────────────────────────────────────────────────────
  return (
    <div>
      <div className="main-header">
        <div><div className="main-title">POS</div><div className="main-subtitle">Fast billing with live cart totals.</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1rem", alignItems: "start" }}>

        {/* ── Product grid ── */}
        <div className="card">
          <div style={{ marginBottom: "0.6rem" }}>
            <input className="input" placeholder="Search products…" value={search}
              onChange={e => setSearch(e.target.value)} style={{ width: "100%" }} />
          </div>
          {loadingProducts
            ? <div style={{ color:"var(--muted)", fontSize:"0.85rem", padding:"1rem 0" }}>Loading products…</div>
            : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:"0.5rem" }}>
                {filteredProducts.map(p => {
                  const inCart = cart.find(i => i.id === p.id);
                  const outOfStock = p.stock <= 0;
                  return (
                    <button key={p.id} onClick={() => addToCart(p)} disabled={outOfStock}
                      style={{
                        padding: "0.6rem", textAlign: "left", borderRadius: "0.5rem",
                        border: `1px solid ${inCart ? "var(--primary)" : "var(--border)"}`,
                        background: inCart ? "var(--primary-dim)" : "var(--surface-2)",
                        cursor: outOfStock ? "not-allowed" : "pointer",
                        opacity: outOfStock ? 0.45 : 1,
                      }}>
                      <div style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{p.category_name || p.category}</div>
                      <div style={{ fontSize:"0.85rem", fontWeight:500, margin:"0.1rem 0" }}>{p.name}</div>
                      <div style={{ fontSize:"0.8rem", color:"var(--primary)" }}>{formatCurrencyNPR(p.price)}</div>
                      <div style={{ fontSize:"0.7rem", color: p.stock <= p.reorder_level ? "var(--warning)" : "var(--muted)", marginTop:"0.1rem" }}>
                        Stock: {p.stock}
                      </div>
                    </button>
                  );
                })}
                {!filteredProducts.length && (
                  <div style={{ color:"var(--muted)", fontSize:"0.85rem", gridColumn:"1/-1", padding:"1rem 0" }}>
                    No products found.
                  </div>
                )}
              </div>
            )
          }
        </div>

        {/* ── Cart & payment ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          <div className="card">
            <div className="section-title">Cart</div>
            {!cart.length
              ? <div style={{ color:"var(--muted)", fontSize:"0.85rem", padding:"0.5rem 0" }}>Tap products to add them.</div>
              : (
                <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem" }}>
                  {cart.map(i => (
                    <div key={i.id} style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.83rem" }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{i.name}</div>
                        <div style={{ color:"var(--muted)", fontSize:"0.75rem" }}>{formatCurrencyNPR(i.price)} each</div>
                      </div>
                      <input type="number" min={1} max={i.stock} value={i.qty}
                        onChange={e => setQty(i.id, e.target.value)}
                        style={{ width:48, padding:"0.2rem 0.3rem", borderRadius:"0.4rem",
                          border:"1px solid var(--border)", background:"var(--surface)",
                          color:"var(--text)", fontSize:"0.8rem", textAlign:"center" }} />
                      <span style={{ minWidth:64, textAlign:"right" }}>{formatCurrencyNPR(i.price * i.qty)}</span>
                      <button onClick={() => removeFromCart(i.id)}
                        style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:"1rem", padding:"0 0.2rem" }}>✕</button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {cart.length > 0 && (
            <div className="card" style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              {/* Discount */}
              <div>
                <label style={{ fontSize:"0.78rem", color:"var(--muted)", display:"block", marginBottom:"0.25rem" }}>Discount (Rs)</label>
                <input className="input" type="number" min={0} value={discount}
                  onChange={e => setDiscount(e.target.value)} style={{ width:"100%" }} />
              </div>

              {/* Payment method */}
              <div>
                <label style={{ fontSize:"0.78rem", color:"var(--muted)", display:"block", marginBottom:"0.25rem" }}>Payment Method</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.35rem" }}>
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.value} onClick={() => setPaymentMethod(m.value)}
                      style={{
                        padding:"0.3rem 0.7rem", borderRadius:"999px", border:"1px solid",
                        fontSize:"0.78rem", cursor:"pointer",
                        borderColor: paymentMethod===m.value ? "var(--primary)" : "var(--border)",
                        background:  paymentMethod===m.value ? "var(--primary-dim)" : "var(--surface)",
                        color:       paymentMethod===m.value ? "#5eead4" : "var(--muted)",
                      }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount paid (cash) */}
              {paymentMethod === "cash" && (
                <div>
                  <label style={{ fontSize:"0.78rem", color:"var(--muted)", display:"block", marginBottom:"0.25rem" }}>Amount Paid (Rs)</label>
                  <input className="input" type="number" min={0} value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)} placeholder={totals.grand.toFixed(2)} style={{ width:"100%" }} />
                </div>
              )}

              {/* Totals */}
              <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem", fontSize:"0.85rem",
                borderTop:"1px solid var(--border)", paddingTop:"0.6rem" }}>
                {[
                  ["Subtotal",    formatCurrencyNPR(totals.subtotal)],
                  ["Tax (13%)",   formatCurrencyNPR(totals.taxTotal)],
                  ["Discount",    `− ${formatCurrencyNPR(totals.disc)}`],
                ].map(([label,value]) => (
                  <div key={label} style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ color:"var(--muted)" }}>{label}</span><span>{value}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", fontWeight:700, fontSize:"1rem", marginTop:"0.25rem" }}>
                  <span>Grand Total</span><span style={{ color:"var(--success)" }}>{formatCurrencyNPR(totals.grand)}</span>
                </div>
                {paymentMethod === "cash" && totals.paid > 0 && (
                  <div style={{ display:"flex", justifyContent:"space-between", color:"var(--info)" }}>
                    <span>Change Due</span><span>{formatCurrencyNPR(totals.change)}</span>
                  </div>
                )}
              </div>

              {orderError && (
                <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)",
                  borderRadius:"0.5rem", padding:"0.5rem 0.75rem", fontSize:"0.82rem", color:"#fca5a5" }}>
                  {orderError}
                </div>
              )}

              <div style={{ display:"flex", gap:"0.5rem" }}>
                <button className="button primary" onClick={handleCheckout}
                  disabled={placing || !cart.length}
                  style={{ flex:1, opacity: placing ? 0.7 : 1 }}>
                  {placing ? "Processing…" : `Take Payment · ${formatCurrencyNPR(totals.grand)}`}
                </button>
                <button className="button" onClick={clearCart}>Clear</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}