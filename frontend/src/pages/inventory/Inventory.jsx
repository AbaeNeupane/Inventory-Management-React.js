import React, { useState, useEffect, useCallback } from "react";
import api from "../../api";
import { formatCurrencyNPR } from "../../utils/currency";

const REASON_LABELS = { manual:"Manual", sale:"Sale", purchase:"Purchase", return:"Return", damage:"Damage", correction:"Correction" };

export default function Inventory() {
  const [summary,     setSummary]     = useState(null);
  const [lowStock,    setLowStock]    = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [products,    setProducts]    = useState([]);
  const [tab,         setTab]         = useState("overview");
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(false);
  const [form,        setForm]        = useState({ product:"", delta:"", reason:"manual", note:"" });
  const [saving,      setSaving]      = useState(false);
  const [formErr,     setFormErr]     = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l, a, p] = await Promise.all([
        api.get("/inventory/summary/"),
        api.get("/inventory/low-stock/"),
        api.list("/inventory/adjustments/", { page_size:50 }),
        api.list("/products/", { page_size:100 }),
      ]);
      setSummary(s);
      setLowStock(l.results ?? l);
      setAdjustments((a.results ?? a));
      setProducts(p.results ?? p);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleAdjust(e) {
    e.preventDefault(); setSaving(true); setFormErr(null);
    try {
      await api.post("/inventory/adjustments/", {
        product: parseInt(form.product),
        delta:   parseInt(form.delta),
        reason:  form.reason,
        note:    form.note,
      });
      setModal(false);
      setForm({ product:"", delta:"", reason:"manual", note:"" });
      await fetchAll();
    } catch(err) { setFormErr(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="main-header">
        <div><div className="main-title">Inventory</div><div className="main-subtitle">Real-time stock tracking, adjustments &amp; audit log.</div></div>
        <button className="button primary" onClick={()=>setModal(true)}>+ Stock Adjustment</button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-4" style={{marginBottom:"1rem"}}>
          {[
            {label:"Total Products",    value:summary.total_products},
            {label:"Total Units",       value:summary.total_stock},
            {label:"Stock Value",       value:formatCurrencyNPR(summary.stock_value), color:"var(--success)"},
            {label:"Low Stock Alerts",  value:summary.low_stock_count, color:summary.low_stock_count>0?"var(--warning)":"var(--success)"},
          ].map(s=>(
            <div className="card" key={s.label}><div className="stat-label">{s.label}</div><div className="stat-value" style={{fontSize:"1.3rem",color:s.color}}>{s.value}</div></div>
          ))}
        </div>
      )}

      <div className="tab-strip">
        {["overview","adjustments"].map(t=>(
          <button key={t} className={"tab-btn"+(tab===t?" active":"")} onClick={()=>setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div style={{padding:"2rem",textAlign:"center",color:"var(--muted)"}}>Loading…</div>}

      {!loading && tab==="overview" && (
        <div className="grid grid-2">
          <div className="card">
            <div className="section-title">Low Stock Items</div>
            {!lowStock.length
              ? <div style={{fontSize:"0.85rem",color:"var(--muted)",padding:"0.5rem 0"}}>✓ All items adequately stocked.</div>
              : lowStock.map(p=>(
                <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"0.85rem",padding:"0.35rem 0",borderBottom:"1px solid var(--border)"}}>
                  <div>
                    <div style={{fontWeight:500}}>{p.name}</div>
                    <div style={{fontSize:"0.75rem",color:"var(--muted)"}}>{p.sku}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{color:"var(--danger)",fontWeight:600}}>{p.stock}</span>
                    <span style={{color:"var(--muted)"}}> / {p.reorder_level} min</span>
                  </div>
                </div>
              ))
            }
          </div>
          <div className="card">
            <div className="section-title">All Products — Stock Levels</div>
            {products.map(p=>(
              <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"0.84rem",padding:"0.3rem 0",borderBottom:"1px solid var(--border)"}}>
                <div>
                  <div style={{fontWeight:500}}>{p.name}</div>
                  <div style={{fontSize:"0.75rem",color:"var(--muted)"}}>{p.sku}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
                  <div style={{width:80,height:6,borderRadius:3,background:"var(--border)",overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:3,width:`${Math.min((p.stock/Math.max(p.reorder_level*3,1))*100,100)}%`,background:p.stock<=p.reorder_level?"var(--warning)":"var(--primary)"}}/>
                  </div>
                  <span style={{color:p.stock<=p.reorder_level?"var(--warning)":"var(--text)",fontWeight:500,minWidth:30,textAlign:"right"}}>{p.stock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && tab==="adjustments" && (
        <div className="card">
          <div className="section-title">Stock Adjustment Log</div>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Product</th><th>Reason</th>
                <th style={{textAlign:"right"}}>Delta</th>
                <th>Note</th><th>By</th><th>Date</th>
              </tr></thead>
              <tbody>
                {adjustments.map(a=>(
                  <tr key={a.id}>
                    <td><div style={{fontWeight:500}}>{a.product_name}</div><div style={{fontSize:"0.75rem",color:"var(--muted)"}}>{a.product_sku}</div></td>
                    <td><span className="badge blue">{REASON_LABELS[a.reason]||a.reason}</span></td>
                    <td style={{textAlign:"right",fontWeight:600,color:a.delta>0?"var(--success)":"var(--danger)"}}>
                      {a.delta>0?"+":""}{a.delta}
                    </td>
                    <td style={{color:"var(--muted)",fontSize:"0.82rem"}}>{a.note||"—"}</td>
                    <td style={{color:"var(--muted)",fontSize:"0.82rem"}}>{a.adjusted_by_name||"—"}</td>
                    <td style={{color:"var(--muted)",fontSize:"0.82rem"}}>{new Date(a.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!adjustments.length && <tr><td colSpan={6}><div className="empty-state"><div className="icon">📋</div>No adjustments yet.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjustment modal */}
      {modal && (
        <div style={OV} onClick={()=>setModal(false)}>
          <div style={BOX} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
              <span style={{fontWeight:600}}>Stock Adjustment</span>
              <button onClick={()=>setModal(false)} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:"1rem"}}>✕</button>
            </div>
            {formErr && <div style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:"0.5rem",padding:"0.6rem 0.9rem",fontSize:"0.83rem",color:"#fca5a5",marginBottom:"0.75rem"}}>{formErr}</div>}
            <form onSubmit={handleAdjust} style={{display:"flex",flexDirection:"column",gap:"0.65rem"}}>
              <div>
                <label style={LBL}>Product *</label>
                <select className="input" value={form.product} onChange={e=>setForm(p=>({...p,product:e.target.value}))} required style={{width:"100%"}}>
                  <option value="">Select a product…</option>
                  {products.map(p=><option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:"0.75rem"}}>
                <div style={{flex:1}}>
                  <label style={LBL}>Delta *</label>
                  <input className="input" type="number" value={form.delta} onChange={e=>setForm(p=>({...p,delta:e.target.value}))} placeholder="e.g. +10 or -5" required style={{width:"100%"}}/>
                </div>
                <div style={{flex:1}}>
                  <label style={LBL}>Reason</label>
                  <select className="input" value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))} style={{width:"100%"}}>
                    {Object.entries(REASON_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={LBL}>Note</label>
                <input className="input" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="Optional reason…" style={{width:"100%"}}/>
              </div>
              <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end",marginTop:"0.25rem"}}>
                <button type="button" className="button" onClick={()=>setModal(false)}>Cancel</button>
                <button type="submit" className="button primary" disabled={saving}>{saving?"Saving…":"Apply Adjustment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
const LBL = {display:"block",fontSize:"0.78rem",color:"var(--muted)",marginBottom:"0.3rem"};
const OV  = {position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"};
const BOX = {background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"0.75rem",padding:"1.5rem",width:"100%",maxWidth:"480px",maxHeight:"90vh",overflowY:"auto"};