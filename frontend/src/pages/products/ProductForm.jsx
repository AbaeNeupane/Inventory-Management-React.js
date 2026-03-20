import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";

const EMPTY = {
  name:"", sku:"", description:"",
  category:"", brand:"",
  price:"", cost:"", tax_rate:"13",
  stock:"", reorder_level:"10",
  is_active: true,
};

export default function ProductForm({ mode }) {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = mode === "edit";

  const [form,       setForm]       = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [brands,     setBrands]     = useState([]);
  const [errors,     setErrors]     = useState({});
  const [submitted,  setSubmitted]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [apiError,   setApiError]   = useState(null);

  useEffect(() => {
    api.list("/products/categories/", { page_size:100 })
      .then(d => setCategories(d.results ?? d)).catch(()=>{});
    api.list("/products/brands/", { page_size:100 })
      .then(d => setBrands(d.results ?? d)).catch(()=>{});

    if (isEdit && id) {
      api.get(`/products/${id}/`).then(p => {
        setForm({
          name:          p.name,
          sku:           p.sku,
          description:   p.description || "",
          category:      p.category    || "",
          brand:         p.brand       || "",
          price:         String(p.price),
          cost:          String(p.cost),
          tax_rate:      String(p.tax_rate),
          stock:         String(p.stock),
          reorder_level: String(p.reorder_level),
          is_active:     p.is_active,
        });
      }).catch(()=>{});
    }
  }, [isEdit, id]);

  function hf(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (submitted) validate({ ...form, [name]: value });
  }

  function validate(f = form) {
    const e = {};
    if (!f.name.trim())                e.name     = "Name is required";
    if (!f.sku.trim())                 e.sku      = "SKU is required";
    if (!f.category)                   e.category = "Select a category";
    if (!f.price || +f.price <= 0)     e.price    = "Enter a valid selling price";
    if (f.cost === "" || +f.cost < 0)  e.cost     = "Enter a valid cost";
    if (f.stock === "" || +f.stock < 0)e.stock    = "Enter a valid stock quantity";
    setErrors(e);
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    setApiError(null);
    const errs = validate();
    if (Object.keys(errs).length) return;

    const payload = {
      name:          form.name.trim(),
      sku:           form.sku.trim().toUpperCase(),
      description:   form.description.trim(),
      category:      form.category    ? parseInt(form.category)   : null,
      brand:         form.brand       ? parseInt(form.brand)      : null,
      price:         parseFloat(form.price),
      cost:          parseFloat(form.cost),
      tax_rate:      parseFloat(form.tax_rate  || 13),
      stock:         parseInt(form.stock),
      reorder_level: parseInt(form.reorder_level || 0),
      is_active:     form.is_active,
    };

    setSaving(true);
    try {
      if (isEdit) await api.patch(`/products/${id}/`, payload);
      else        await api.post("/products/", payload);
      navigate("/products");
    } catch(err) {
      setApiError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="main-header">
        <div>
          <div className="main-title">{isEdit ? "Edit Product" : "Add Product"}</div>
          <div className="main-subtitle">{isEdit ? "Update catalog, pricing and stock." : "Add a new item to your catalog."}</div>
        </div>
      </div>

      {apiError && (
        <div style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",
          borderRadius:"0.5rem",padding:"0.75rem 1rem",fontSize:"0.85rem",color:"#fca5a5",marginBottom:"1rem"}}>
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="grid grid-2" style={{gap:"0.9rem"}}>
          <Field label="Product Name *" error={errors.name}>
            <input className="input" name="name" value={form.name} onChange={hf} style={{width:"100%"}} required/>
          </Field>
          <Field label="SKU *" error={errors.sku}>
            <input className="input" name="sku" value={form.sku} onChange={hf} style={{width:"100%"}} required/>
          </Field>
          <Field label="Category *" error={errors.category}>
            <select className="input" name="category" value={form.category} onChange={hf} style={{width:"100%"}}>
              <option value="">Select category…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Brand">
            <select className="input" name="brand" value={form.brand} onChange={hf} style={{width:"100%"}}>
              <option value="">No brand</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Selling Price (Rs) *" error={errors.price}>
            <input className="input" name="price" type="number" min={0} step="0.01" value={form.price} onChange={hf} style={{width:"100%"}} required/>
          </Field>
          <Field label="Cost Price (Rs) *" error={errors.cost}>
            <input className="input" name="cost" type="number" min={0} step="0.01" value={form.cost} onChange={hf} style={{width:"100%"}} required/>
          </Field>
          <Field label="Opening Stock *" error={errors.stock}>
            <input className="input" name="stock" type="number" min={0} value={form.stock} onChange={hf} style={{width:"100%"}} required/>
          </Field>
          <Field label="Reorder Level">
            <input className="input" name="reorder_level" type="number" min={0} value={form.reorder_level} onChange={hf} style={{width:"100%"}}/>
          </Field>
          <Field label="Tax Rate (%)">
            <input className="input" name="tax_rate" type="number" min={0} max={100} step="0.01" value={form.tax_rate} onChange={hf} style={{width:"100%"}}/>
          </Field>
          <Field label="Description">
            <input className="input" name="description" value={form.description} onChange={hf} style={{width:"100%"}} placeholder="Optional…"/>
          </Field>
        </div>

        <label style={{display:"flex",alignItems:"center",gap:"0.5rem",fontSize:"0.85rem",marginTop:"0.75rem",cursor:"pointer"}}>
          <input type="checkbox" name="is_active" checked={form.is_active} onChange={hf}
            style={{accentColor:"var(--primary)",width:16,height:16}}/>
          Active (visible in POS and product list)
        </label>

        <div style={{marginTop:"1.25rem",display:"flex",gap:"0.5rem"}}>
          <button type="submit" className="button primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
          </button>
          <button type="button" className="button" onClick={() => navigate("/products")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{display:"block",fontSize:"0.78rem",color:"var(--muted)",marginBottom:"0.3rem"}}>{label}</label>
      {children}
      {error && <div style={{fontSize:"0.75rem",color:"var(--danger)",marginTop:"0.2rem"}}>{error}</div>}
    </div>
  );
}