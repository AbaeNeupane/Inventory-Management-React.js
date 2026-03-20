import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { formatCurrencyNPR } from "../utils/currency";

export default function Dashboard() {
  const [dash,    setDash]    = useState(null);
  const [low,     setLow]     = useState([]);
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/reports/dashboard/"),
      api.get("/inventory/low-stock/"),
      api.list("/sales/orders/", { page_size:5 }),
    ]).then(([d,l,o]) => {
      setDash(d);
      setLow(l.results ?? l);
      setRecent(o.results ?? o);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",color:"var(--muted)"}}>
      Loading dashboard…
    </div>
  );

  const inv  = dash?.inventory  || {};
  const tod  = dash?.today      || {};
  const mon  = dash?.this_month || {};
  const cust = dash?.customers  || {};

  return (
    <div>
      <div className="main-header">
        <div><div className="main-title">Dashboard</div><div className="main-subtitle">Smart Inventory &amp; POS — live overview.</div></div>
        <span className="badge teal">● Live</span>
      </div>

      {/* Today + month KPIs */}
      <div className="grid grid-4" style={{marginBottom:"1rem"}}>
        {[
          {label:"Today's Revenue",   value:formatCurrencyNPR(tod.revenue||0), color:"var(--success)"},
          {label:"Today's Orders",    value:tod.orders||0},
          {label:"Month Revenue",     value:formatCurrencyNPR(mon.revenue||0), color:"var(--success)"},
          {label:"Month Orders",      value:mon.orders||0},
        ].map(s=>(
          <div className="card" key={s.label}><div className="stat-label">{s.label}</div><div className="stat-value" style={{fontSize:"1.3rem",color:s.color}}>{s.value}</div></div>
        ))}
      </div>

      {/* Inventory + customer KPIs */}
      <div className="grid grid-4" style={{marginBottom:"1rem"}}>
        {[
          {label:"Total Products",   value:inv.total_products||0},
          {label:"Stock Value",      value:formatCurrencyNPR(inv.stock_value||0), color:"var(--success)"},
          {label:"Low Stock Alerts", value:inv.low_stock_count||0, color:(inv.low_stock_count||0)>0?"var(--warning)":"var(--success)"},
          {label:"Total Customers",  value:cust.total||0},
        ].map(s=>(
          <div className="card" key={s.label}><div className="stat-label">{s.label}</div><div className="stat-value" style={{fontSize:"1.3rem",color:s.color}}>{s.value}</div></div>
        ))}
      </div>

      <div className="grid grid-2">
        {/* Low stock */}
        <div className="card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
            <div className="section-title" style={{margin:0}}>Low Stock Alerts</div>
            <Link to="/inventory" style={{fontSize:"0.78rem",color:"var(--primary)"}}>View all →</Link>
          </div>
          {!low.length
            ? <div style={{fontSize:"0.85rem",color:"var(--muted)",padding:"0.5rem 0"}}>✓ All items adequately stocked.</div>
            : low.map(p=>(
              <div key={p.id} style={{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",padding:"0.3rem 0",borderBottom:"1px solid var(--border)"}}>
                <span style={{fontWeight:500}}>{p.name}</span>
                <span>
                  <span style={{color:"var(--danger)",fontWeight:600}}>{p.stock}</span>
                  <span style={{color:"var(--muted)"}}> / {p.reorder_level} min</span>
                </span>
              </div>
            ))
          }
        </div>

        {/* Recent orders */}
        <div className="card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
            <div className="section-title" style={{margin:0}}>Recent Orders</div>
            <Link to="/pos" style={{fontSize:"0.78rem",color:"var(--primary)"}}>New sale →</Link>
          </div>
          {!recent.length
            ? <div style={{fontSize:"0.85rem",color:"var(--muted)",padding:"0.5rem 0"}}>No orders yet. Start selling from POS.</div>
            : recent.map(o=>(
              <div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"0.85rem",padding:"0.3rem 0",borderBottom:"1px solid var(--border)"}}>
                <div>
                  <span style={{fontWeight:500}}>#{o.id}</span>
                  <span style={{color:"var(--muted)",marginLeft:"0.5rem"}}>{o.customer_name||"Walk-in"}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}>
                  <span className={`badge ${o.status==="completed"?"green":o.status==="refunded"?"amber":"red"}`}>{o.status}</span>
                  <span style={{fontWeight:500}}>{formatCurrencyNPR(o.grand_total)}</span>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}