import React, { createContext, useContext, useState, useCallback } from 'react';
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [catalogsLoaded, setCatalogsLoaded] = useState(false);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);

  // LAZY LOAD: Só faz GET na 1ª vez que uma tela (como o PitStop) pedir!
  const ensureCatalogsLoaded = useCallback(async () => {
    if (catalogsLoaded || isLoadingCatalogs) return;

    setIsLoadingCatalogs(true);
    try {
      const [cats, pays, ctxs, locs, gls] = await Promise.all([
        api.getCategories(),
        api.getPaymentMethods(),
        api.getContexts(),
        api.getLocations(),
        api.getGoals(),
      ]);
      setCategories(cats);
      setPaymentMethods(pays);
      setContexts(ctxs);
      setLocations(locs);
      setGoals(gls);
      setCatalogsLoaded(true);
    } catch (error) {
      console.error('Erro ao carregar catálogos:', error);
    } finally {
      setIsLoadingCatalogs(false);
    }
  }, [catalogsLoaded, isLoadingCatalogs]);

  // Salva no backend e já insere na memória sem precisar dar GET tudo de novo
  const addTransaction = async (data: TransactionCreate) => {
    const newTx = await api.createTransaction(data);
    setTransactions((prev) => [newTx, ...prev]);
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