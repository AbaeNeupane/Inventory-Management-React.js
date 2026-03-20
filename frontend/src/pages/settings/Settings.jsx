import React, { useState, useEffect } from "react";
import api from "../../api";

const EMPTY_USER = { full_name:"", email:"", role:"cashier", password:"" };

export default function Settings() {
  const [tab,      setTab]      = useState("company");
  const [company,  setCompany]  = useState(null);
  const [tax,      setTax]      = useState(null);
  const [notif,    setNotif]    = useState(null);
  const [users,    setUsers]    = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState(null);
  const [userModal,setUserModal]= useState(null); // null | "add" | "edit"
  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [editUserId,setEditUserId]=useState(null);
  const [userErr,  setUserErr]  = useState(null);
  const [userSaving,setUserSaving]=useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/settings/company/"),
      api.get("/settings/tax/"),
      api.get("/settings/notifications/"),
      api.list("/auth/users/", { page_size:50 }),
    ]).then(([c,t,n,u]) => {
      setCompany(c); setTax(t); setNotif(n);
      setUsers(u.results ?? u);
    }).catch(()=>{});
  }, []);

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false);
    try {
      if (tab==="company")       await api.patch("/settings/company/",       company);
      if (tab==="tax")           await api.patch("/settings/tax/",           tax);
      if (tab==="notifications") await api.patch("/settings/notifications/", notif);
      setSaved(true); setTimeout(()=>setSaved(false), 2500);
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  function openAddUser()  { setUserForm(EMPTY_USER); setEditUserId(null); setUserErr(null); setUserModal("add"); }
  function openEditUser(u){ setUserForm({full_name:u.full_name,email:u.email,role:u.role,password:""}); setEditUserId(u.id); setUserErr(null); setUserModal("edit"); }
  function closeUserModal(){ setUserModal(null); setUserErr(null); }

  async function handleUserSave(e) {
    e.preventDefault(); setUserSaving(true); setUserErr(null);
    try {
      const body = userModal==="edit"
        ? { full_name:userForm.full_name, role:userForm.role }
        : userForm;
      if (userModal==="edit") await api.patch(`/auth/users/${editUserId}/`, body);
      else await api.post("/auth/users/", body);
      const u = await api.list("/auth/users/", { page_size:50 });
      setUsers(u.results ?? u);
      closeUserModal();
    } catch(err) { setUserErr(err.message); }
    finally { setUserSaving(false); }
  }

  async function handleRevokeUser(id, name) {
    if (!window.confirm(`Revoke access for "${name}"?`)) return;
    try {
      await api.patch(`/auth/users/${id}/`, { is_active:false });
      setUsers(p => p.map(u => u.id===id ? {...u,is_active:false} : u));
    } catch(err) { alert(err.message); }
  }

  const canSave = tab==="company"||tab==="tax"||tab==="notifications";

  return (
    <div>
      <div className="main-header">
        <div><div className="main-title">Settings</div><div className="main-subtitle">Company profile, tax, users &amp; notification preferences.</div></div>
        {canSave && (
          <button className="button primary" onClick={handleSave} disabled={saving}>
            {saving?"Saving…":saved?"✓ Saved!":"Save Changes"}
          </button>
        )}
      </div>
      {error && <div style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:"0.5rem",padding:"0.6rem 0.9rem",fontSize:"0.83rem",color:"#fca5a5",marginBottom:"1rem"}}>{error}</div>}

      <div className="tab-strip">
        {["company","tax","users","notifications"].map(t=>(
          <button key={t} className={"tab-btn"+(tab===t?" active":"")} onClick={()=>setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab==="company" && company && (
        <div className="card" style={{maxWidth:560}}>
          <div className="section-title">Company Information</div>
          {[
            {label:"Business Name", key:"name"},
            {label:"Address",       key:"address"},
            {label:"Phone",         key:"phone"},
            {label:"Email",         key:"email"},
            {label:"PAN Number",    key:"pan_no"},
            {label:"VAT Number",    key:"vat_no"},
          ].map(f=>(
            <div key={f.key} style={{marginBottom:"0.75rem"}}>
              <label style={LBL}>{f.label}</label>
              <input className="input" style={{width:"100%"}} value={company[f.key]||""} onChange={e=>setCompany(p=>({...p,[f.key]:e.target.value}))}/>
            </div>
          ))}
          <div>
            <label style={LBL}>Default Currency</label>
            <select className="input" style={{width:"100%"}} value={company.currency||"NPR"} onChange={e=>setCompany(p=>({...p,currency:e.target.value}))}>
              <option value="NPR">NPR – Nepalese Rupee</option>
              <option value="USD">USD – US Dollar</option>
              <option value="INR">INR – Indian Rupee</option>
            </select>
          </div>
        </div>
      )}

      {tab==="tax" && tax && (
        <div className="card" style={{maxWidth:480}}>
          <div className="section-title">Tax Configuration</div>
          <div style={{marginBottom:"0.75rem"}}>
            <label style={LBL}>Default VAT Rate (%)</label>
            <input className="input" style={{width:"100%"}} type="number" min={0} max={100}
              value={tax.default_vat_rate||""} onChange={e=>setTax(p=>({...p,default_vat_rate:e.target.value}))}/>
          </div>
          {[
            {key:"vat_enabled",    label:"Enable VAT on all products by default"},
            {key:"pan_on_receipt", label:"Print PAN number on receipts"},
            {key:"vat_on_receipt", label:"Print VAT breakdown on receipts"},
            {key:"tax_inclusive",  label:"Prices are tax-inclusive"},
          ].map(f=>(
            <label key={f.key} style={{display:"flex",alignItems:"center",gap:"0.6rem",fontSize:"0.85rem",marginBottom:"0.7rem",cursor:"pointer"}}>
              <input type="checkbox" checked={!!tax[f.key]} onChange={e=>setTax(p=>({...p,[f.key]:e.target.checked}))}
                style={{accentColor:"var(--primary)",width:16,height:16}}/>{f.label}
            </label>
          ))}
        </div>
      )}

      {tab==="users" && (
        <div className="card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
            <div className="section-title" style={{margin:0}}>Team Members</div>
            <button className="button primary" onClick={openAddUser}>+ Invite User</button>
          </div>
          <div className="table-wrap"><table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th style={{textAlign:"right"}}>Actions</th></tr></thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id}>
                  <td style={{fontWeight:500}}>{u.full_name}</td>
                  <td style={{color:"var(--muted)"}}>{u.email}</td>
                  <td><span className="badge blue" style={{textTransform:"capitalize"}}>{u.role}</span></td>
                  <td><span className={`badge ${u.is_active?"green":"red"}`}>{u.is_active?"Active":"Inactive"}</span></td>
                  <td style={{textAlign:"right"}}>
                    <button className="button" style={{marginRight:"0.25rem"}} onClick={()=>openEditUser(u)}>Edit</button>
                    <button className="button danger" onClick={()=>handleRevokeUser(u.id,u.full_name)}>Revoke</button>
                  </td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={5}><div className="empty-state"><div className="icon">👥</div>No users found.</div></td></tr>}
            </tbody>
          </table></div>
        </div>
      )}

      {tab==="notifications" && notif && (
        <div className="card" style={{maxWidth:480}}>
          <div className="section-title">Notification Preferences</div>
          {[
            {key:"low_stock_alert",label:"Low stock alerts",   desc:"Get notified when items fall below reorder level"},
            {key:"daily_report",   label:"Daily sales report", desc:"Receive a daily sales summary"},
            {key:"order_confirm",  label:"Order confirmations",desc:"Notify on every completed POS sale"},
          ].map(n=>(
            <label key={n.key} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"0.75rem",marginBottom:"1rem",cursor:"pointer"}}>
              <div><div style={{fontSize:"0.87rem",fontWeight:500}}>{n.label}</div><div style={{fontSize:"0.78rem",color:"var(--muted)",marginTop:"0.1rem"}}>{n.desc}</div></div>
              <input type="checkbox" checked={!!notif[n.key]} onChange={e=>setNotif(p=>({...p,[n.key]:e.target.checked}))}
                style={{accentColor:"var(--primary)",width:18,height:18,marginTop:"0.15rem",flexShrink:0}}/>
            </label>
          ))}
          <div style={{marginTop:"0.5rem"}}>
            <label style={LBL}>Low-stock alert email</label>
            <input className="input" style={{width:"100%"}} type="email" value={notif.low_stock_email||""} onChange={e=>setNotif(p=>({...p,low_stock_email:e.target.value}))} placeholder="alerts@example.com"/>
          </div>
        </div>
      )}

      {/* User modal */}
      {userModal && (
        <div style={OV} onClick={closeUserModal}>
          <div style={BOX} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
              <span style={{fontWeight:600}}>{userModal==="edit"?"Edit User":"Invite User"}</span>
              <button onClick={closeUserModal} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:"1rem"}}>✕</button>
            </div>
            {userErr && <div style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:"0.5rem",padding:"0.6rem 0.9rem",fontSize:"0.83rem",color:"#fca5a5",marginBottom:"0.75rem"}}>{userErr}</div>}
            <form onSubmit={handleUserSave} style={{display:"flex",flexDirection:"column",gap:"0.65rem"}}>
              <div>
                <label style={LBL}>Full Name *</label>
                <input className="input" style={{width:"100%"}} value={userForm.full_name} onChange={e=>setUserForm(p=>({...p,full_name:e.target.value}))} required/>
              </div>
              {userModal==="add" && (
                <div>
                  <label style={LBL}>Email *</label>
                  <input className="input" style={{width:"100%"}} type="email" value={userForm.email} onChange={e=>setUserForm(p=>({...p,email:e.target.value}))} required/>
                </div>
              )}
              <div>
                <label style={LBL}>Role</label>
                <select className="input" style={{width:"100%"}} value={userForm.role} onChange={e=>setUserForm(p=>({...p,role:e.target.value}))}>
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              {userModal==="add" && (
                <div>
                  <label style={LBL}>Password *</label>
                  <input className="input" style={{width:"100%"}} type="password" value={userForm.password} onChange={e=>setUserForm(p=>({...p,password:e.target.value}))} required minLength={8}/>
                </div>
              )}
              <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end",marginTop:"0.25rem"}}>
                <button type="button" className="button" onClick={closeUserModal}>Cancel</button>
                <button type="submit" className="button primary" disabled={userSaving}>
                  {userSaving?"Saving…":userModal==="edit"?"Save Changes":"Send Invite"}
                </button>
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
const BOX = {background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"0.75rem",padding:"1.5rem",width:"100%",maxWidth:"460px",maxHeight:"90vh",overflowY:"auto"};