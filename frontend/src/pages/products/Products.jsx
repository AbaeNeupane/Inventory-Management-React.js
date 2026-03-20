import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { formatCurrencyNPR } from "../../utils/currency";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [query,    setQuery]    = useState("");

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const d = await api.list("/products/", { page_size:200 });
      setProducts(d.results ?? d);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sku||"").toLowerCase().includes(q) ||
      (p.category_name||"").toLowerCase().includes(q)
    );
  }, [products, query]);

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete product "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}/`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch(err) { alert(err.message); }
  }

  return (
    <div>
      <div className="main-header">
        <div>
          <div className="main-title">Products</div>
          <div className="main-subtitle">Manage catalog, pricing, stock levels and variants.</div>
        </div>
        <div style={{ display:"flex", gap:"0.5rem" }}>
          <input
            className="input"
            placeholder="Search by name, SKU, category…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ minWidth:220 }}
          />
          <Link to="/products/new">
            <button className="button primary">+ Add Product</button>
          </Link>
        </div>
      </div>

      {loading && <div style={{padding:"2rem",textAlign:"center",color:"var(--muted)"}}>Loading…</div>}
      {error   && <div style={{padding:"1rem",color:"var(--danger)"}}>Error: {error}</div>}

      {!loading && !error && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th style={{textAlign:"right"}}>Price</th>
                  <th style={{textAlign:"right"}}>Stock</th>
                  <th style={{textAlign:"right"}}>Reorder</th>
                  <th>Status</th>
                  <th style={{textAlign:"right"}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{fontWeight:500}}>
                      <Link to={`/products/${p.id}`} style={{color:"var(--text)"}}>{p.name}</Link>
                    </td>
                    <td style={{color:"var(--muted)",fontSize:"0.82rem"}}>{p.sku}</td>
                    <td>{p.category_name||"—"}</td>
                    <td style={{color:"var(--muted)"}}>{p.brand_name||"—"}</td>
                    <td style={{textAlign:"right"}}>{formatCurrencyNPR(p.price)}</td>
                    <td style={{textAlign:"right",color:p.is_low_stock?"var(--warning)":"var(--text)",fontWeight:p.is_low_stock?600:400}}>
                      {p.stock}
                    </td>
                    <td style={{textAlign:"right",color:"var(--muted)"}}>{p.reorder_level}</td>
                    <td>
                      <span className={`badge ${p.is_active?"green":"red"}`}>{p.is_active?"Active":"Inactive"}</span>
                    </td>
                    <td style={{textAlign:"right"}}>
                      <Link to={`/products/${p.id}`}>
                        <button className="button" style={{marginRight:"0.25rem"}}>Edit</button>
                      </Link>
                      <button className="button danger" onClick={() => handleDelete(p.id, p.name)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={9}>
                    <div className="empty-state"><div className="icon">📦</div>No products found.</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}