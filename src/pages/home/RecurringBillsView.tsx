import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Loader2,
  CalendarClock,
  Pencil,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { getAppLocale } from '../../i18n';
import { DynamicIcon } from '../../components/DynamicIcon';
import { SearchableSelect } from '../../components/SearchableSelect';
import { MonthSelector } from '../../components/home/MonthSelector';
import { formatCurrency, normalizeIconName } from '../../utils/format';
import type { RecurringBill } from '../../types/finance';

interface RecurringBillsViewProps {
  year: number;
  month: number; // 0 a 11
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onBack: () => void;
}

export function RecurringBillsView({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onBack,
}: RecurringBillsViewProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = getAppLocale(i18n.language);

  const {
    recurringBills,
    transactions,
    categories,
    paymentMethods,
    addRecurringBill,
    editRecurringBill,
    removeRecurringBill,
    addTransaction,
  } = useData();

  const [editing, setEditing] = useState<RecurringBill | 'new' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [amountCents, setAmountCents] = useState(0);
  const [dueDay, setDueDay] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'EXPENSE'),
    [categories]
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const paymentMap = useMemo(
    () => new Map(paymentMethods.map((pm) => [pm.id, pm])),
    [paymentMethods]
  );

  const selectedMonthNumber = month + 1;
  const currentMonthPrefix = `${year}-${String(selectedMonthNumber).padStart(2, '0')}`;

  const paidThisMonthIds = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.recurring_bill_id && tx.date.startsWith(currentMonthPrefix)) {
        set.add(tx.recurring_bill_id);
      }
    });
    return set;
  }, [transactions, currentMonthPrefix]);

  const activeBills = useMemo(
    () =>
      recurringBills
        .filter((b) => b.is_active)
        .sort((a, b) => a.due_day - b.due_day),
    [recurringBills]
  );

  const pausedBills = useMemo(
    () =>
      recurringBills
        .filter((b) => !b.is_active)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [recurringBills]
  );

  const totalCommitted = activeBills.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalPaidThisMonth = activeBills
    .filter((b) => paidThisMonthIds.has(b.id))
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const openCreate = () => {
    setEditing('new');
    setConfirmDelete(false);
    setName('');
    setAmountCents(0);
    setDueDay('10');
    setCategoryId(expenseCategories[0]?.id || '');
    setPaymentMethodId(paymentMethods[0]?.id || '');
    setIsActive(true);
    setError(null);
  };

  const openEdit = (bill: RecurringBill) => {
    setEditing(bill);
    setConfirmDelete(false);
    setName(bill.name);
    setAmountCents(Math.round(Number(bill.amount) * 100));
    setDueDay(String(bill.due_day));
    setCategoryId(bill.category_id || expenseCategories[0]?.id || '');
    setPaymentMethodId(bill.payment_method_id || '');
    setIsActive(bill.is_active);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDay = Number(dueDay);
    const parsedAmount = amountCents / 100;

    if (name.trim().length < 2) {
      setError(t('common.minCharsError'));
      return;
    }
    if (parsedAmount <= 0) {
      setError(t('recurring.validationAmount'));
      return;
    }
    if (!parsedDay || parsedDay < 1 || parsedDay > 31) {
      setError(t('recurring.validationDay'));
      return;
    }
    if (!categoryId) {
      setError(t('recurring.validationCategory'));
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        amount: parsedAmount,
        due_day: parsedDay,
        category_id: categoryId,
        payment_method_id: paymentMethodId || null,
        is_active: isActive,
      };

      if (editing === 'new') {
        await addRecurringBill(payload);
      } else if (editing) {
        await editRecurringBill(editing.id, payload);
      }
      setEditing(null);
    } catch (err: any) {
      setError(err.message || t('recurring.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing || editing === 'new') return;

    setIsSaving(true);
    setError(null);
    try {
      await removeRecurringBill(editing.id);
      setEditing(null);
      setConfirmDelete(false);
    } catch (err: any) {
      setError(err.message || t('recurring.deleteError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLaunchBill = async (bill: RecurringBill) => {
    const targetCategoryId = bill.category_id || expenseCategories[0]?.id;
    if (!targetCategoryId) {
      setListError(t('recurring.launchNoCategory'));
      return;
    }

    setLaunchingId(bill.id);
    setListError(null);
    try {
      const lastDayOfMonth = new Date(year, selectedMonthNumber, 0).getDate();
      const safeDay = Math.min(bill.due_day, lastDayOfMonth);
      const txDate = `${currentMonthPrefix}-${String(safeDay).padStart(2, '0')}`;

      await addTransaction({
        description: bill.name,
        amount: Number(bill.amount),
        date: txDate,
        type: 'EXPENSE',
        category_id: targetCategoryId,
        payment_method_id: bill.payment_method_id || null,
        recurring_bill_id: bill.id,
        installments: 1,
      });
    } catch (err: any) {
      setListError(err.message || t('recurring.launchError'));
    } finally {
      setLaunchingId(null);
    }
  };

  // ==========================================
  // SUB-TELA: CRIAR / EDITAR CONTA RECORRENTE
  // ==========================================
  if (editing !== null) {
    const isNew = editing === 'new';

    return (
      <div
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
        className="p-5 max-w-md mx-auto flex flex-col gap-5"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(null)}
            aria-label={t('common.back')}
            style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
            className="p-2.5 rounded-xl cursor-pointer active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-widest block"
            >
              {t('recurring.formSubtitle')}
            </span>
            <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
              {isNew ? t('recurring.newTitle') : t('recurring.editTitle')}
            </h2>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500 text-red-200 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              {t('recurring.nameLabel')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('recurring.namePlaceholder')}
              style={{ color: currentTheme.primaryText }}
              className="w-full text-sm font-semibold bg-transparent focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
              <label
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase block mb-1"
              >
                {t('recurring.monthlyAmountLabel')}
              </label>
              <div className="flex items-center gap-1">
                <span style={{ color: currentTheme.secondaryText }} className="text-xs font-bold">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={(amountCents / 100).toLocaleString(locale, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setAmountCents(Number(digits));
                  }}
                  style={{ color: currentTheme.primaryText }}
                  className="w-full text-sm font-black bg-transparent focus:outline-none"
                  required
                />
              </div>
            </div>

            <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
              <label
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase block mb-1"
              >
                {t('recurring.dueDayLabel')}
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="10"
                style={{ color: currentTheme.primaryText }}
                className="w-full text-sm font-semibold bg-transparent focus:outline-none"
                required
              />
            </div>
          </div>

          <SearchableSelect
            label={t('recurring.categoryLabel')}
            placeholder={t('recurring.categoryPlaceholder')}
            options={expenseCategories.map((cat) => ({
              id: cat.id,
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
            }))}
            value={categoryId}
            onChange={setCategoryId}
            required
          />

          <SearchableSelect
            label={t('recurring.paymentLabel')}
            placeholder={t('recurring.paymentPlaceholder')}
            options={paymentMethods.map((pm) => ({
              id: pm.id,
              name: pm.name,
              icon: normalizeIconName(pm.icon),
              color: pm.color,
            }))}
            value={paymentMethodId}
            onChange={setPaymentMethodId}
          />

          <button
            type="button"
            onClick={() => setIsActive((prev) => !prev)}
            style={{ backgroundColor: currentTheme.bgCard }}
            className="p-4 rounded-xl flex items-center justify-between gap-3 cursor-pointer text-left"
          >
            <div>
              <span
                style={{ color: currentTheme.primaryText }}
                className="text-sm font-bold block"
              >
                {t('recurring.activeToggleTitle')}
              </span>
              <span
                style={{ color: currentTheme.secondaryText }}
                className="text-[11px] font-medium"
              >
                {isActive ? t('recurring.activeToggleOn') : t('recurring.activeToggleOff')}
              </span>
            </div>

            <div
              style={{
                backgroundColor: isActive ? currentTheme.primary : currentTheme.bgDark,
              }}
              className="w-12 h-7 rounded-full p-1 transition-colors shrink-0 flex items-center"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            style={{ backgroundColor: currentTheme.primary, color: currentTheme.primaryText }}
            className="w-full py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-50 mt-2"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Check size={20} strokeWidth={3} />
            )}
            {isNew ? t('recurring.createBtn') : t('common.saveChanges')}
          </button>

          {!isNew && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={isSaving}
              className="w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <Trash2 size={16} />
              {t('recurring.deleteBtn')}
            </button>
          )}

          {!isNew && confirmDelete && (
            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 flex flex-col gap-3">
              <div className="text-center">
                <p className="text-xs font-black uppercase text-red-300">
                  {t('common.confirmDeleteTitle')}
                </p>
                <p className="text-xs text-red-200/80 mt-0.5">
                  {t('common.confirmDeleteMessage', { name: editing.name })}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isSaving}
                  style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
                  className="py-2.5 rounded-xl text-xs font-bold uppercase cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="py-2.5 rounded-xl text-xs font-black uppercase bg-red-500 text-white cursor-pointer disabled:opacity-50"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    );
  }

  // ==========================================
  // TELA PRINCIPAL: LISTA DE CONTAS RECORRENTES
  // ==========================================
  return (
    <div
      style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
      className="p-5 max-w-md mx-auto flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label={t('common.back')}
            style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
            className="p-2.5 rounded-xl cursor-pointer active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-widest block"
            >
              {t('recurring.subtitle')}
            </span>
            <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
              {t('recurring.title')}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          style={{ backgroundColor: currentTheme.primary, color: currentTheme.primaryText }}
          className="px-3.5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
        >
          <Plus size={16} strokeWidth={3} />
          {t('common.newFem')}
        </button>
      </div>

      <MonthSelector
        year={year}
        month={month}
        onPrev={onPrevMonth}
        onNext={onNextMonth}
      />

      {listError && (
        <div className="p-3 rounded-xl bg-red-500/20 border border-red-500 text-red-200 text-xs font-bold">
          {listError}
        </div>
      )}

      {/* Card Resumo do Mês */}
      <div style={{ backgroundColor: currentTheme.bgCard }} className="p-5 rounded-3xl flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-widest block truncate"
            >
              {t('recurring.committedLabel', {
                count: activeBills.length,
                status:
                  activeBills.length === 1
                    ? t('home.activeSingular')
                    : t('home.activePlural'),
              })}
            </span>
            <div style={{ color: currentTheme.primaryText }} className="text-2xl font-black mt-0.5">
              {formatCurrency(totalCommitted, locale)}
            </div>
          </div>
          <div
            style={{ backgroundColor: `${currentTheme.primary}20`, color: currentTheme.primary }}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          >
            <CalendarClock size={20} />
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
          <span style={{ color: currentTheme.secondaryText }}>
            {t('recurring.paidThisMonth')}{' '}
            <strong className="text-emerald-400">
              {formatCurrency(totalPaidThisMonth, locale)}
            </strong>
          </span>
          <span style={{ color: currentTheme.secondaryText }}>
            {t('recurring.remainingThisMonth')}{' '}
            <strong style={{ color: currentTheme.primaryText }}>
              {formatCurrency(Math.max(totalCommitted - totalPaidThisMonth, 0), locale)}
            </strong>
          </span>
        </div>
      </div>

      {/* Lista de Contas Ativas */}
      <div className="flex flex-col gap-2.5">
        <span
          style={{ color: currentTheme.secondaryText }}
          className="text-[10px] font-bold uppercase tracking-widest px-1"
        >
          {t('recurring.activeSection')}
        </span>

        {activeBills.length === 0 ? (
          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-6 rounded-2xl text-center">
            <p style={{ color: currentTheme.secondaryText }} className="text-xs">
              {t('recurring.emptyActive')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {activeBills.map((bill) => {
              const cat = bill.category_id ? categoryMap.get(bill.category_id) : null;
              const pm = bill.payment_method_id ? paymentMap.get(bill.payment_method_id) : null;
              const isPaid = paidThisMonthIds.has(bill.id);
              const isLaunching = launchingId === bill.id;
              const catColor = cat?.color || currentTheme.primary;

              return (
                <div
                  key={bill.id}
                  style={{ backgroundColor: currentTheme.bgCard }}
                  className="p-4 rounded-2xl flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => openEdit(bill)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer text-left"
                  >
                    <div
                      style={{ backgroundColor: `${catColor}22`, color: catColor }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    >
                      <DynamicIcon name={cat?.icon} size={18} />
                    </div>

                    <div className="min-w-0">
                      <span
                        style={{ color: currentTheme.primaryText }}
                        className="text-sm font-bold block truncate"
                      >
                        {bill.name}
                      </span>
                      <span
                        style={{ color: currentTheme.secondaryText }}
                        className="text-[11px] font-medium block truncate"
                      >
                        {t('recurring.dueDayBadge', { day: bill.due_day })} •{' '}
                        {formatCurrency(Number(bill.amount), locale)}
                        {pm ? ` • ${pm.name}` : ''}
                      </span>
                    </div>
                  </button>

                  {isPaid ? (
                    <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 text-[11px] font-black uppercase flex items-center gap-1 shrink-0">
                      <CheckCircle2 size={14} />
                      {t('recurring.paidBadge')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isLaunching}
                      onClick={() => handleLaunchBill(bill)}
                      style={{ backgroundColor: currentTheme.primary, color: currentTheme.primaryText }}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-black uppercase flex items-center gap-1 cursor-pointer active:scale-95 transition-transform disabled:opacity-50 shrink-0"
                    >
                      {isLaunching ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        t('recurring.launchBtn')
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de Contas Pausadas / Canceladas */}
      {pausedBills.length > 0 && (
        <div className="flex flex-col gap-2">
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase tracking-widest px-1"
          >
            {t('recurring.pausedSection')}
          </span>

          <div
            style={{ backgroundColor: currentTheme.bgCard }}
            className="rounded-2xl overflow-hidden divide-y divide-white/5 opacity-70"
          >
            {pausedBills.map((bill) => (
              <button
                key={bill.id}
                type="button"
                onClick={() => openEdit(bill)}
                className="w-full px-4 py-3 flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="text-left min-w-0">
                  <span
                    style={{ color: currentTheme.primaryText }}
                    className="text-xs font-bold block line-through truncate"
                  >
                    {bill.name}
                  </span>
                  <span style={{ color: currentTheme.secondaryText }} className="text-[11px]">
                    {t('recurring.dueDayBadge', { day: bill.due_day })} •{' '}
                    {formatCurrency(Number(bill.amount), locale)}
                  </span>
                </div>
                <Pencil size={14} style={{ color: currentTheme.secondaryText }} className="shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}