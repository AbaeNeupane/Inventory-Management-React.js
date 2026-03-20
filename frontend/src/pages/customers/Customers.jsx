import React, { useState, useEffect, useCallback } from "react";
import api from "../../api";
import { formatCurrencyNPR } from "../../utils/currency";

const TIER_COLOR = { platinum:"teal", gold:"amber", silver:"blue", bronze:"green" };
const EMPTY_FORM = { full_name:"", phone:"", email:"", address:"", notes:"", is_active:true };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [query,     setQuery]     = useState("");
  const [tab,       setTab]       = useState("all");
  const [modal,     setModal]     = useState(null); // null | "add" | "edit" | "orders"
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [editId,    setEditId]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [formErr,   setFormErr]   = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [ordersFor, setOrdersFor] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const d = await api.list("/customers/", { page_size:100 });
      setCustomers(d.results ?? d);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = customers.filter(c => {
    const q = query.toLowerCase();
    const mq = !q || c.full_name.toLowerCase().includes(q) || (c.email||"").includes(q) || (c.phone||"").includes(q);
    const mt = tab === "all" || c.tier === tab;
    return mq && mt;
  });

  const totalRevenue = customers.reduce((s,c) => s + (c.total_spent||0), 0);
  const avgSpend     = customers.length ? Math.round(totalRevenue / customers.length) : 0;

  function openAdd() { setForm(EMPTY_FORM); setEditId(null); setFormErr(null); setModal("add"); }
  function openEdit(c) {
    setForm({ full_name:c.full_name, phone:c.phone||"", email:c.email||"",
              address:c.address||"", notes:c.notes||"", is_active:c.is_active });
    setEditId(c.id); setFormErr(null); setModal("edit");
  }
  async function openOrders(c) {
    setOrdersFor(c); setOrders([]); setModal("orders");
    try {
      const d = await api.get(`/customers/${c.id}/orders/`);
      setOrders(d.results ?? d);
    } catch {}
  }
  function closeModal() { setModal(null); setFormErr(null); }
  function hf(e) {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type==="checkbox" ? checked : value }));
  }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setFormErr(null);
    try {
      if (modal==="edit") await api.patch(`/customers/${editId}/`, form);
      else await api.post("/customers/", form);
      await fetch(); closeModal();
    } catch(err) { setFormErr(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Remove customer "${name}"?`)) return;
    try { await api.delete(`/customers/${id}/`); setCustomers(p => p.filter(c => c.id!==id)); }
    catch(err) { alert(err.message); }
  }

  return (
    <div>
      <div className="main-header">
        <div><div className="main-title">Customers</div><div className="main-subtitle">Customer records, loyalty tiers &amp; purchase history.</div></div>
        <div style={{display:"flex",gap:"0.5rem"}}>
          <input className="input" placeholder="Search customers…" value={query} onChange={e=>setQuery(e.target.value)} style={{minWidth:200}}/>
          <button className="button primary" onClick={openAdd}>+ Add Customer</button>
        </div>
      </div>

      <div className="grid grid-4" style={{marginBottom:"1rem"}}>
        {[
          {label:"Total Customers", value:customers.length},
          {label:"Total Revenue",   value:`Rs ${totalRevenue.toLocaleString()}`},
          {label:"Avg. Spend",      value:`Rs ${avgSpend.toLocaleString()}`},
          {label:"Active",          value:customers.filter(c=>c.is_active).length},
        ].map(s=>(
          <div className="card" key={s.label}><div className="stat-label">{s.label}</div><div className="stat-value" style={{fontSize:"1.35rem"}}>{s.value}</div></div>
        ))}
      </div>

      <div className="card">
        <div className="tab-strip">
          {["all","platinum","gold","silver","bronze"].map(t=>(
            <button key={t} className={"tab-btn"+(tab===t?" active":"")} onClick={()=>setTab(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
        {loading && <div style={{padding:"2rem",textAlign:"center",color:"var(--muted)"}}>Loading…</div>}
        {error   && <div style={{padding:"1rem",color:"var(--danger)"}}>Error: {error}</div>}
        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Name</th><th>Phone</th><th>Email</th><th>Tier</th>
                <th style={{textAlign:"right"}}>Orders</th>
                <th style={{textAlign:"right"}}>Total Spent</th>
                <th style={{textAlign:"right"}}>Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(c=>(
                  <tr key={c.id}>
                    <td style={{fontWeight:500}}>{c.full_name}</td>
                    <td style={{color:"var(--muted)"}}>{c.phone}</td>
                    <td style={{color:"var(--muted)"}}>{c.email}</td>
                    <td><span className={`badge ${TIER_COLOR[c.tier]||"gray"}`}>{c.tier}</span></td>
                    <td style={{textAlign:"right"}}>{c.total_orders||0}</td>
                    <td style={{textAlign:"right"}}>{formatCurrencyNPR(c.total_spent||0)}</td>
                    <td style={{textAlign:"right"}}>
                      <button className="button" style={{marginRight:"0.25rem"}} onClick={()=>openOrders(c)}>Orders</button>
                      <button className="button" style={{marginRight:"0.25rem"}} onClick={()=>openEdit(c)}>Edit</button>
                      <button className="button danger" onClick={()=>handleDelete(c.id,c.full_name)}>Remove</button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={7}><div className="empty-state"><div className="icon">👤</div>No customers found.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(modal==="add"||modal==="edit") && (
        <div style={OV} onClick={closeModal}>
          <div style={BOX} onClick={e=>e.stopPropagation()}>
            <ModalHeader title={modal==="edit"?"Edit Customer":"Add Customer"} onClose={closeModal}/>
            {formErr && <ErrBox msg={formErr}/>}
            <form onSubmit={handleSave} style={{display:"flex",flexDirection:"column",gap:"0.65rem"}}>
              <div style={{display:"flex",gap:"0.75rem"}}>
                <F label="Full Name *" name="full_name" value={form.full_name} onChange={hf} required/>
                <F label="Phone"       name="phone"     value={form.phone}     onChange={hf}/>
              </div>
              <F label="Email" name="email" value={form.email} onChange={hf} type="email"/>
              <F label="Address" name="address" value={form.address} onChange={hf}/>
              <F label="Notes"   name="notes"   value={form.notes}   onChange={hf}/>
              <label style={{display:"flex",alignItems:"center",gap:"0.5rem",fontSize:"0.85rem",cursor:"pointer"}}>
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={hf}
                  style={{accentColor:"var(--primary)",width:16,height:16}}/>
                Active
              </label>
              <ModalFooter onClose={closeModal} saving={saving} label={modal==="edit"?"Save Changes":"Add Customer"}/>
            </form>
          </div>
        </div>
      )}

      {/* Order history modal */}
      {modal==="orders" && ordersFor && (
        <div style={OV} onClick={closeModal}>
          <div style={{...BOX,maxWidth:640}} onClick={e=>e.stopPropagation()}>
            <ModalHeader title={`Orders — ${ordersFor.full_name}`} onClose={closeModal}/>
            {!orders.length
              ? <div style={{color:"var(--muted)",fontSize:"0.85rem",padding:"1rem 0"}}>No orders found.</div>
              : <div className="table-wrap"><table>
                  <thead><tr><th>#</th><th>Date</th><th>Payment</th><th>Status</th><th style={{textAlign:"right"}}>Total</th></tr></thead>
                  <tbody>
                    {orders.map(o=>(
                      <tr key={o.id}>
                        <td style={{color:"var(--muted)"}}>#{o.id}</td>
                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                        <td>{o.payment_method}</td>
                        <td><span className={`badge ${o.status==="completed"?"green":o.status==="refunded"?"amber":"red"}`}>{o.status}</span></td>
                        <td style={{textAlign:"right"}}>{formatCurrencyNPR(o.grand_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
            }
          </div>
        </div>
      )}
    </div>
  );
}

function F({label,name,value,onChange,type="text",required=false}) {
  return <div style={{flex:1}}><label style={LBL}>{label}</label><input className="input" type={type} name={name} value={value} onChange={onChange} required={required} style={{width:"100%"}}/></div>;
}
function ModalHeader({title,onClose}) {
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}><span style={{fontWeight:600}}>{title}</span><button onClick={onClose} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:"1rem"}}>✕</button></div>;
}
function ModalFooter({onClose,saving,label}) {
  return <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end",marginTop:"0.25rem"}}><button type="button" className="button" onClick={onClose}>Cancel</button><button type="submit" className="button primary" disabled={saving}>{saving?"Saving…":label}</button></div>;
}
function ErrBox({msg}) {
  return <div style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:"0.5rem",padding:"0.6rem 0.9rem",fontSize:"0.83rem",color:"#fca5a5",marginBottom:"0.75rem"}}>{msg}</div>;
}
const LBL = {display:"block",fontSize:"0.78rem",color:"var(--muted)",marginBottom:"0.3rem"};
const OV  = {position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"};
const BOX = {background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"0.75rem",padding:"1.5rem",width:"100%",maxWidth:"520px",maxHeight:"90vh",overflowY:"auto"};