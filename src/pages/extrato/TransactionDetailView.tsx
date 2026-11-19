import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Trash2,
  Layers,
  Target,
  Repeat,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import type { Transaction } from '../../types/finance';
import { InstallmentGroupView } from './InstallmentGroupView';

interface TransactionDetailViewProps {
  transaction: Transaction;
  onBack: () => void;
  onSelectTransaction: (txId: string) => void;
}

const getTodayLocalISO = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function TransactionDetailView({
  transaction,
  onBack,
  onSelectTransaction,
}: TransactionDetailViewProps) {
  const { currentTheme } = useTheme();
  const {
    categories,
    paymentMethods,
    contexts,
    locations,
    goals,
    recurringBills,
    editTransaction,
    removeTransaction,
    addTransaction,
  } = useData();

  // Campos editáveis
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
  const [locationId, setLocationId] = useState(transaction.location_id || '');
  const [notes, setNotes] = useState(transaction.notes || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
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
      setError('O valor precisa ser maior que zero.');
      return;
    }
    if (description.trim().length < 2) {
      setError('Informe uma descrição válida.');
      return;
    }
    if (!categoryId) {
      setError('Selecione uma categoria.');
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
        location_id: locationId || null,
        notes: notes.trim() || null,
      });
      onBack();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar lançamento.');
    } finally {
      setIsSaving(false);
    }
  };

const handleDuplicateToday = async () => {
    const amount = amountCents / 100;
    const formattedVal = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);

    const confirmed = window.confirm(
      `Repetir "${description.trim() || transaction.description}" (${formattedVal}) na data de hoje?`
    );
    if (!confirmed) return;

    setIsDuplicating(true);
    setError(null);
    try {
      await addTransaction({
        description: description.trim() || transaction.description,
        amount,
        date: getTodayLocalISO(),
        type,
        category_id: categoryId,
        payment_method_id: paymentMethodId || null,
        context_id: contextId || null,
        location_id: locationId || null,
        notes: notes.trim() || null,
        installments: 1,
      });
      onBack();
    } catch (err: any) {
      setError(err.message || 'Erro ao duplicar lançamento.');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    const isParcel =
      transaction.installment_total && transaction.installment_total > 1;
    const msg = isParcel
      ? `Excluir apenas a parcela ${transaction.installment_current}/${transaction.installment_total} de "${transaction.description}"?`
      : `Excluir o lançamento "${transaction.description}"?`;

    if (!window.confirm(msg)) return;

    setIsSaving(true);
    setError(null);
    try {
      await removeTransaction(transaction.id);
      onBack();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir lançamento.');
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

  return (
    <div className="p-5 pb-10 max-w-md mx-auto flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            style={{
              backgroundColor: currentTheme.bgCard,
              color: currentTheme.primaryText,
            }}
            className="p-2.5 rounded-xl cursor-pointer active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-widest block"
            >
              Detalhes da Volta
            </span>
            <h2
              style={{ color: currentTheme.primaryText }}
              className="text-lg font-black uppercase"
            >
              Editar Lançamento
            </h2>
          </div>
        </div>

        {/* Botão Duplicar para Hoje */}
        <button
          type="button"
          onClick={handleDuplicateToday}
          disabled={isDuplicating || isSaving}
          style={{
            backgroundColor: currentTheme.bgCard,
            color: currentTheme.primary,
          }}
          className="px-3 py-2 rounded-xl text-[11px] font-black uppercase flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
          title="Criar uma cópia igual na data de hoje"
        >
          {isDuplicating ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <Copy size={14} />
          )}
          Repetir hoje
        </button>
      </div>

      {/* Badges informativos de origem (Parcela / Caixinha / Recorrente) */}
      {(transaction.installment_total && transaction.installment_total > 1) ||
      linkedGoal ||
      linkedBill ? (
        <div className="flex flex-wrap gap-2">
          {transaction.installment_total && transaction.installment_total > 1 && (
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
                Parcela {transaction.installment_current} de{' '}
                {transaction.installment_total}
              </span>
              {transaction.installment_group_id && <ChevronRight size={14} />}
            </button>
          )}
        </div>
      ) : null}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/20 border border-red-500 text-red-200 text-xs font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-4">
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
            Saída
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
            Entrada
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
            value={(amountCents / 100).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              setAmountCents(Number(digits));
            }}
            style={{ color: currentTheme.primaryText }}
            className="w-full text-3xl font-black bg-transparent focus:outline-none"
            required
          />
        </div>

        {/* Descrição e Data */}
        <div className="grid grid-cols-3 gap-3">
          <div
            style={{ backgroundColor: currentTheme.bgCard }}
            className="col-span-2 p-3.5 rounded-xl"
          >
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              Descrição *
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

          <div
            style={{ backgroundColor: currentTheme.bgCard }}
            className="col-span-1 p-3.5 rounded-xl"
          >
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              Data *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ color: currentTheme.primaryText }}
              className="w-full text-xs font-semibold bg-transparent focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Categoria & Forma de Pagamento */}
        <div className="grid grid-cols-2 gap-3">
          <div
            style={{ backgroundColor: currentTheme.bgCard }}
            className="p-3.5 rounded-xl"
          >
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              Categoria *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{
                color: currentTheme.primaryText,
                backgroundColor: currentTheme.bgCard,
              }}
              className="w-full text-xs font-bold focus:outline-none cursor-pointer"
              required
            >
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{ backgroundColor: currentTheme.bgCard }}
            className="p-3.5 rounded-xl"
          >
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              Pagamento
            </label>
            <select
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              style={{
                color: currentTheme.primaryText,
                backgroundColor: currentTheme.bgCard,
              }}
              className="w-full text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="">Nenhum</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contexto & Local */}
        <div className="grid grid-cols-2 gap-3">
          <div
            style={{ backgroundColor: currentTheme.bgCard }}
            className="p-3.5 rounded-xl"
          >
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              Contexto
            </label>
            <select
              value={contextId}
              onChange={(e) => setContextId(e.target.value)}
              style={{
                color: currentTheme.primaryText,
                backgroundColor: currentTheme.bgCard,
              }}
              className="w-full text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="">Nenhum</option>
              {contexts.map((ctx) => (
                <option key={ctx.id} value={ctx.id}>
                  #{ctx.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{ backgroundColor: currentTheme.bgCard }}
            className="p-3.5 rounded-xl"
          >
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              Local
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              style={{
                color: currentTheme.primaryText,
                backgroundColor: currentTheme.bgCard,
              }}
              className="w-full text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="">Nenhum</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                  {loc.city ? ` (${loc.city})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Observações */}
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-3.5 rounded-xl"
        >
          <label
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase block mb-1"
          >
            Observações (opcional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalhes extras sobre esse lançamento..."
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
          className="py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-50 mt-1"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Check size={20} strokeWidth={3} />
          )}
          Salvar Alterações
        </button>

        {/* Excluir */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isSaving}
          className="py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
        >
          <Trash2 size={16} />
          Excluir Lançamento
        </button>
      </form>
    </div>
  );
}