import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const { login, loading, error, clearError, user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || "/";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);

  // Already logged in → redirect immediately
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  async function handleSubmit(e) {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      // error is set inside AuthContext
    }
  }

  return (
    <div style={styles.root}>
      {/* Left panel — branding */}
      <div style={styles.brand}>
        <div style={styles.brandInner}>
          <div style={styles.logo}>
            <span style={{ fontSize: "2rem" }}>📦</span>
          </div>
          <h1 style={styles.brandTitle}>Smart Inventory</h1>
          <p style={styles.brandSub}>
            Full-stack inventory &amp; POS — products, customers,
            suppliers, reports and more.
          </p>

          <div style={styles.features}>
            {[
              ["🛒", "Point-of-sale checkout"],
              ["📊", "Real-time analytics"],
              ["🔔", "Low-stock alerts"],
              ["👥", "Customer loyalty tiers"],
            ].map(([icon, label]) => (
              <div key={label} style={styles.featureRow}>
                <span style={styles.featureIcon}>{icon}</span>
                <span style={styles.featureLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={styles.formPanel}>
        <div style={styles.formCard}>
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={styles.formTitle}>Welcome back</h2>
            <p style={styles.formSub}>Sign in to your account to continue.</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={{ marginRight: "0.5rem" }}>⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Email */}
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={e => { setEmail(e.target.value); clearError(); }}
                placeholder="you@example.com"
                style={styles.input}
              />
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="password">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearError(); }}
                  placeholder="••••••••"
                  style={{ ...styles.input, paddingRight: "2.8rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
                cursor:  loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <span style={styles.spinner} />
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div style={styles.demoBox}>
            <div style={styles.demoTitle}>Demo credentials</div>
            {[
              ["Owner",   "admin@example.com",   "admin1234"],
              ["Manager", "manager@example.com", "manager1234"],
              ["Cashier", "cashier@example.com", "cashier1234"],
            ].map(([role, em, pw]) => (
              <button
                key={role}
                type="button"
                style={styles.demoBtn}
                onClick={() => {
                  setEmail(em);
                  setPassword(pw);
                  clearError();
                }}
              >
                <span style={styles.demoBadge}>{role}</span>
                <span style={styles.demoEmail}>{em}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = {
  root: {
    display:       "flex",
    minHeight:     "100vh",
    background:    "var(--bg-soft)",
  },

  // Left branding panel
  brand: {
    flex:           "0 0 420px",
    background:     "linear-gradient(160deg, #0d9488 0%, #0f1923 55%)",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    padding:        "3rem 2.5rem",
  },
  brandInner: {
    maxWidth: "320px",
  },
  logo: {
    width:          "56px",
    height:         "56px",
    borderRadius:   "14px",
    background:     "rgba(255,255,255,0.12)",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    marginBottom:   "1.25rem",
  },
  brandTitle: {
    fontSize:     "1.75rem",
    fontWeight:   "700",
    color:        "#f0fdfa",
    margin:       "0 0 0.75rem",
    letterSpacing:"-0.03em",
  },
  brandSub: {
    fontSize:   "0.9rem",
    color:      "rgba(240,253,250,0.65)",
    lineHeight: "1.6",
    margin:     "0 0 2rem",
  },
  features: {
    display:       "flex",
    flexDirection: "column",
    gap:           "0.75rem",
  },
  featureRow: {
    display:    "flex",
    alignItems: "center",
    gap:        "0.75rem",
  },
  featureIcon: {
    fontSize:       "1.1rem",
    width:          "32px",
    height:         "32px",
    background:     "rgba(255,255,255,0.1)",
    borderRadius:   "8px",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    flexShrink:     "0",
  },
  featureLabel: {
    fontSize: "0.85rem",
    color:    "rgba(240,253,250,0.8)",
  },

  // Right form panel
  formPanel: {
    flex:           "1",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    padding:        "2rem",
  },
  formCard: {
    width:     "100%",
    maxWidth:  "400px",
  },
  formTitle: {
    fontSize:     "1.5rem",
    fontWeight:   "700",
    color:        "var(--text)",
    margin:       "0 0 0.35rem",
    letterSpacing:"-0.02em",
  },
  formSub: {
    fontSize: "0.875rem",
    color:    "var(--muted)",
    margin:   0,
  },

  errorBox: {
    background:   "rgba(248,113,113,0.1)",
    border:       "1px solid rgba(248,113,113,0.3)",
    borderRadius: "0.5rem",
    padding:      "0.65rem 0.9rem",
    fontSize:     "0.85rem",
    color:        "#fca5a5",
    marginBottom: "0.5rem",
    display:      "flex",
    alignItems:   "center",
  },

  fieldGroup: {
    display:       "flex",
    flexDirection: "column",
    gap:           "0.35rem",
  },
  label: {
    fontSize:   "0.8rem",
    fontWeight: "500",
    color:      "var(--muted)",
  },
  input: {
    padding:      "0.6rem 0.85rem",
    borderRadius: "0.5rem",
    border:       "1px solid var(--border)",
    background:   "var(--surface)",
    color:        "var(--text)",
    fontSize:     "0.9rem",
    outline:      "none",
    width:        "100%",
    boxSizing:    "border-box",
    transition:   "border-color 0.15s",
  },
  eyeBtn: {
    position:   "absolute",
    right:      "0.65rem",
    top:        "50%",
    transform:  "translateY(-50%)",
    background: "none",
    border:     "none",
    cursor:     "pointer",
    fontSize:   "1rem",
    color:      "var(--muted)",
    padding:    "0.2rem",
    lineHeight: "1",
  },
  submitBtn: {
    marginTop:    "0.5rem",
    padding:      "0.7rem",
    background:   "var(--primary)",
    color:        "white",
    border:       "none",
    borderRadius: "0.5rem",
    fontSize:     "0.9rem",
    fontWeight:   "600",
    display:      "flex",
    alignItems:   "center",
    justifyContent:"center",
    minHeight:    "42px",
    transition:   "opacity 0.15s",
  },
  spinner: {
    width:        "18px",
    height:       "18px",
    border:       "2px solid rgba(255,255,255,0.3)",
    borderTop:    "2px solid white",
    borderRadius: "50%",
    animation:    "spin 0.7s linear infinite",
    display:      "inline-block",
  },

  // Demo credentials section
  demoBox: {
    marginTop:    "1.75rem",
    padding:      "1rem",
    background:   "var(--surface)",
    border:       "1px solid var(--border)",
    borderRadius: "0.6rem",
  },
  demoTitle: {
    fontSize:     "0.72rem",
    fontWeight:   "600",
    color:        "var(--muted)",
    textTransform:"uppercase",
    letterSpacing:"0.08em",
    marginBottom: "0.6rem",
  },
  demoBtn: {
    display:        "flex",
    alignItems:     "center",
    gap:            "0.6rem",
    width:          "100%",
    background:     "none",
    border:         "none",
    padding:        "0.4rem 0.35rem",
    cursor:         "pointer",
    borderRadius:   "0.35rem",
    textAlign:      "left",
    transition:     "background 0.12s",
  },
  demoBadge: {
    display:      "inline-block",
    padding:      "0.15rem 0.5rem",
    borderRadius: "999px",
    fontSize:     "0.68rem",
    fontWeight:   "600",
    background:   "rgba(13,148,136,0.15)",
    color:        "#5eead4",
    minWidth:     "56px",
    textAlign:    "center",
  },
  demoEmail: {
    fontSize: "0.8rem",
    color:    "var(--muted)",
  },
};
