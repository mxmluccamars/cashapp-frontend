import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { api } from '../api/client';
import type {
  Category,
  PaymentMethod,
  ContextItem,
  LocationItem,
  Goal,
  Transaction,
  TransactionCreate,
} from '../types/finance';

interface DataContextType {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  contexts: ContextItem[];
  locations: LocationItem[];
  goals: Goal[];
  transactions: Transaction[];
  isLoadingCatalogs: boolean;
  ensureCatalogsLoaded: () => Promise<void>;
  addTransaction: (tx: TransactionCreate) => Promise<void>;
  addCategory: (data: Omit<Category, 'id'>) => Promise<void>;
  editCategory: (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);

  // Trava síncrona que impede loops de re-renderização no useEffect
  const hasAttemptedLoad = useRef(false);

  const ensureCatalogsLoaded = useCallback(async () => {
    if (hasAttemptedLoad.current) return;
    hasAttemptedLoad.current = true;

    setIsLoadingCatalogs(true);
    try {
      // Usa catch individual para que um 404 em uma rota não quebre as outras!
      const [cats, pays, ctxs, locs, gls] = await Promise.all([
        api.getCategories().catch((err) => { console.warn('Falha em categories:', err); return []; }),
        api.getPaymentMethods().catch((err) => { console.warn('Falha em payment-methods:', err); return []; }),
        api.getContexts().catch((err) => { console.warn('Falha em contexts:', err); return []; }),
        api.getLocations().catch((err) => { console.warn('Falha em locations:', err); return []; }),
        api.getGoals().catch((err) => { console.warn('Falha em goals:', err); return []; }),
      ]);

      setCategories(cats);
      setPaymentMethods(pays);
      setContexts(ctxs);
      setLocations(locs);
      setGoals(gls);
    } finally {
      setIsLoadingCatalogs(false);
    }
  }, []);

  const addTransaction = async (data: TransactionCreate) => {
    const res = await api.createTransaction(data);
    // O endpoint POST /transactions/ pode retornar uma lista (parcelas) ou objeto único
    const newItems = Array.isArray(res) ? res : [res];
    setTransactions((prev) => [...newItems, ...prev]);
  };

  // Dentro do DataProvider:
  const addCategory = async (data: Omit<Category, 'id'>) => {
    const created = await api.createCategory(data);
    setCategories((prev) => [...prev, created]);
  };

  const editCategory = async (id: string, data: Partial<Omit<Category, 'id'>>) => {
    const updated = await api.updateCategory(id, data);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const removeCategory = async (id: string) => {
    await api.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <DataContext.Provider
      value={{
        categories,
        paymentMethods,
        contexts,
        locations,
        goals,
        transactions,
        isLoadingCatalogs,
        ensureCatalogsLoaded,
        addTransaction,
        addCategory,
        editCategory,
        removeCategory,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
}