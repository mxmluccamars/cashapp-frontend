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
  RecurringBill,
} from '../types/finance';

interface DataContextType {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  contexts: ContextItem[];
  locations: LocationItem[];
  goals: Goal[];
  transactions: Transaction[];
  recurringBills: RecurringBill[];
  isLoadingCatalogs: boolean;
  isLoadingTransactions: boolean;
  ensureCatalogsLoaded: () => Promise<void>;
  ensureHomeLoaded: () => Promise<void>;
  addTransaction: (tx: TransactionCreate) => Promise<void>;
  addCategory: (data: Omit<Category, 'id'>) => Promise<Category>;
  editCategory: (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;

  addContext: (data: { name: string }) => Promise<void>;
  editContext: (id: string, data: { name: string }) => Promise<void>;
  removeContext: (id: string) => Promise<void>;

  addLocation: (data: Omit<LocationItem, 'id'>) => Promise<void>;
  editLocation: (id: string, data: Partial<Omit<LocationItem, 'id'>>) => Promise<void>;
  removeLocation: (id: string) => Promise<void>;


  addPaymentMethod: (data: Omit<PaymentMethod, 'id'>) => Promise<void>;
  editPaymentMethod: (id: string, data: Partial<Omit<PaymentMethod, 'id'>>) => Promise<void>;
  removePaymentMethod: (id: string) => Promise<void>;

  addGoal: (data: Omit<Goal, 'id'>) => Promise<void>;
  editGoal: (id: string, data: Partial<Omit<Goal, 'id'>>) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;


  addRecurringBill: (data: Omit<RecurringBill, 'id'>) => Promise<void>;
  editRecurringBill: (id: string, data: Partial<Omit<RecurringBill, 'id'>>) => Promise<void>;
  removeRecurringBill: (id: string) => Promise<void>;

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
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const hasAttemptedHomeLoad = useRef(false);

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

  const ensureHomeLoaded = useCallback(async () => {
    await ensureCatalogsLoaded();
    if (hasAttemptedHomeLoad.current) return;
    hasAttemptedHomeLoad.current = true;

    setIsLoadingTransactions(true);
    try {
      const [txs, bills] = await Promise.all([
        api.getTransactions().catch((err) => { console.warn('Falha em transactions:', err); return []; }),
        api.getRecurringBills().catch((err) => { console.warn('Falha em recurring-bills:', err); return []; }),
      ]);
      setTransactions(txs);
      setRecurringBills(bills);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [ensureCatalogsLoaded]);

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
    return created;
  };

  const editCategory = async (id: string, data: Partial<Omit<Category, 'id'>>) => {
    const updated = await api.updateCategory(id, data);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const removeCategory = async (id: string) => {
    await api.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const addContext = async (data: { name: string }) => {
    const created = await api.createContext(data);
    setContexts((prev) => [...prev, created]);
  };

  const editContext = async (id: string, data: { name: string }) => {
    const updated = await api.updateContext(id, data);
    setContexts((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const removeContext = async (id: string) => {
    await api.deleteContext(id);
    setContexts((prev) => prev.filter((c) => c.id !== id));
  };

  const addLocation = async (data: Omit<LocationItem, 'id'>) => {
    const created = await api.createLocation(data);
    setLocations((prev) => [...prev, created]);
  };

  const editLocation = async (id: string, data: Partial<Omit<LocationItem, 'id'>>) => {
    const updated = await api.updateLocation(id, data);
    setLocations((prev) => prev.map((l) => (l.id === id ? updated : l)));
  };

  const removeLocation = async (id: string) => {
    await api.deleteLocation(id);
    setLocations((prev) => prev.filter((l) => l.id !== id));
  };


  const addPaymentMethod = async (data: Omit<PaymentMethod, 'id'>) => {
    const created = await api.createPaymentMethod(data);
    setPaymentMethods((prev) => [...prev, created]);
  };

  const editPaymentMethod = async (
    id: string,
    data: Partial<Omit<PaymentMethod, 'id'>>
  ) => {
    const updated = await api.updatePaymentMethod(id, data);
    setPaymentMethods((prev) => prev.map((pm) => (pm.id === id ? updated : pm)));
  };

  const removePaymentMethod = async (id: string) => {
    await api.deletePaymentMethod(id);
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
  };

  const addGoal = async (data: Omit<Goal, 'id'>) => {
    const created = await api.createGoal(data);
    setGoals((prev) => [...prev, created]);
  };

  const editGoal = async (id: string, data: Partial<Omit<Goal, 'id'>>) => {
    const updated = await api.updateGoal(id, data);
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
  };

  const removeGoal = async (id: string) => {
    await api.deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };


  const addRecurringBill = async (data: Omit<RecurringBill, 'id'>) => {
    const created = await api.createRecurringBill(data);
    setRecurringBills((prev) => [...prev, created]);
  };

  const editRecurringBill = async (
    id: string,
    data: Partial<Omit<RecurringBill, 'id'>>
  ) => {
    const updated = await api.updateRecurringBill(id, data);
    setRecurringBills((prev) => prev.map((b) => (b.id === id ? updated : b)));
  };

  const removeRecurringBill = async (id: string) => {
    await api.deleteRecurringBill(id);
    setRecurringBills((prev) => prev.filter((b) => b.id !== id));
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
        recurringBills,
        ensureCatalogsLoaded,
        ensureHomeLoaded,
        isLoadingTransactions,
        addTransaction,
        addCategory,
        editCategory,
        removeCategory,
        addContext,
        editContext,
        removeContext,
        addLocation,
        editLocation,
        removeLocation,
        addPaymentMethod,
        editPaymentMethod,
        removePaymentMethod,
        addGoal,
        editGoal,
        removeGoal,
        addRecurringBill,
        editRecurringBill,
        removeRecurringBill,
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