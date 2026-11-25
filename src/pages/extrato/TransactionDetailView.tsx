import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Trash2,
  Layers,
  ChevronRight,
  Target,
  Repeat,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { getAppLocale } from '../../i18n';
import { SearchableSelect } from '../../components/SearchableSelect';
import {
  formatCurrency,
  getLocalDateISO,
  normalizeIconName,
} from '../../utils/format';
import type { Transaction } from '../../types/finance';
import { InstallmentGroupView } from './InstallmentGroupView';

interface TransactionDetailViewProps {
  transaction: Transaction;
  onBack: () => void;
  onSelectTransaction: (txId: string) => void;
}

export function TransactionDetailView({
  transaction,
  onBack,
  onSelectTransaction,
}: TransactionDetailViewProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = getAppLocale(i18n.language);

  const {
    categories,
    paymentMethods,
    contexts,
    goals,
    recurringBills,
    editTransaction,
    removeTransaction,
    addTransaction,
  } = useData();

  const [type, setType] = useState<'EXPENSE' | 'INCOME'>(transaction.type);
  const [amountCents, setAmountCents] = useState(
    Math.round(Number(transaction.amount) * 100)
  );
  const [description, setDescription] = useState(transaction.description);
  const [date, setDate] = useState(transaction.date);
  const [categoryId, setCategoryId] = useState(transaction.category_id);
  const [paymentMethodId, setPaymentMethodId] = useState(
    transaction.payment_method_id || ''
  );
  const [contextId, setContextId] = useState(transaction.context_id || '');
  const [notes, setNotes] = useState(transaction.notes || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [confirmRepeat, setConfirmRepeat] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstallments, setShowInstallments] = useState(false);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  const linkedGoal = transaction.goal_id
    ? goals.find((g) => g.id === transaction.goal_id)
    : null;

  const linkedBill = transaction.recurring_bill_id
    ? recurringBills.find((b) => b.id === transaction.recurring_bill_id)
    : null;

  const handleTypeSwitch = (nextType: 'EXPENSE' | 'INCOME') => {
    setType(nextType);
    const validCat = categories.find(
      (c) => c.id === categoryId && c.type === nextType
    );
    if (!validCat) {
      const firstOfType = categories.find((c) => c.type === nextType);
      setCategoryId(firstOfType?.id || '');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = amountCents / 100;

    if (amount <= 0) {
      setError(t('extrato.detail.validationAmount'));
      return;
    }
    if (description.trim().length < 2) {
      setError(t('extrato.detail.validationDescription'));
      return;
    }
    if (!categoryId) {
      setError(t('extrato.detail.validationCategory'));
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await editTransaction(transaction.id, {
        description: description.trim(),
        amount,
        date,
        type,
        category_id: categoryId,
        payment_method_id: paymentMethodId || null,
        context_id: contextId || null,
        notes: notes.trim() || null,
      });
      onBack();
    } catch (err: any) {
      setError(err.message || t('extrato.detail.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateToday = async () => {
    const amount = amountCents / 100;
    setIsDuplicating(true);
    setError(null);
    try {
      await addTransaction({
        description: description.trim() || transaction.description,
        amount,
        date: getLocalDateISO(0),
        type,
        category_id: categoryId,
        payment_method_id: paymentMethodId || null,
        context_id: contextId || null,
        notes: notes.trim() || null,
        installments: 1,
      });
      onBack();
    } catch (err: any) {
      setError(err.message || t('extrato.detail.repeatError'));
      setConfirmRepeat(false);
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await removeTransaction(transaction.id);
      onBack();
    } catch (err: any) {
      setError(err.message || t('extrato.detail.deleteError'));
      setConfirmDelete(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (showInstallments && transaction.installment_group_id) {
    return (
      <InstallmentGroupView
        groupId={transaction.installment_group_id}
        currentTxId={transaction.id}
        onBack={() => setShowInstallments(false)}
        onSelectTransaction={(txId) => {
          setShowInstallments(false);
          onSelectTransaction(txId);
        }}
        onDeletedAll={onBack}
      />
    );
  }

  const isParcel = Boolean(
    transaction.installment_total && transaction.installment_total > 1
  );

  return (
    <div
      style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
      className="p-5 max-w-md mx-auto flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label={t('common.back')}
            style={{
              backgroundColor: currentTheme.bgCard,
              color: currentTheme.primaryText,
            }}
            className="p-2.5 rounded-xl cursor-pointer active:scale-90 transition-transform shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-widest block"
            >
              {t('extrato.detail.subtitle')}
            </span>
            <h2
              style={{ color: currentTheme.primaryText }}
              className="text-lg font-black uppercase truncate"
            >
              {t('extrato.detail.title')}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setConfirmDelete(false);
            setConfirmRepeat((v) => !v);
          }}
          disabled={isDuplicating || isSaving}
          style={{
            backgroundColor: currentTheme.bgCard,
            color: currentTheme.primary,
          }}
          className="px-3 py-2 rounded-xl text-[11px] font-black uppercase flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform disabled:opacity-50 shrink-0"
        >
          {isDuplicating ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <Copy size={14} />
          )}
          {t('extrato.detail.repeatToday')}
        </button>
      </div>

      {/* Confirmação Inline: Repetir Hoje */}
      {confirmRepeat && (
        <div
          style={{
            backgroundColor: `${currentTheme.primary}18`,
            borderColor: `${currentTheme.primary}45`,
          }}
          className="p-4 rounded-2xl border flex flex-col gap-3"
        >
          <div className="text-center">
            <p
              style={{ color: currentTheme.primaryText }}
              className="text-xs font-black uppercase"
            >
              {t('extrato.detail.repeatConfirmTitle')}
            </p>
            <p
              style={{ color: currentTheme.secondaryText }}
              className="text-xs mt-0.5"
            >
              {t('extrato.detail.repeatConfirmMessage', {
                description: description.trim() || transaction.description,
                value: formatCurrency(amountCents / 100, locale),
              })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setConfirmRepeat(false)}
              disabled={isDuplicating}
              style={{
                backgroundColor: currentTheme.bgCard,
                color: currentTheme.primaryText,
              }}
              className="py-2.5 rounded-xl text-xs font-bold uppercase cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleDuplicateToday}
              disabled={isDuplicating}
              style={{
                backgroundColor: currentTheme.primary,
                color: currentTheme.primaryText,
              }}
              className="py-2.5 rounded-xl text-xs font-black uppercase cursor-pointer disabled:opacity-50"
            >
              {t('common.confirm')}
            </button>
          </div>
        </div>
      )}

      {/* Badges informativos de origem */}
      {(isParcel || linkedGoal || linkedBill) && (
        <div className="flex flex-wrap gap-2">
          {isParcel && (
            <button
              type="button"
              onClick={() => {
                if (transaction.installment_group_id) {
                  setShowInstallments(true);
                }
              }}
              style={{
                backgroundColor: `${currentTheme.primary}20`,
                color: currentTheme.primary,
              }}
              className="px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <Layers size={13} />
              <span>
                {t('extrato.detail.installmentBadge', {
                  current: transaction.installment_current,
                  total: transaction.installment_total,
                })}
              </span>
              {transaction.installment_group_id && <ChevronRight size={14} />}
            </button>
          )}

          {linkedGoal && (
            <span className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-purple-500/15 text-purple-300 flex items-center gap-1.5">
              <Target size={13} />
              {t('extrato.detail.goalBadge', { name: linkedGoal.name })}
            </span>
          )}

          {linkedBill && (
            <span className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-sky-500/15 text-sky-300 flex items-center gap-1.5">
              <Repeat size={13} />
              {t('extrato.detail.billBadge', { name: linkedBill.name })}
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/20 border border-red-500 text-red-200 text-xs font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-3.5">
        {/* Tipo: Saída / Entrada */}
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-1.5 rounded-2xl grid grid-cols-2 gap-1.5"
        >
          <button
            type="button"
            onClick={() => handleTypeSwitch('EXPENSE')}
            style={{
              backgroundColor:
                type === 'EXPENSE' ? currentTheme.primary : 'transparent',
              color:
                type === 'EXPENSE'
                  ? currentTheme.primaryText
                  : currentTheme.secondaryText,
            }}
            className="py-2.5 rounded-xl text-xs font-black uppercase cursor-pointer transition-colors"
          >
            {t('extrato.detail.expense')}
          </button>
          <button
            type="button"
            onClick={() => handleTypeSwitch('INCOME')}
            style={{
              backgroundColor: type === 'INCOME' ? '#10B981' : 'transparent',
              color:
                type === 'INCOME' ? '#FFFFFF' : currentTheme.secondaryText,
            }}
            className="py-2.5 rounded-xl text-xs font-black uppercase cursor-pointer transition-colors"
          >
            {t('extrato.detail.income')}
          </button>
        </div>

        {/* Valor estilo Maquininha */}
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-4 rounded-2xl flex items-center gap-2"
        >
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-xl font-black"
          >
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
            className="w-full text-3xl font-black bg-transparent focus:outline-none"
            required
          />
        </div>

        {/* Descrição */}
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-3.5 rounded-xl"
        >
          <label
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase block mb-1"
          >
            {t('extrato.detail.description')} *
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ color: currentTheme.primaryText }}
            className="w-full text-sm font-semibold bg-transparent focus:outline-none"
            required
          />
        </div>

        {/* Data (largura total para não cortar no iOS) */}
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-3.5 rounded-xl"
        >
          <label
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase block mb-1"
          >
            {t('extrato.detail.date')} *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ color: currentTheme.primaryText, colorScheme: 'dark' }}
            className="w-full min-w-0 text-sm font-semibold bg-transparent focus:outline-none"
            required
          />
        </div>

        {/* Categoria (com ícone e cor) */}
        <SearchableSelect
          label={t('extrato.detail.category')}
          placeholder={t('extrato.detail.categoryPlaceholder')}
          options={filteredCategories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
          }))}
          value={categoryId}
          onChange={setCategoryId}
          required
        />

        {/* Forma de Pagamento (com ícone e cor) */}
        <SearchableSelect
          label={t('extrato.detail.payment')}
          placeholder={t('extrato.detail.paymentPlaceholder')}
          options={paymentMethods.map((pm) => ({
            id: pm.id,
            name: pm.name,
            icon: normalizeIconName(pm.icon),
            color: pm.color,
          }))}
          value={paymentMethodId}
          onChange={setPaymentMethodId}
        />

        {/* Contexto (opcional) */}
        {contexts.length > 0 && (
          <SearchableSelect
            label={t('extrato.detail.context')}
            placeholder={t('extrato.detail.contextPlaceholder')}
            options={contexts.map((ctx) => ({
              id: ctx.id,
              name: `#${ctx.name}`,
            }))}
            value={contextId}
            onChange={setContextId}
          />
        )}

        {/* Observações */}
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-3.5 rounded-xl"
        >
          <label
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase block mb-1"
          >
            {t('extrato.detail.notes')}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('extrato.detail.notesPlaceholder')}
            style={{ color: currentTheme.primaryText }}
            className="w-full text-xs font-medium bg-transparent focus:outline-none resize-none"
          />
        </div>

        {/* Salvar */}
        <button
          type="submit"
          disabled={isSaving}
          style={{
            backgroundColor: currentTheme.primary,
            color: currentTheme.primaryText,
          }}
          className="w-full py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-50 mt-1"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Check size={20} strokeWidth={3} />
          )}
          {t('common.saveChanges')}
        </button>

        {/* Excluir com confirmação inline */}
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => {
              setConfirmRepeat(false);
              setConfirmDelete(true);
            }}
            disabled={isSaving}
            className="w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <Trash2 size={16} />
            {t('extrato.detail.deleteBtn')}
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 flex flex-col gap-3">
            <div className="text-center">
              <p className="text-xs font-black uppercase text-red-300">
                {t('common.confirmDeleteTitle')}
              </p>
              <p className="text-xs text-red-200/80 mt-0.5">
                {isParcel
                  ? t('extrato.detail.deleteConfirmInstallment', {
                      current: transaction.installment_current,
                      total: transaction.installment_total,
                      description: transaction.description,
                    })
                  : t('extrato.detail.deleteConfirmSingle', {
                      description: transaction.description,
                    })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={isSaving}
                style={{
                  backgroundColor: currentTheme.bgCard,
                  color: currentTheme.primaryText,
                }}
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