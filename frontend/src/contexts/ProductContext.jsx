import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api";

const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.list("/products/", { page_size: 200 });
      setProducts(data.results ?? data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function createProduct(input) {
    const product = await api.post("/products/", input);
    setProducts(prev => [product, ...prev]);
    return product;
  }

  async function updateProduct(id, input) {
    const product = await api.patch(`/products/${id}/`, input);
    setProducts(prev => prev.map(p => p.id === id ? product : p));
    return product;
  }

  async function deleteProduct(id) {
    await api.delete(`/products/${id}/`);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  return (
    <ProductContext.Provider value={{ products, loading, fetchProducts, createProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProducts must be used inside ProductProvider");
  return ctx;
}