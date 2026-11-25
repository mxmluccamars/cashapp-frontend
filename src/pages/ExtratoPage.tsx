import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  Target,
  Repeat,
  Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { getAppLocale } from '../i18n';
import { DynamicIcon } from '../components/DynamicIcon';
import { MonthSelector } from '../components/home/MonthSelector';
import { TransactionDetailView } from './extrato/TransactionDetailView';
import {
  formatCurrency,
  formatDayHeading,
  normalizeIconName,
} from '../utils/format';
import type { Transaction } from '../types/finance';

interface ExtratoPageProps {
  onSubScreenChange?: (isOpen: boolean) => void;
}

type QuickFilter = 'ALL' | 'EXPENSE' | 'INCOME' | 'INSTALLMENT';

const normalize = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const toggleId = (list: string[], id: string) =>
  list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

export function ExtratoPage({ onSubScreenChange }: ExtratoPageProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = getAppLocale(i18n.language);

  const {
    transactions,
    categories,
    paymentMethods,
    contexts,
    isLoadingTransactions,
    ensureHomeLoaded,
  } = useData();

  const now = new Date();
  const [periodMode, setPeriodMode] = useState<'month' | 'all'>('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // Filtros avançados com multi-seleção
  const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>([]);
  const [filterPaymentIds, setFilterPaymentIds] = useState<string[]>([]);
  const [filterContextIds, setFilterContextIds] = useState<string[]>([]);

  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  useEffect(() => {
    ensureHomeLoaded();
  }, [ensureHomeLoaded]);

  useEffect(() => {
    onSubScreenChange?.(selectedTxId !== null);
    return () => onSubScreenChange?.(false);
  }, [selectedTxId, onSubScreenChange]);

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

  const activeAdvancedCount =
    filterCategoryIds.length + filterPaymentIds.length + filterContextIds.length;

  const clearAdvancedFilters = () => {
    setFilterCategoryIds([]);
    setFilterPaymentIds([]);
    setFilterContextIds([]);
  };

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

        if (
          filterCategoryIds.length > 0 &&
          !filterCategoryIds.includes(tx.category_id)
        ) {
          return false;
        }
        if (
          filterPaymentIds.length > 0 &&
          (!tx.payment_method_id ||
            !filterPaymentIds.includes(tx.payment_method_id))
        ) {
          return false;
        }
        if (
          filterContextIds.length > 0 &&
          (!tx.context_id || !filterContextIds.includes(tx.context_id))
        ) {
          return false;
        }

        if (q) {
          const cat = categoryMap.get(tx.category_id);
          const ctx = tx.context_id ? contextMap.get(tx.context_id) : null;
          const pm = tx.payment_method_id
            ? paymentMap.get(tx.payment_method_id)
            : null;

          const haystack = normalize(
            [
              tx.description,
              tx.notes || '',
              cat?.name || '',
              ctx?.name || '',
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
    filterCategoryIds,
    filterPaymentIds,
    filterContextIds,
    search,
    categoryMap,
    contextMap,
    paymentMap,
  ]);

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

  const groupedByDay = useMemo(() => {
    const groups: { date: string; items: Transaction[]; dayNet: number }[] = [];
    const map = new Map<
      string,
      { date: string; items: Transaction[]; dayNet: number }
    >();

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

  const selectedTx = selectedTxId
    ? transactions.find((item) => item.id === selectedTxId) || null
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
            {t('extrato.subtitle')}
          </span>
          <h1
            style={{ color: currentTheme.primaryText }}
            className="text-xl font-black uppercase"
          >
            {t('extrato.title')}
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
            {t('extrato.periodMonth')}
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
            {t('extrato.periodAll')}
          </button>
        </div>
      </div>

      {/* Seletor de Mês */}
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
          <Search
            size={16}
            style={{ color: currentTheme.secondaryText }}
            className="shrink-0"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('extrato.searchPlaceholder')}
            style={{ color: currentTheme.primaryText }}
            className="w-full text-xs font-semibold bg-transparent focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label={t('common.clearSearch')}
              style={{ color: currentTheme.secondaryText }}
              className="cursor-pointer shrink-0"
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
          className="p-2.5 rounded-xl relative cursor-pointer active:scale-95 transition-transform shrink-0"
          title={t('extrato.advancedFilters')}
          aria-label={t('extrato.advancedFilters')}
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
            { id: 'ALL', label: t('extrato.quickAll') },
            { id: 'EXPENSE', label: t('extrato.quickExpense') },
            { id: 'INCOME', label: t('extrato.quickIncome') },
            { id: 'INSTALLMENT', label: t('extrato.quickInstallment') },
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

      {/* Chips dos filtros ativos quando a gaveta está fechada */}
      {!showFilters && activeAdvancedCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filterCategoryIds.map((id) => {
            const cat = categoryMap.get(id);
            if (!cat) return null;
            const c = cat.color || currentTheme.primary;
            return (
              <button
                key={`cat-${id}`}
                type="button"
                onClick={() =>
                  setFilterCategoryIds((prev) => prev.filter((x) => x !== id))
                }
                style={{ backgroundColor: `${c}22`, color: c, borderColor: `${c}55` }}
                className="px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <DynamicIcon name={cat.icon} size={12} />
                <span>{cat.name}</span>
                <X size={11} />
              </button>
            );
          })}

          {filterPaymentIds.map((id) => {
            const pm = paymentMap.get(id);
            if (!pm) return null;
            const c = pm.color || currentTheme.primary;
            return (
              <button
                key={`pm-${id}`}
                type="button"
                onClick={() =>
                  setFilterPaymentIds((prev) => prev.filter((x) => x !== id))
                }
                style={{ backgroundColor: `${c}22`, color: c, borderColor: `${c}55` }}
                className="px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <DynamicIcon name={normalizeIconName(pm.icon)} size={12} />
                <span>{pm.name}</span>
                <X size={11} />
              </button>
            );
          })}

          {filterContextIds.map((id) => {
            const ctx = contextMap.get(id);
            if (!ctx) return null;
            return (
              <button
                key={`ctx-${id}`}
                type="button"
                onClick={() =>
                  setFilterContextIds((prev) => prev.filter((x) => x !== id))
                }
                style={{
                  backgroundColor: `${currentTheme.primary}22`,
                  color: currentTheme.primary,
                  borderColor: `${currentTheme.primary}55`,
                }}
                className="px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>#{ctx.name}</span>
                <X size={11} />
              </button>
            );
          })}

          <button
            type="button"
            onClick={clearAdvancedFilters}
            style={{ color: currentTheme.secondaryText }}
            className="px-2 py-1 text-[10px] font-black uppercase cursor-pointer"
          >
            {t('common.clear')}
          </button>
        </div>
      )}

      {/* Gaveta de Filtros Avançados Empilhados (Multi-seleção) */}
      {showFilters && (
        <div
          style={{
            backgroundColor: currentTheme.bgCard,
            borderColor: currentTheme.secondary,
          }}
          className="p-4 rounded-2xl border flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <span
              style={{ color: currentTheme.primaryText }}
              className="text-xs font-black uppercase"
            >
              {t('extrato.filtersTitle')}
            </span>
            {activeAdvancedCount > 0 && (
              <button
                type="button"
                onClick={clearAdvancedFilters}
                style={{ color: currentTheme.primary }}
                className="text-[11px] font-black uppercase cursor-pointer"
              >
                {t('extrato.clearFilters', { count: activeAdvancedCount })}
              </button>
            )}
          </div>

          {/* 1. Categorias (multi-seleção) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase tracking-wider"
              >
                {t('extrato.categoriesFilter')}
                {filterCategoryIds.length > 0 && ` (${filterCategoryIds.length})`}
              </span>
              {filterCategoryIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterCategoryIds([])}
                  style={{ color: currentTheme.primary }}
                  className="text-[10px] font-bold uppercase cursor-pointer"
                >
                  {t('common.clear')}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-0.5">
              {categories.map((cat) => {
                const isSelected = filterCategoryIds.includes(cat.id);
                const c = cat.color || currentTheme.primary;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setFilterCategoryIds((prev) => toggleId(prev, cat.id))
                    }
                    style={{
                      backgroundColor: isSelected ? `${c}28` : currentTheme.bgDark,
                      borderColor: isSelected ? c : 'transparent',
                      color: isSelected ? c : currentTheme.secondaryText,
                    }}
                    className="px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <DynamicIcon name={cat.icon} size={13} />
                    <span>{cat.name}</span>
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Formas de Pagamento (multi-seleção) */}
          <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase tracking-wider"
              >
                {t('extrato.paymentsFilter')}
                {filterPaymentIds.length > 0 && ` (${filterPaymentIds.length})`}
              </span>
              {filterPaymentIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterPaymentIds([])}
                  style={{ color: currentTheme.primary }}
                  className="text-[10px] font-bold uppercase cursor-pointer"
                >
                  {t('common.clear')}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {paymentMethods.map((pm) => {
                const isSelected = filterPaymentIds.includes(pm.id);
                const c = pm.color || currentTheme.primary;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() =>
                      setFilterPaymentIds((prev) => toggleId(prev, pm.id))
                    }
                    style={{
                      backgroundColor: isSelected ? `${c}28` : currentTheme.bgDark,
                      borderColor: isSelected ? c : 'transparent',
                      color: isSelected ? c : currentTheme.secondaryText,
                    }}
                    className="px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <DynamicIcon name={normalizeIconName(pm.icon)} size={13} />
                    <span>{pm.name}</span>
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Contextos (multi-seleção) */}
          {contexts.length > 0 && (
            <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span
                  style={{ color: currentTheme.secondaryText }}
                  className="text-[10px] font-bold uppercase tracking-wider"
                >
                  {t('extrato.contextsFilter')}
                  {filterContextIds.length > 0 && ` (${filterContextIds.length})`}
                </span>
                {filterContextIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterContextIds([])}
                    style={{ color: currentTheme.primary }}
                    className="text-[10px] font-bold uppercase cursor-pointer"
                  >
                    {t('common.clear')}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {contexts.map((ctx) => {
                  const isSelected = filterContextIds.includes(ctx.id);
                  return (
                    <button
                      key={ctx.id}
                      type="button"
                      onClick={() =>
                        setFilterContextIds((prev) => toggleId(prev, ctx.id))
                      }
                      style={{
                        backgroundColor: isSelected
                          ? `${currentTheme.primary}28`
                          : currentTheme.bgDark,
                        borderColor: isSelected
                          ? currentTheme.primary
                          : 'transparent',
                        color: isSelected
                          ? currentTheme.primary
                          : currentTheme.secondaryText,
                      }}
                      className="px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <span>#{ctx.name}</span>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Placar Dinâmico da Consulta */}
      <div
        style={{ backgroundColor: currentTheme.bgCard }}
        className="px-4 py-3 rounded-2xl flex items-center justify-between text-xs"
      >
        <span style={{ color: currentTheme.secondaryText }} className="font-bold">
          {filteredTransactions.length}{' '}
          {filteredTransactions.length === 1
            ? t('extrato.lapSingular')
            : t('extrato.lapPlural')}
        </span>

        <div className="flex items-center gap-3 font-black">
          {summary.income > 0 && (
            <span className="text-emerald-400">
              +{formatCurrency(summary.income, locale)}
            </span>
          )}
          {summary.expense > 0 && (
            <span style={{ color: currentTheme.primaryText }}>
              -{formatCurrency(summary.expense, locale)}
            </span>
          )}
          {summary.income === 0 && summary.expense === 0 && (
            <span style={{ color: currentTheme.secondaryText }}>
              {formatCurrency(0, locale)}
            </span>
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
            {t('extrato.empty')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groupedByDay.map((group) => (
            <div key={group.date} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span
                  style={{ color: currentTheme.secondaryText }}
                  className="text-[11px] font-black uppercase tracking-wider"
                >
                  {formatDayHeading(
                    group.date,
                    locale,
                    periodMode === 'all',
                    t('common.today'),
                    t('common.yesterday')
                  )}
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
                  {formatCurrency(group.dayNet, locale)}
                </span>
              </div>

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

                          <div
                            style={{ color: currentTheme.secondaryText }}
                            className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-medium mt-0.5"
                          >
                            <span>{cat?.name || t('extrato.noCategory')}</span>
                            {pm && <span>• {pm.name}</span>}
                            {ctx && (
                              <span style={{ color: currentTheme.primary }}>
                                #{ctx.name}
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
                        {isIncome ? '+' : '-'}{' '}
                        {formatCurrency(Number(tx.amount), locale)}
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