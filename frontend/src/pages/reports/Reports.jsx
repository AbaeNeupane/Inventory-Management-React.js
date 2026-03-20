import React, { useState, useEffect } from "react";
import api from "../../api";
import { formatCurrencyNPR } from "../../utils/currency";

function BarChart({ data, valueKey, labelKey, color="#0d9488" }) {
  const max = Math.max(...data.map(d=>d[valueKey]), 1);
  return (
    <div style={{display:"flex",gap:"0.5rem",alignItems:"flex-end",height:130,paddingTop:"0.5rem"}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"0.25rem"}}>
          <div style={{fontSize:"0.68rem",color}}>{typeof d[valueKey]==="number"&&d[valueKey]>999?(d[valueKey]/1000).toFixed(1)+"k":d[valueKey]}</div>
          <div style={{width:"100%",borderRadius:"3px 3px 0 0",minHeight:4,background:`linear-gradient(to top,${color},${color}88)`,height:`${(d[valueKey]/max)*100}px`}}/>
          <div style={{fontSize:"0.68rem",color:"var(--muted)",whiteSpace:"nowrap",overflow:"hidden",maxWidth:"100%",textOverflow:"ellipsis",textAlign:"center"}}>{d[labelKey]}</div>
        </div>
      ))}
    </div>
  );
}

export default function Reports_Analytics() {
  const [tab,        setTab]        = useState("overview");
  const [summary,    setSummary]    = useState(null);
  const [byPeriod,   setByPeriod]   = useState([]);
  const [topProds,   setTopProds]   = useState([]);
  const [payMethods, setPayMethods] = useState([]);
  const [invVal,     setInvVal]     = useState(null);
  const [custAnal,   setCustAnal]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [fromDate,   setFromDate]   = useState(() => { const d=new Date(); d.setMonth(d.getMonth()-3); return d.toISOString().slice(0,10); });
  const [toDate,     setToDate]     = useState(() => new Date().toISOString().slice(0,10));

  useEffect(() => {
    setLoading(true);
    const params = { from_date:fromDate, to_date:toDate };
    Promise.all([
      api.get(`/reports/sales-summary/?from_date=${fromDate}&to_date=${toDate}`),
      api.get(`/reports/sales-by-period/?period=month&from_date=${fromDate}&to_date=${toDate}`),
      api.get(`/reports/top-products/?from_date=${fromDate}&to_date=${toDate}&limit=8`),
      api.get(`/reports/payment-methods/?from_date=${fromDate}&to_date=${toDate}`),
      api.get("/reports/inventory-valuation/"),
      api.get("/reports/customer-analytics/"),
    ]).then(([s,bp,tp,pm,iv,ca]) => {
      setSummary(s); setByPeriod(bp); setTopProds(tp);
      setPayMethods(pm); setInvVal(iv); setCustAnal(ca);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, [fromDate, toDate]);

  return (
    <div>
      <div className="main-header">
        <div><div className="main-title">Reports &amp; Analytics</div><div className="main-subtitle">Live data from the backend.</div></div>
        <div style={{display:"flex",gap:"0.5rem",alignItems:"center"}}>
          <input className="input" type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{fontSize:"0.82rem"}}/>
          <span style={{color:"var(--muted)",fontSize:"0.82rem"}}>to</span>
          <input className="input" type="date" value={toDate}   onChange={e=>setToDate(e.target.value)}   style={{fontSize:"0.82rem"}}/>
        </div>
      </div>

      {/* KPI cards */}
      {summary && (
        <div className="grid grid-4" style={{marginBottom:"1rem"}}>
          {[
            {label:"Total Revenue",   value:formatCurrencyNPR(summary.total_revenue),      color:"var(--success)"},
            {label:"Total Orders",    value:summary.total_orders},
            {label:"Avg. Order",      value:formatCurrencyNPR(summary.avg_order_value)},
            {label:"Total Refunded",  value:formatCurrencyNPR(summary.total_refunded),      color:"var(--danger)"},
          ].map(k=>(
            <div className="card" key={k.label}><div className="stat-label">{k.label}</div><div className="stat-value" style={{fontSize:"1.25rem",color:k.color}}>{k.value}</div></div>
          ))}
        </div>
      )}

      <div className="tab-strip">
        {["overview","products","inventory","customers"].map(t=>(
          <button key={t} className={"tab-btn"+(tab===t?" active":"")} onClick={()=>setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div style={{padding:"2rem",textAlign:"center",color:"var(--muted)"}}>Loading…</div>}

      {!loading && tab==="overview" && (
        <div className="grid grid-2">
          <div className="card">
            <div className="section-title">Revenue by Month</div>
            {byPeriod.length ? <BarChart data={byPeriod.map(d=>({...d,label:d.period.slice(0,7)}))} valueKey="revenue" labelKey="label"/> : <Empty/>}
          </div>
          <div className="card">
            <div className="section-title">Orders by Month</div>
            {byPeriod.length ? <BarChart data={byPeriod.map(d=>({...d,label:d.period.slice(0,7)}))} valueKey="order_count" labelKey="label" color="#38bdf8"/> : <Empty/>}
          </div>
          <div className="card">
            <div className="section-title">Payment Methods</div>
            {payMethods.length
              ? payMethods.map(pm=>(
                <div key={pm.payment_method} style={{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",padding:"0.3rem 0",borderBottom:"1px solid var(--border)"}}>
                  <span style={{textTransform:"capitalize"}}>{pm.payment_method}</span>
                  <span>{formatCurrencyNPR(pm.revenue)} <span style={{color:"var(--muted)",fontSize:"0.78rem"}}>({pm.order_count} orders)</span></span>
                </div>
              ))
              : <Empty/>
            }
          </div>
          <div className="card">
            <div className="section-title">Period Summary</div>
            {summary && [
              ["Total Revenue",   formatCurrencyNPR(summary.total_revenue)],
              ["Total Tax",       formatCurrencyNPR(summary.total_tax)],
              ["Total Discount",  formatCurrencyNPR(summary.total_discount)],
              ["Total Refunded",  formatCurrencyNPR(summary.total_refunded)],
              ["Avg. Order Value",formatCurrencyNPR(summary.avg_order_value)],
            ].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",padding:"0.3rem 0",borderBottom:"1px solid var(--border)"}}>
                <span style={{color:"var(--muted)"}}>{l}</span><span style={{fontWeight:500}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && tab==="products" && (
        <div className="card">
          <div className="section-title">Top Products by Revenue</div>
          {topProds.length
            ? <div className="table-wrap"><table>
                <thead><tr><th>#</th><th>Product</th><th>SKU</th><th style={{textAlign:"right"}}>Units Sold</th><th style={{textAlign:"right"}}>Revenue</th></tr></thead>
                <tbody>
                  {topProds.map((p,i)=>(
                    <tr key={p.product_id}>
                      <td style={{color:"var(--muted)"}}>{i+1}</td>
                      <td style={{fontWeight:500}}>{p.product_name}</td>
                      <td style={{color:"var(--muted)",fontSize:"0.8rem"}}>{p.product_sku}</td>
                      <td style={{textAlign:"right"}}>{p.units_sold}</td>
                      <td style={{textAlign:"right"}}>{formatCurrencyNPR(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            : <Empty text="No sales data in this period."/>
          }
        </div>
      )}

      {!loading && tab==="inventory" && invVal && (
        <div className="grid grid-2">
          <div className="card">
            <div className="section-title">Stock Valuation Summary</div>
            {[
              ["Cost Value",          formatCurrencyNPR(invVal.summary.total_cost_value)],
              ["Retail Value",        formatCurrencyNPR(invVal.summary.total_retail_value)],
              ["Gross Margin",        formatCurrencyNPR(invVal.summary.gross_margin_potential)],
            ].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",padding:"0.35rem 0",borderBottom:"1px solid var(--border)"}}>
                <span style={{color:"var(--muted)"}}>{l}</span><span style={{fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="section-title">Per-Product Breakdown</div>
            <div className="table-wrap"><table>
              <thead><tr><th>Product</th><th style={{textAlign:"right"}}>Stock</th><th style={{textAlign:"right"}}>Margin%</th><th style={{textAlign:"right"}}>Cost Value</th></tr></thead>
              <tbody>
                {invVal.products.map(p=>(
                  <tr key={p.product_id}>
                    <td style={{fontWeight:500}}>{p.product_name}</td>
                    <td style={{textAlign:"right",color:p.is_low_stock?"var(--warning)":"var(--text)"}}>{p.stock}</td>
                    <td style={{textAlign:"right"}}><span className="badge green">{p.margin_pct}%</span></td>
                    <td style={{textAlign:"right"}}>{formatCurrencyNPR(p.cost_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </div>
      )}

      {!loading && tab==="customers" && custAnal && (
        <div className="grid grid-2">
          <div className="card">
            <div className="section-title">Tier Distribution</div>
            {custAnal.tier_distribution.map(t=>(
              <div key={t.tier} style={{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",padding:"0.35rem 0",borderBottom:"1px solid var(--border)"}}>
                <span style={{textTransform:"capitalize"}}>{t.tier}</span>
                <span style={{fontWeight:600}}>{t.count} customers</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="section-title">Top 10 Customers</div>
            <div className="table-wrap"><table>
              <thead><tr><th>Name</th><th>Tier</th><th style={{textAlign:"right"}}>Orders</th><th style={{textAlign:"right"}}>Spent</th></tr></thead>
              <tbody>
                {custAnal.top_customers.map(c=>(
                  <tr key={c.customer_id}>
                    <td style={{fontWeight:500}}>{c.full_name}</td>
                    <td><span className={`badge ${TIER_COLOR[c.tier]||"gray"}`}>{c.tier}</span></td>
                    <td style={{textAlign:"right"}}>{c.total_orders}</td>
                    <td style={{textAlign:"right"}}>{formatCurrencyNPR(c.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </div>
      )}
    </div>
  );
}
const TIER_COLOR = {platinum:"teal",gold:"amber",silver:"blue",bronze:"green"};
function Empty({text="No data yet."}) {
  return <div style={{padding:"2rem 0",textAlign:"center",color:"var(--muted)",fontSize:"0.85rem"}}>{text}</div>;
}