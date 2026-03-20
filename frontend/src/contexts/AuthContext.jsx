import React, { createContext, useContext, useState, useCallback } from "react";
import api, { auth as tokenStore } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => tokenStore.getUser());
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post("/auth/login/", { email, password });
      tokenStore.setTokens(data.access, data.refresh);
      tokenStore.setUser(data.user);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const refresh = tokenStore.getRefresh();
      if (refresh) await api.post("/auth/logout/", { refresh });
    } catch {
      // ignore — clear local state regardless
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
