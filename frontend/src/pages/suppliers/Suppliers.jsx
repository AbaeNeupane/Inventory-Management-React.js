import React, { useState, useEffect, useCallback } from "react";
import api from "../../api";

const stars = n => "★".repeat(n) + "☆".repeat(5 - n);

const EMPTY_FORM = {
  name: "", contact_name: "", phone: "", email: "",
  address: "", payment_terms: "net30", rating: 3,
  outstanding: 0, notes: "", is_active: true,
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [query,     setQuery]     = useState("");
  const [filter,    setFilter]    = useState("all");
  const [modal,     setModal]     = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState(null);
  const [editId,    setEditId]    = useState(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await api.list("/suppliers/", { page_size: 100 });
      setSuppliers(data.results ?? data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const filtered = suppliers.filter(s => {
    const q  = query.toLowerCase();
    const mq = !q || s.name.toLowerCase().includes(q)
                  || (s.contact_name||"").toLowerCase().includes(q)
                  || (s.email||"").toLowerCase().includes(q);
    const mf = filter === "all"
      || (filter === "active" && s.is_active)
      || (filter === "inactive" && !s.is_active);
    return mq && mf;
  });

  const totalOutstanding = suppliers.reduce((a,s) => a + parseFloat(s.outstanding||0), 0);
  const activeCount = suppliers.filter(s => s.is_active).length;

  function openAdd() { setForm(EMPTY_FORM); setEditId(null); setFormError(null); setModal("add"); }
  function openEdit(s) {
    setForm({ name: s.name, contact_name: s.contact_name||"", phone: s.phone||"",
      email: s.email||"", address: s.address||"", payment_terms: s.payment_terms||"net30",
      rating: s.rating||3, outstanding: s.outstanding||0, notes: s.notes||"", is_active: s.is_active });
    setEditId(s.id); setFormError(null); setModal("edit");
  }
  function closeModal() { setModal(null); setFormError(null); }
  function handleField(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setFormError(null);
    try {
      if (modal === "edit") await api.patch(`/suppliers/${editId}/`, form);
      else await api.post("/suppliers/", form);
      await fetchSuppliers(); closeModal();
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Remove supplier "${name}"?`)) return;
    try { await api.delete(`/suppliers/${id}/`); setSuppliers(prev => prev.filter(s => s.id !== id)); }
    catch (err) { alert("Error: " + err.message); }
  }

  return (
    <div>
      <div className="main-header">
        <div>
          <div className="main-title">Suppliers</div>
          <div className="main-subtitle">Supplier records, performance ratings &amp; outstanding payables.</div>
        </div>
        <div style={{ display:"flex", gap:"0.5rem" }}>
          <input className="input" placeholder="Search suppliers…" value={query}
            onChange={e => setQuery(e.target.value)} style={{ minWidth:200 }} />
          <button className="button primary" onClick={openAdd}>+ Add Supplier</button>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom:"1rem" }}>
        <div className="card"><div className="stat-label">Total Suppliers</div><div className="stat-value">{suppliers.length}</div></div>
        <div className="card"><div className="stat-label">Active</div><div className="stat-value" style={{color:"var(--success)"}}>{activeCount}</div></div>
        <div className="card"><div className="stat-label">Total Outstanding</div>
          <div className="stat-value" style={{fontSize:"1.3rem",color:"var(--warning)"}}>Rs {totalOutstanding.toLocaleString()}</div></div>
      </div>

      <div className="card">
        <div className="tab-strip">
          {["all","active","inactive"].map(f => (
            <button key={f} className={"tab-btn"+(filter===f?" active":"")} onClick={()=>setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>

        {loading && <div style={{padding:"2rem",textAlign:"center",color:"var(--muted)"}}>Loading…</div>}
        {error   && <div style={{padding:"1rem",color:"var(--danger)"}}>Error: {error}</div>}

        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Supplier</th><th>Contact</th><th>Payment Terms</th>
                <th>Status</th><th style={{textAlign:"right"}}>Outstanding (Rs)</th>
                <th>Rating</th><th style={{textAlign:"right"}}>Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td><div style={{fontWeight:500}}>{s.name}</div><div style={{fontSize:"0.77rem",color:"var(--muted)"}}>{s.email}</div></td>
                    <td><div>{s.contact_name}</div><div style={{fontSize:"0.77rem",color:"var(--muted)"}}>{s.phone}</div></td>
                    <td style={{color:"var(--muted)"}}>{s.payment_terms}</td>
                    <td><span className={`badge ${s.is_active?"green":"red"}`}>{s.is_active?"Active":"Inactive"}</span></td>
                    <td style={{textAlign:"right",color:parseFloat(s.outstanding)>0?"var(--warning)":"var(--muted)"}}>
                      {parseFloat(s.outstanding)>0 ? parseFloat(s.outstanding).toLocaleString() : "—"}
                    </td>
                    <td style={{color:"#fbbf24",letterSpacing:"-0.05em"}}>{stars(s.rating)}</td>
                    <td style={{textAlign:"right"}}>
                      <button className="button" style={{marginRight:"0.25rem"}} onClick={()=>openEdit(s)}>Edit</button>
                      <button className="button danger" onClick={()=>handleDelete(s.id,s.name)}>Remove</button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={7}>
                  <div className="empty-state"><div className="icon">🏭</div>No suppliers found.</div>
                </td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div style={OV} onClick={closeModal}>
          <div style={BOX} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",fontSize:"1rem"}}>
              <span style={{fontWeight:600}}>{modal==="edit"?"Edit Supplier":"Add Supplier"}</span>
              <button onClick={closeModal} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:"1rem"}}>✕</button>
            </div>
            {formError && <div style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:"0.5rem",padding:"0.6rem 0.9rem",fontSize:"0.83rem",color:"#fca5a5",marginBottom:"0.75rem"}}>{formError}</div>}
            <form onSubmit={handleSave} style={{display:"flex",flexDirection:"column",gap:"0.65rem"}}>
              <div style={{display:"flex",gap:"0.75rem"}}>
                <F label="Supplier Name *" name="name"         value={form.name}         onChange={handleField} required />
                <F label="Contact Person"  name="contact_name" value={form.contact_name} onChange={handleField} />
              </div>
              <div style={{display:"flex",gap:"0.75rem"}}>
                <F label="Phone" name="phone" value={form.phone} onChange={handleField} />
                <F label="Email" name="email" value={form.email} onChange={handleField} type="email" />
              </div>
              <F label="Address" name="address" value={form.address} onChange={handleField} />
              <div style={{display:"flex",gap:"0.75rem"}}>
                <div style={{flex:1}}>
                  <label style={LBL}>Payment Terms</label>
                  <select className="input" name="payment_terms" value={form.payment_terms} onChange={handleField} style={{width:"100%"}}>
                    {[["cod","COD"],["net15","Net 15"],["net30","Net 30"],["net45","Net 45"],["net60","Net 60"]].map(([v,l])=>(
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={LBL}>Rating (1–5)</label>
                  <input className="input" type="number" name="rating" min={1} max={5} value={form.rating} onChange={handleField} style={{width:"100%"}} />
                </div>
              </div>
              <div style={{display:"flex",gap:"0.75rem"}}>
                <F label="Outstanding (Rs)" name="outstanding" value={form.outstanding} onChange={handleField} type="number" />
                <div style={{flex:1,display:"flex",alignItems:"center",gap:"0.5rem",paddingTop:"1.4rem"}}>
                  <input type="checkbox" id="is_active" name="is_active" checked={form.is_active} onChange={handleField}
                    style={{accentColor:"var(--primary)",width:16,height:16}} />
                  <label htmlFor="is_active" style={{fontSize:"0.85rem",cursor:"pointer"}}>Active</label>
                </div>
              </div>
              <F label="Notes" name="notes" value={form.notes} onChange={handleField} />
              <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end",marginTop:"0.25rem"}}>
                <button type="button" className="button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="button primary" disabled={saving}>
                  {saving ? "Saving…" : modal==="edit" ? "Save Changes" : "Add Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, name, value, onChange, type="text", required=false }) {
  return (
    <div style={{flex:1}}>
      <label style={LBL}>{label}</label>
      <input className="input" type={type} name={name} value={value} onChange={onChange} required={required} style={{width:"100%"}} />
    </div>
  );
}

const LBL = { display:"block", fontSize:"0.78rem", color:"var(--muted)", marginBottom:"0.3rem" };
const OV  = { position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex",
              alignItems:"center", justifyContent:"center", zIndex:1000, padding:"1rem" };
const BOX = { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"0.75rem",
              padding:"1.5rem", width:"100%", maxWidth:"560px", maxHeight:"90vh", overflowY:"auto" };