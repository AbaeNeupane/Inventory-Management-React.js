
import React, { createContext, useContext, useState } from "react";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("NPR");

  const value = {
    language,
    setLanguage,
    currency,
    setCurrency
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
