import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  MapPin,
  Target,
  Repeat,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { DynamicIcon } from '../components/DynamicIcon';
import { MonthSelector } from '../components/home/MonthSelector';
import { TransactionDetailView } from './extrato/TransactionDetailView';
import type { Transaction } from '../types/finance';

interface ExtratoPageProps {
  onSubScreenChange?: (isOpen: boolean) => void;
}

type QuickFilter = 'ALL' | 'EXPENSE' | 'INCOME' | 'INSTALLMENT';

const normalize = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const formatBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const getLocalISO = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDayHeading = (isoDate: string, includeYear: boolean) => {
  if (isoDate === getLocalISO(0)) return 'Hoje';
  if (isoDate === getLocalISO(-1)) return 'Ontem';

  const [y, m, d] = isoDate.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    ...(includeYear ? { year: 'numeric' } : {}),
  }).format(dateObj);
};

export function ExtratoPage({ onSubScreenChange }: ExtratoPageProps) {
  const { currentTheme } = useTheme();
  const {
    transactions,
    categories,
    paymentMethods,
    contexts,
    locations,
    isLoadingTransactions,
    ensureHomeLoaded,
  } = useData();

  const now = new Date();
  const [periodMode, setPeriodMode] = useState<'month' | 'all'>('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0 a 11

  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // Filtros avançados (Os 3 eixos + Pagamento)
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterPaymentId, setFilterPaymentId] = useState('');
  const [filterContextId, setFilterContextId] = useState('');
  const [filterLocationId, setFilterLocationId] = useState('');

  // Transação selecionada para detalhe/edição
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  useEffect(() => {
    ensureHomeLoaded();
  }, [ensureHomeLoaded]);

  useEffect(() => {
    onSubScreenChange?.(selectedTxId !== null);
    return () => onSubScreenChange?.(false);
  }, [selectedTxId, onSubScreenChange]);

  // Mapas de acesso rápido O(1)
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );
  const paymentMap = useMemo(
    () => new Map(paymentMethods.map((pm) => [pm.id, pm])),
    [paymentMethods]
  );
  const contextMap = useMemo(
    () => new Map(contexts.map((ctx) => [ctx.id, ctx])),
    [contexts]
  );
  const locationMap = useMemo(
    () => new Map(locations.map((loc) => [loc.id, loc])),
    [locations]
  );

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const activeAdvancedCount = [
    filterCategoryId,
    filterPaymentId,
    filterContextId,
    filterLocationId,
  ].filter(Boolean).length;

  const clearAdvancedFilters = () => {
    setFilterCategoryId('');
    setFilterPaymentId('');
    setFilterContextId('');
    setFilterLocationId('');
  };

  // Filtragem completa
  const filteredTransactions = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const q = normalize(search.trim());

    return transactions
      .filter((tx) => {
        if (periodMode === 'month' && !tx.date.startsWith(prefix)) return false;

        if (quickFilter === 'EXPENSE' && tx.type !== 'EXPENSE') return false;
        if (quickFilter === 'INCOME' && tx.type !== 'INCOME') return false;
        if (
          quickFilter === 'INSTALLMENT' &&
          (!tx.installment_total || tx.installment_total <= 1)
        ) {
          return false;
        }

        if (filterCategoryId && tx.category_id !== filterCategoryId) return false;
        if (filterPaymentId && tx.payment_method_id !== filterPaymentId) return false;
        if (filterContextId && tx.context_id !== filterContextId) return false;
        if (filterLocationId && tx.location_id !== filterLocationId) return false;

        if (q) {
          const cat = categoryMap.get(tx.category_id);
          const ctx = tx.context_id ? contextMap.get(tx.context_id) : null;
          const loc = tx.location_id ? locationMap.get(tx.location_id) : null;
          const pm = tx.payment_method_id
            ? paymentMap.get(tx.payment_method_id)
            : null;

          const haystack = normalize(
            [
              tx.description,
              tx.notes || '',
              cat?.name || '',
              ctx?.name || '',
              loc?.name || '',
              loc?.city || '',
              pm?.name || '',
            ].join(' ')
          );
          if (!haystack.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [
    transactions,
    periodMode,
    year,
    month,
    quickFilter,
    filterCategoryId,
    filterPaymentId,
    filterContextId,
    filterLocationId,
    search,
    categoryMap,
    contextMap,
    locationMap,
    paymentMap,
  ]);

  // Placar Dinâmico do recorte atual
  const summary = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        const val = Number(tx.amount);
        if (tx.type === 'INCOME') acc.income += val;
        else acc.expense += val;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredTransactions]);

  // Agrupamento por dia (Timeline)
  const groupedByDay = useMemo(() => {
    const groups: { date: string; items: Transaction[]; dayNet: number }[] = [];
    const map = new Map<string, { date: string; items: Transaction[]; dayNet: number }>();

    filteredTransactions.forEach((tx) => {
      let group = map.get(tx.date);
      if (!group) {
        group = { date: tx.date, items: [], dayNet: 0 };
        map.set(tx.date, group);
        groups.push(group);
      }
      group.items.push(tx);
      const val = Number(tx.amount);
      group.dayNet += tx.type === 'INCOME' ? val : -val;
    });

    return groups;
  }, [filteredTransactions]);

  // Sub-tela de Detalhe / Edição
  const selectedTx = selectedTxId
    ? transactions.find((t) => t.id === selectedTxId) || null
    : null;

  if (selectedTx) {
    return (
      <TransactionDetailView
        key={selectedTx.id}
        transaction={selectedTx}
        onBack={() => setSelectedTxId(null)}
        onSelectTransaction={(txId) => setSelectedTxId(txId)}
      />
    );
  }

  return (
    <div className="p-5 pb-28 max-w-md mx-auto flex flex-col gap-4">
      {/* Header + Toggle Mês / Tudo */}
      <div className="flex items-center justify-between">
        <div>
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase tracking-widest block"
          >
            Histórico / Voltas
          </span>
          <h1
            style={{ color: currentTheme.primaryText }}
            className="text-xl font-black uppercase"
          >
            Extrato
          </h1>
        </div>

        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-1 rounded-xl flex items-center gap-1"
        >
          <button
            type="button"
            onClick={() => setPeriodMode('month')}
            style={{
              backgroundColor:
                periodMode === 'month' ? currentTheme.primary : 'transparent',
              color:
                periodMode === 'month'
                  ? currentTheme.primaryText
                  : currentTheme.secondaryText,
            }}
            className="px-3 py-1.5 rounded-lg text-[11px] font-black uppercase cursor-pointer transition-colors"
          >
            Mês
          </button>
          <button
            type="button"
            onClick={() => setPeriodMode('all')}
            style={{
              backgroundColor:
                periodMode === 'all' ? currentTheme.primary : 'transparent',
              color:
                periodMode === 'all'
                  ? currentTheme.primaryText
                  : currentTheme.secondaryText,
            }}
            className="px-3 py-1.5 rounded-lg text-[11px] font-black uppercase cursor-pointer transition-colors"
          >
            Tudo
          </button>
        </div>
      </div>

      {/* Seletor de Mês (quando no modo Mês) */}
      {periodMode === 'month' && (
        <MonthSelector
          year={year}
          month={month}
          onPrev={handlePrevMonth}
          onNext={handleNextMonth}
        />
      )}

      {/* Busca Unificada + Botão de Filtros Avançados */}
      <div className="flex items-center gap-2">
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="flex-1 px-3.5 py-2.5 rounded-xl flex items-center gap-2.5"
        >
          <Search size={16} style={{ color: currentTheme.secondaryText }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar descrição, local, contexto..."
            style={{ color: currentTheme.primaryText }}
            className="w-full text-xs font-semibold bg-transparent focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ color: currentTheme.secondaryText }}
              className="cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          style={{
            backgroundColor:
              showFilters || activeAdvancedCount > 0
                ? currentTheme.primary
                : currentTheme.bgCard,
            color: currentTheme.primaryText,
          }}
          className="p-2.5 rounded-xl relative cursor-pointer active:scale-95 transition-transform"
          title="Filtros avançados"
        >
          <SlidersHorizontal size={18} />
          {activeAdvancedCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center">
              {activeAdvancedCount}
            </span>
          )}
        </button>
      </div>

      {/* Pílulas Rápidas */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {(
          [
            { id: 'ALL', label: 'Todos' },
            { id: 'EXPENSE', label: 'Saídas' },
            { id: 'INCOME', label: 'Entradas' },
            { id: 'INSTALLMENT', label: 'Parcelados' },
          ] as { id: QuickFilter; label: string }[]
        ).map((pill) => {
          const isActive = quickFilter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setQuickFilter(pill.id)}
              style={{
                backgroundColor: isActive
                  ? currentTheme.primary
                  : currentTheme.bgCard,
                color: isActive
                  ? currentTheme.primaryText
                  : currentTheme.secondaryText,
              }}
              className="px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase shrink-0 cursor-pointer transition-colors"
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Gaveta de Filtros Avançados (3 Eixos + Pagamento) */}
      {showFilters && (
        <div
          style={{
            backgroundColor: currentTheme.bgCard,
            borderColor: currentTheme.secondary,
          }}
          className="p-4 rounded-2xl border flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <span
              style={{ color: currentTheme.primaryText }}
              className="text-xs font-black uppercase"
            >
              Filtros Cruzados
            </span>
            {activeAdvancedCount > 0 && (
              <button
                type="button"
                onClick={clearAdvancedFilters}
                style={{ color: currentTheme.primary }}
                className="text-[11px] font-black uppercase cursor-pointer"
              >
                Limpar ({activeAdvancedCount})
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              style={{
                backgroundColor: currentTheme.bgDark,
                color: currentTheme.primaryText,
              }}
              className="p-2.5 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="">Categoria: Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={filterPaymentId}
              onChange={(e) => setFilterPaymentId(e.target.value)}
              style={{
                backgroundColor: currentTheme.bgDark,
                color: currentTheme.primaryText,
              }}
              className="p-2.5 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="">Pagamento: Todos</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                </option>
              ))}
            </select>

            <select
              value={filterContextId}
              onChange={(e) => setFilterContextId(e.target.value)}
              style={{
                backgroundColor: currentTheme.bgDark,
                color: currentTheme.primaryText,
              }}
              className="p-2.5 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="">Contexto: Todos</option>
              {contexts.map((ctx) => (
                <option key={ctx.id} value={ctx.id}>
                  #{ctx.name}
                </option>
              ))}
            </select>

            <select
              value={filterLocationId}
              onChange={(e) => setFilterLocationId(e.target.value)}
              style={{
                backgroundColor: currentTheme.bgDark,
                color: currentTheme.primaryText,
              }}
              className="p-2.5 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="">Local: Todos</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Placar Dinâmico da Consulta */}
      <div
        style={{ backgroundColor: currentTheme.bgCard }}
        className="px-4 py-3 rounded-2xl flex items-center justify-between text-xs"
      >
        <span style={{ color: currentTheme.secondaryText }} className="font-bold">
          {filteredTransactions.length}{' '}
          {filteredTransactions.length === 1 ? 'volta' : 'voltas'}
        </span>

        <div className="flex items-center gap-3 font-black">
          {summary.income > 0 && (
            <span className="text-emerald-400">+{formatBRL(summary.income)}</span>
          )}
          {summary.expense > 0 && (
            <span style={{ color: currentTheme.primaryText }}>
              -{formatBRL(summary.expense)}
            </span>
          )}
          {summary.income === 0 && summary.expense === 0 && (
            <span style={{ color: currentTheme.secondaryText }}>R$ 0,00</span>
          )}
        </div>
      </div>

      {/* Timeline Agrupada por Dia */}
      {isLoadingTransactions ? (
        <div className="py-16 flex justify-center">
          <Loader2
            className="animate-spin"
            size={28}
            style={{ color: currentTheme.primary }}
          />
        </div>
      ) : groupedByDay.length === 0 ? (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-8 rounded-2xl text-center"
        >
          <p
            style={{ color: currentTheme.secondaryText }}
            className="text-xs font-medium"
          >
            Nenhum lançamento encontrado para este filtro.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groupedByDay.map((group) => (
            <div key={group.date} className="flex flex-col gap-2">
              {/* Cabeçalho do Dia + Subtotal */}
              <div className="flex items-center justify-between px-1">
                <span
                  style={{ color: currentTheme.secondaryText }}
                  className="text-[11px] font-black uppercase tracking-wider"
                >
                  {formatDayHeading(group.date, periodMode === 'all')}
                </span>
                <span
                  style={{
                    color:
                      group.dayNet > 0
                        ? '#10B981'
                        : currentTheme.secondaryText,
                  }}
                  className="text-[11px] font-bold"
                >
                  {group.dayNet > 0 ? '+' : ''}
                  {formatBRL(group.dayNet)}
                </span>
              </div>

              {/* Card com as transações do dia */}
              <div
                style={{ backgroundColor: currentTheme.bgCard }}
                className="rounded-2xl overflow-hidden divide-y divide-white/5"
              >
                {group.items.map((tx) => {
                  const cat = categoryMap.get(tx.category_id);
                  const pm = tx.payment_method_id
                    ? paymentMap.get(tx.payment_method_id)
                    : null;
                  const ctx = tx.context_id
                    ? contextMap.get(tx.context_id)
                    : null;
                  const loc = tx.location_id
                    ? locationMap.get(tx.location_id)
                    : null;

                  const catColor = cat?.color || '#10B981';
                  const isIncome = tx.type === 'INCOME';

                  return (
                    <button
                      key={tx.id}
                      type="button"
                      onClick={() => setSelectedTxId(tx.id)}
                      className="w-full p-3.5 flex items-center justify-between gap-3 cursor-pointer active:opacity-70 transition-opacity text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          style={{
                            backgroundColor: `${catColor}22`,
                            color: catColor,
                          }}
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        >
                          <DynamicIcon name={cat?.icon} size={18} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              style={{ color: currentTheme.primaryText }}
                              className="text-sm font-bold truncate"
                            >
                              {tx.description}
                            </span>
                            {tx.installment_total &&
                              tx.installment_total > 1 && (
                                <span
                                  style={{
                                    backgroundColor: `${currentTheme.primary}20`,
                                    color: currentTheme.primary,
                                  }}
                                  className="text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0"
                                >
                                  {tx.installment_current}/{tx.installment_total}
                                </span>
                              )}
                            {tx.goal_id && (
                              <Target
                                size={12}
                                className="text-purple-400 shrink-0"
                              />
                            )}
                            {tx.recurring_bill_id && (
                              <Repeat
                                size={12}
                                className="text-sky-400 shrink-0"
                              />
                            )}
                          </div>

                          {/* Linha de micro-tags (Categoria • Pagamento • #Contexto • Local) */}
                          <div
                            style={{ color: currentTheme.secondaryText }}
                            className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-medium mt-0.5"
                          >
                            <span>{cat?.name || 'Sem categoria'}</span>
                            {pm && <span>• {pm.name}</span>}
                            {ctx && (
                              <span style={{ color: currentTheme.primary }}>
                                #{ctx.name}
                              </span>
                            )}
                            {loc && (
                              <span className="inline-flex items-center gap-0.5">
                                <MapPin size={10} />
                                {loc.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          color: isIncome
                            ? '#10B981'
                            : currentTheme.primaryText,
                        }}
                        className="text-sm font-black shrink-0"
                      >
                        {isIncome ? '+' : '-'} {formatBRL(Number(tx.amount))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}