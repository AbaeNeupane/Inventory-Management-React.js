import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Wrap any route that requires authentication.
 * Unauthorised users are sent to /login with the original path saved
 * so they are redirected back after signing in.
 *
 * Usage:
 *   <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
 *
 * Optional role restriction:
 *   <ProtectedRoute roles={["owner", "manager"]}>
 *     <Settings />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div style={{
        padding:    "3rem 2rem",
        textAlign:  "center",
        color:      "var(--muted)",
        fontSize:   "0.9rem",
      }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔒</div>
        <div style={{ fontWeight: 600, marginBottom: "0.4rem", color: "var(--text)" }}>
          Access restricted
        </div>
        <div>Your role (<strong>{user.role}</strong>) does not have permission to view this page.</div>
      </div>
    );
  }

  return children;
}
