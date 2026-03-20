import React from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login       from "./pages/auth/Login";
import Dashboard   from "./pages/Dashboard";
import Products    from "./pages/products/Products";
import ProductForm from "./pages/products/ProductForm";
import Inventory   from "./pages/inventory/Inventory";
import POS         from "./pages/sales/POS";
import Customers   from "./pages/customers/Customers";
import Suppliers   from "./pages/suppliers/Suppliers";
import Reports     from "./pages/reports/Reports";
import Settings    from "./pages/settings/Settings";

function SidebarLink({ to, label, badge }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
    >
      <span>{label}</span>
      {badge && <span style={{ fontSize:"0.68rem", opacity:0.7 }}>{badge}</span>}
    </NavLink>
  );
}

function UserChip() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const roleColor = { owner:"#5eead4", manager:"#fbbf24", cashier:"#38bdf8" }[user.role] || "var(--muted)";

  return (
    <div style={{ marginTop:"auto", paddingTop:"1rem", borderTop:"1px solid var(--border)" }}>
      <div style={{ fontSize:"0.78rem", color:"var(--muted)", marginBottom:"0.25rem" }}>
        {user.full_name}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:"0.68rem", fontWeight:600, color:roleColor, textTransform:"capitalize",
          background:`${roleColor}1a`, padding:"0.15rem 0.5rem", borderRadius:"999px" }}>
          {user.role}
        </span>
        <button onClick={logout} style={{ background:"none", border:"none", cursor:"pointer",
          fontSize:"0.75rem", color:"var(--muted)", padding:"0.2rem 0.4rem", borderRadius:"4px" }}>
          Sign out
        </button>
      </div>
    </div>
  );
}

function Layout() {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1><span>📦</span><span>Smart Inventory</span></h1>

        <div>
          <div className="nav-section-title">Overview</div>
          <SidebarLink to="/" label="Dashboard" />
        </div>

        <div>
          <div className="nav-section-title">Operations</div>
          <SidebarLink to="/products"  label="Products" />
          <SidebarLink to="/inventory" label="Inventory" />
          <SidebarLink to="/pos"       label="POS" badge="Live" />
          <SidebarLink to="/customers" label="Customers" />
          <SidebarLink to="/suppliers" label="Suppliers" />
        </div>

        <div>
          <div className="nav-section-title">Insights</div>
          <SidebarLink to="/reports" label="Reports & Analytics" />
        </div>

        {user?.role !== "cashier" && (
          <div>
            <div className="nav-section-title">System</div>
            <SidebarLink to="/settings" label="Settings" />
          </div>
        )}

        <UserChip />
      </aside>

      <main className="main">
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/products"     element={<Products />} />
          <Route path="/products/new" element={<ProductForm mode="create" />} />
          <Route path="/products/:id" element={<ProductForm mode="edit" />} />
          <Route path="/inventory"    element={<Inventory />} />
          <Route path="/pos"          element={<POS />} />
          <Route path="/customers"    element={<Customers />} />
          <Route path="/suppliers"    element={<Suppliers />} />
          <Route path="/reports"      element={<Reports />} />
          <Route path="/settings"     element={
            <ProtectedRoute roles={["owner", "manager"]}>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}