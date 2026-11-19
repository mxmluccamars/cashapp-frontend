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
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { DynamicIcon } from '../../components/DynamicIcon';
import { MonthSelector } from '../../components/home/MonthSelector';
import type { RecurringBill } from '../../types/finance';

interface RecurringBillsViewProps {
  year: number;
  month: number; // 0 a 11
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onBack: () => void;
}

const formatBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export function RecurringBillsView({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onBack,
}: RecurringBillsViewProps) {
  const { currentTheme } = useTheme();
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
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  // Campos do formulário
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

  // Prefixo do mês selecionado (ex: "2026-11") para checar o que já foi pago naquele mês
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
      setError('O nome precisa ter pelo menos 2 caracteres.');
      return;
    }
    if (parsedAmount <= 0) {
      setError('Informe um valor mensal maior que zero.');
      return;
    }
    if (!parsedDay || parsedDay < 1 || parsedDay > 31) {
      setError('O dia de vencimento deve estar entre 1 e 31.');
      return;
    }
    if (!categoryId) {
      setError('Selecione uma categoria padrão para facilitar o lançamento.');
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
      setError(err.message || 'Erro ao salvar conta recorrente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing || editing === 'new') return;
    if (!window.confirm(`Excluir a conta recorrente "${editing.name}"?`)) return;

    setIsSaving(true);
    setError(null);
    try {
      await removeRecurringBill(editing.id);
      setEditing(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir conta recorrente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Lançamento em 1 clique para o mês selecionado
  const handleLaunchBill = async (bill: RecurringBill) => {
    const targetCategoryId = bill.category_id || expenseCategories[0]?.id;
    if (!targetCategoryId) {
      alert('Cadastre ou vincule uma categoria de saída nesta conta antes de lançar.');
      return;
    }

    setLaunchingId(bill.id);
    try {
      // Ajusta o dia para não estourar meses menores (ex: dia 31 em fevereiro vira 28)
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
      alert(err.message || 'Erro ao lançar conta recorrente.');
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
      <div className="p-5 pb-10 max-w-md mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(null)}
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
              Contas Recorrentes
            </span>
            <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
              {isNew ? 'Nova Assinatura' : 'Editar Assinatura'}
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
              Nome da Conta / Assinatura *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Netflix, Internet Fibra, Academia..."
              style={{ color: currentTheme.primaryText }}
              className="w-full text-sm font-semibold bg-transparent focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Valor Mensal estilo maquininha */}
            <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
              <label
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase block mb-1"
              >
                Valor Mensal *
              </label>
              <div className="flex items-center gap-1">
                <span style={{ color: currentTheme.secondaryText }} className="text-xs font-bold">
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
                Dia Vencimento *
              </label>
              <input
                type="number"
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

          {/* Categoria Padrão */}
          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              Categoria Padrão *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{ color: currentTheme.primaryText, backgroundColor: currentTheme.bgCard }}
              className="w-full text-sm font-semibold focus:outline-none cursor-pointer"
              required
            >
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Forma de Pagamento Padrão */}
          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              Forma de Pagamento Padrão
            </label>
            <select
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              style={{ color: currentTheme.primaryText, backgroundColor: currentTheme.bgCard }}
              className="w-full text-sm font-semibold focus:outline-none cursor-pointer"
            >
              <option value="">Nenhuma</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Ativa / Pausada */}
          <button
            type="button"
            onClick={() => setIsActive((prev) => !prev)}
            style={{ backgroundColor: currentTheme.bgCard }}
            className="p-4 rounded-xl flex items-center justify-between cursor-pointer text-left"
          >
            <div>
              <span
                style={{ color: currentTheme.primaryText }}
                className="text-sm font-bold block"
              >
                Assinatura Ativa
              </span>
              <span
                style={{ color: currentTheme.secondaryText }}
                className="text-[11px] font-medium"
              >
                {isActive
                  ? 'Entra na previsão mensal de custos fixos'
                  : 'Pausada / Cancelada (mantém histórico)'}
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
            className="py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-50 mt-2"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
            {isNew ? 'Criar Assinatura' : 'Salvar Alterações'}
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <Trash2 size={16} />
              Excluir Assinatura
            </button>
          )}
        </form>
      </div>
    );
  }

  // ==========================================
  // TELA PRINCIPAL: LISTA DE CONTAS RECORRENTES
  // ==========================================
  return (
    <div className="p-5 pb-10 max-w-md mx-auto flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
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
              Custos Fixos
            </span>
            <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
              Recorrentes
            </h2>
          </div>
        </div>

        <button
          onClick={openCreate}
          style={{ backgroundColor: currentTheme.primary, color: currentTheme.primaryText }}
          className="px-3.5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
        >
          <Plus size={16} strokeWidth={3} />
          Nova
        </button>
      </div>

      {/* Navegador de Mês sincronizado com a Home */}
      <MonthSelector
        year={year}
        month={month}
        onPrev={onPrevMonth}
        onNext={onNextMonth}
      />

      {/* Card Resumo do Mês */}
      <div style={{ backgroundColor: currentTheme.bgCard }} className="p-5 rounded-3xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-widest block"
            >
              Comprometido / Mês ({activeBills.length} ativas)
            </span>
            <div style={{ color: currentTheme.primaryText }} className="text-2xl font-black mt-0.5">
              {formatBRL(totalCommitted)}
            </div>
          </div>
          <div
            style={{ backgroundColor: `${currentTheme.primary}20`, color: currentTheme.primary }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
          >
            <CalendarClock size={20} />
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
          <span style={{ color: currentTheme.secondaryText }}>
            Pago neste mês: <strong className="text-emerald-400">{formatBRL(totalPaidThisMonth)}</strong>
          </span>
          <span style={{ color: currentTheme.secondaryText }}>
            Falta:{' '}
            <strong style={{ color: currentTheme.primaryText }}>
              {formatBRL(Math.max(totalCommitted - totalPaidThisMonth, 0))}
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
          Ativas
        </span>

        {activeBills.length === 0 ? (
          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-6 rounded-2xl text-center">
            <p style={{ color: currentTheme.secondaryText }} className="text-xs">
              Nenhuma conta recorrente ativa.
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
                  <div
                    onClick={() => openEdit(bill)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
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
                        Dia {bill.due_day} • {formatBRL(Number(bill.amount))}
                        {pm ? ` • ${pm.name}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Ação: Pago ou Lançar 1 clique */}
                  {isPaid ? (
                    <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 text-[11px] font-black uppercase flex items-center gap-1 shrink-0">
                      <CheckCircle2 size={14} />
                      Pago
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isLaunching}
                      onClick={() => handleLaunchBill(bill)}
                      style={{ backgroundColor: currentTheme.primary, color: currentTheme.primaryText }}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-black uppercase flex items-center gap-1 cursor-pointer active:scale-95 transition-transform disabled:opacity-50 shrink-0"
                    >
                      {isLaunching ? <Loader2 className="animate-spin" size={14} /> : 'Lançar'}
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
            Pausadas / Canceladas
          </span>

          <div
            style={{ backgroundColor: currentTheme.bgCard }}
            className="rounded-2xl overflow-hidden divide-y divide-white/5 opacity-70"
          >
            {pausedBills.map((bill) => (
              <button
                key={bill.id}
                onClick={() => openEdit(bill)}
                className="w-full px-4 py-3 flex items-center justify-between cursor-pointer"
              >
                <div className="text-left">
                  <span
                    style={{ color: currentTheme.primaryText }}
                    className="text-xs font-bold block line-through"
                  >
                    {bill.name}
                  </span>
                  <span style={{ color: currentTheme.secondaryText }} className="text-[11px]">
                    Dia {bill.due_day} • {formatBRL(Number(bill.amount))}
                  </span>
                </div>
                <Pencil size={14} style={{ color: currentTheme.secondaryText }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}