import React, { createContext, useContext, useMemo } from "react";
import { useProducts } from "./ProductContext";

// InventoryContext now derives directly from the API-backed ProductContext.
// low_stock and reorder_level use the snake_case field names the backend returns.

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const { products } = useProducts();

  const aggregates = useMemo(() => {
    const totalStock    = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const lowStockItems = products.filter(p => p.stock <= p.reorder_level);
    return { totalStock, lowStockItems };
  }, [products]);

  return (
    <InventoryContext.Provider value={aggregates}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}