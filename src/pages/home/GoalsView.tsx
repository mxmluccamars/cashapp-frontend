import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Check,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { DynamicIcon } from '../../components/DynamicIcon';
import { IconPicker } from '../../components/IconPicker';
import type { Goal } from '../../types/finance';

interface GoalsViewProps {
  onBack: () => void;
}

const COLOR_PRESETS = [
  '#8B5CF6', '#10B981', '#3B82F6', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#64748B',
];

const formatBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export function GoalsView({ onBack }: GoalsViewProps) {
  const { currentTheme } = useTheme();
  const {
    goals,
    transactions,
    categories,
    paymentMethods,
    addGoal,
    editGoal,
    removeGoal,
    addCategory,
    addTransaction,
  } = useData();

  // Navegação interna: lista -> detalhe -> formulário de criação/edição
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Goal | 'new' | null>(null);

  // Estado do painel rápido de Guardar / Resgatar
  const [moveMode, setMoveMode] = useState<'deposit' | 'withdraw' | null>(null);
  const [moveCents, setMoveCents] = useState(0);
  const [movePaymentId, setMovePaymentId] = useState('');
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);

  // Campos do formulário de criar/editar caixinha
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('#8B5CF6');
  const [icon, setIcon] = useState('PiggyBank');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcula o saldo acumulado de cada caixinha: EXPENSE soma (+), INCOME subtrai (-)
  const balanceByGoal = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      if (!tx.goal_id) return;
      const val = Number(tx.amount);
      const delta = tx.type === 'EXPENSE' ? val : -val;
      map.set(tx.goal_id, (map.get(tx.goal_id) || 0) + delta);
    });
    return map;
  }, [transactions]);

  // Formas de pagamento à vista (Pix, Dinheiro, etc.) para movimentar caixinha
  const cashPaymentMethods = useMemo(
    () => paymentMethods.filter((pm) => !pm.allows_installments && !pm.allow_installments),
    [paymentMethods]
  );

  const selectedGoal = goals.find((g) => g.id === selectedGoalId) || null;

  const openCreate = () => {
    setEditing('new');
    setName('');
    setDescription('');
    setTargetAmount('');
    setTargetDate('');
    setColor('#8B5CF6');
    setIcon('PiggyBank');
    setError(null);
  };

  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setName(goal.name);
    setDescription(goal.description || '');
    setTargetAmount(String(goal.target_amount));
    setTargetDate(goal.target_date || '');
    setColor(goal.color || '#8B5CF6');
    setIcon(goal.icon || 'PiggyBank');
    setError(null);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('O nome da caixinha precisa ter pelo menos 2 caracteres.');
      return;
    }
    if (!targetAmount || Number(targetAmount) <= 0) {
      setError('Informe um valor alvo maior que zero.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        target_amount: Number(targetAmount),
        target_date: targetDate || null,
        color,
        icon: icon || 'PiggyBank',
      };

      if (editing === 'new') {
        await addGoal(payload);
      } else if (editing) {
        await editGoal(editing.id, payload);
      }
      setEditing(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar caixinha.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!editing || editing === 'new') return;
    if (!window.confirm(`Excluir a caixinha "${editing.name}"?`)) return;

    setIsSaving(true);
    setError(null);
    try {
      await removeGoal(editing.id);
      setEditing(null);
      setSelectedGoalId(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir caixinha.');
    } finally {
      setIsSaving(false);
    }
  };

  // Busca ou cria automaticamente a categoria dedicada ("Aporte em Metas" / "Resgate de Metas")
  const ensureGoalCategory = async (type: 'EXPENSE' | 'INCOME'): Promise<string> => {
    const targetName = type === 'EXPENSE' ? 'Aporte em Metas' : 'Resgate de Metas';
    const existing = categories.find(
      (c) => c.type === type && c.name.toLowerCase() === targetName.toLowerCase()
    );
    if (existing) return existing.id;

    const created = await addCategory({
      name: targetName,
      type,
      icon: 'PiggyBank',
      color: type === 'EXPENSE' ? '#8B5CF6' : '#10B981',
      monthly_limit: null,
    });
    return created.id;
  };

  const handleConfirmMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !moveMode) return;

    const amount = moveCents / 100;
    if (amount <= 0) {
      setError('Digite um valor maior que zero.');
      return;
    }

    setIsSubmittingMove(true);
    setError(null);
    try {
      const txType = moveMode === 'deposit' ? 'EXPENSE' : 'INCOME';
      const categoryId = await ensureGoalCategory(txType);
      const today = new Date().toISOString().split('T')[0];

      await addTransaction({
        description:
          moveMode === 'deposit'
            ? `Aporte: ${selectedGoal.name}`
            : `Resgate: ${selectedGoal.name}`,
        amount,
        date: today,
        type: txType,
        category_id: categoryId,
        payment_method_id: movePaymentId || cashPaymentMethods[0]?.id || null,
        goal_id: selectedGoal.id,
        installments: 1,
      });

      setMoveMode(null);
      setMoveCents(0);
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar movimentação.');
    } finally {
      setIsSubmittingMove(false);
    }
  };

  // ==========================================
  // SUB-TELA 1: CRIAR / EDITAR CAIXINHA
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
              Caixinhas
            </span>
            <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
              {isNew ? 'Nova Caixinha' : 'Editar Caixinha'}
            </h2>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500 text-red-200 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSaveGoal} className="flex flex-col gap-4">
          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              Nome da Meta *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Viagem Copa 2030, Reserva de Emergência..."
              style={{ color: currentTheme.primaryText }}
              className="w-full text-sm font-semibold bg-transparent focus:outline-none"
              required
            />
          </div>

          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes do objetivo..."
              style={{ color: currentTheme.primaryText }}
              className="w-full text-sm font-semibold bg-transparent focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
              <label
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase block mb-1"
              >
                Valor Alvo (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="10000.00"
                style={{ color: currentTheme.primaryText }}
                className="w-full text-sm font-semibold bg-transparent focus:outline-none"
                required
              />
            </div>

            <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
              <label
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase block mb-1"
              >
                Data Limite
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                style={{ color: currentTheme.primaryText }}
                className="w-full text-sm font-semibold bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Cor */}
          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-4 rounded-xl">
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-3"
            >
              Cor
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  style={{
                    backgroundColor: hex,
                    outline: color === hex ? `3px solid ${currentTheme.primaryText}` : 'none',
                    outlineOffset: '2px',
                  }}
                  className="w-8 h-8 rounded-full cursor-pointer transition-transform active:scale-90"
                />
              ))}
            </div>
          </div>

          {/* Ícone */}
          <IconPicker value={icon} color={color} onChange={setIcon} />

          <button
            type="submit"
            disabled={isSaving}
            style={{ backgroundColor: currentTheme.primary, color: currentTheme.primaryText }}
            className="py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-50 mt-2"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
            {isNew ? 'Criar Caixinha' : 'Salvar Alterações'}
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={handleDeleteGoal}
              disabled={isSaving}
              className="py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <Trash2 size={16} />
              Excluir Caixinha
            </button>
          )}
        </form>
      </div>
    );
  }

  // ==========================================
  // SUB-TELA 2: DETALHE DA CAIXINHA (GUARDAR / RESGATAR)
  // ==========================================
  if (selectedGoal) {
    const saved = balanceByGoal.get(selectedGoal.id) || 0;
    const target = Number(selectedGoal.target_amount);
    const pct = target > 0 ? Math.min(Math.round((saved / target) * 100), 100) : 0;
    const goalColor = selectedGoal.color || '#8B5CF6';

    const goalHistory = transactions
      .filter((tx) => tx.goal_id === selectedGoal.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div className="p-5 pb-10 max-w-md mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedGoalId(null);
                setMoveMode(null);
                setError(null);
              }}
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
                Caixinha
              </span>
              <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
                {selectedGoal.name}
              </h2>
            </div>
          </div>

          <button
            onClick={() => openEdit(selectedGoal)}
            style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
            className="p-2.5 rounded-xl cursor-pointer active:scale-90 transition-transform"
            title="Editar caixinha"
          >
            <Pencil size={18} />
          </button>
        </div>

        {/* Card de Progresso */}
        <div style={{ backgroundColor: currentTheme.bgCard }} className="p-5 rounded-3xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div
              style={{ backgroundColor: `${goalColor}25`, color: goalColor }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
            >
              <DynamicIcon name={selectedGoal.icon} size={22} />
            </div>

            {selectedGoal.target_date && (
              <div
                style={{ color: currentTheme.secondaryText }}
                className="flex items-center gap-1.5 text-xs font-bold"
              >
                <Calendar size={14} />
                <span>{selectedGoal.target_date.split('-').reverse().join('/')}</span>
              </div>
            )}
          </div>

          <div>
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-widest block"
            >
              Total Guardado
            </span>
            <div style={{ color: currentTheme.primaryText }} className="text-3xl font-black mt-0.5">
              {formatBRL(saved)}
            </div>
            <span style={{ color: currentTheme.secondaryText }} className="text-xs font-medium">
              de {formatBRL(target)} ({pct}%)
            </span>
          </div>

          <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              style={{ width: `${Math.max(pct, 0)}%`, backgroundColor: goalColor }}
              className="h-full rounded-full transition-all duration-500"
            />
          </div>

          {selectedGoal.description && (
            <p style={{ color: currentTheme.secondaryText }} className="text-xs">
              {selectedGoal.description}
            </p>
          )}
        </div>

        {/* Botões Guardar / Resgatar */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setMoveMode('deposit');
              setMoveCents(0);
              setMovePaymentId(cashPaymentMethods[0]?.id || '');
              setError(null);
            }}
            style={{ backgroundColor: currentTheme.primary, color: currentTheme.primaryText }}
            className="py-3.5 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <ArrowUpCircle size={18} />
            Guardar
          </button>

          <button
            type="button"
            onClick={() => {
              setMoveMode('withdraw');
              setMoveCents(0);
              setMovePaymentId(cashPaymentMethods[0]?.id || '');
              setError(null);
            }}
            style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
            className="py-3.5 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <ArrowDownCircle size={18} />
            Resgatar
          </button>
        </div>

        {/* Formulário Rápido de Aporte / Resgate */}
        {moveMode && (
          <form
            onSubmit={handleConfirmMove}
            style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.primary }}
            className="p-4 rounded-2xl border flex flex-col gap-3"
          >
            <span
              style={{ color: currentTheme.primaryText }}
              className="text-xs font-black uppercase"
            >
              {moveMode === 'deposit' ? 'Quanto deseja guardar?' : 'Quanto deseja resgatar?'}
            </span>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-500/20 text-red-200 text-xs font-bold">
                {error}
              </div>
            )}

            {/* Input estilo maquininha */}
            <div
              style={{ backgroundColor: currentTheme.bgDark }}
              className="px-4 py-3 rounded-xl flex items-center gap-2"
            >
              <span style={{ color: currentTheme.secondaryText }} className="text-lg font-black">
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={(moveCents / 100).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setMoveCents(Number(digits));
                }}
                style={{ color: currentTheme.primaryText }}
                className="w-full text-2xl font-black bg-transparent focus:outline-none"
                autoFocus
              />
            </div>

            {cashPaymentMethods.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {cashPaymentMethods.map((pm) => {
                  const isActive = (movePaymentId || cashPaymentMethods[0]?.id) === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setMovePaymentId(pm.id)}
                      style={{
                        backgroundColor: isActive ? currentTheme.primary : currentTheme.bgDark,
                        color: isActive ? currentTheme.primaryText : currentTheme.secondaryText,
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {pm.name}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setMoveMode(null)}
                style={{ backgroundColor: currentTheme.bgDark, color: currentTheme.secondaryText }}
                className="py-3 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingMove}
                style={{
                  backgroundColor: moveMode === 'deposit' ? currentTheme.primary : '#10B981',
                  color: '#FFFFFF',
                }}
                className="py-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingMove ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                Confirmar
              </button>
            </div>
          </form>
        )}

        {/* Histórico da Caixinha */}
        <div className="flex flex-col gap-2">
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase tracking-widest px-1"
          >
            Histórico desta Caixinha
          </span>

          {goalHistory.length === 0 ? (
            <p style={{ color: currentTheme.secondaryText }} className="text-xs text-center py-6">
              Nenhum aporte ou resgate ainda.
            </p>
          ) : (
            <div
              style={{ backgroundColor: currentTheme.bgCard }}
              className="rounded-2xl overflow-hidden divide-y divide-white/5"
            >
              {goalHistory.map((tx) => {
                const isDeposit = tx.type === 'EXPENSE';
                const dateBr = tx.date.split('-').reverse().join('/');
                return (
                  <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <span
                        style={{ color: currentTheme.primaryText }}
                        className="text-xs font-bold block"
                      >
                        {isDeposit ? 'Aporte guardado' : 'Resgate realizado'}
                      </span>
                      <span
                        style={{ color: currentTheme.secondaryText }}
                        className="text-[11px]"
                      >
                        {dateBr}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-black ${
                        isDeposit ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isDeposit ? '+' : '-'} {formatBRL(Number(tx.amount))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // TELA PRINCIPAL: LISTA DE CAIXINHAS
  // ==========================================
  return (
    <div className="p-5 pb-10 max-w-md mx-auto flex flex-col gap-4">
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
              Metas Financeiras
            </span>
            <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
              Caixinhas
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

      {goals.length === 0 ? (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-8 rounded-2xl text-center"
        >
          <p style={{ color: currentTheme.secondaryText }} className="text-xs font-medium">
            Você ainda não criou nenhuma caixinha. Toque em "+ Nova" para começar!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((goal) => {
            const saved = balanceByGoal.get(goal.id) || 0;
            const target = Number(goal.target_amount);
            const pct = target > 0 ? Math.min(Math.round((saved / target) * 100), 100) : 0;
            const goalColor = goal.color || '#8B5CF6';

            return (
              <button
                key={goal.id}
                onClick={() => setSelectedGoalId(goal.id)}
                style={{ backgroundColor: currentTheme.bgCard }}
                className="p-4 rounded-2xl text-left flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: `${goalColor}25`, color: goalColor }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    >
                      <DynamicIcon name={goal.icon} size={20} />
                    </div>
                    <div>
                      <span
                        style={{ color: currentTheme.primaryText }}
                        className="text-sm font-black block"
                      >
                        {goal.name}
                      </span>
                      <span
                        style={{ color: currentTheme.secondaryText }}
                        className="text-[11px] font-medium"
                      >
                        {formatBRL(saved)} de {formatBRL(target)}
                      </span>
                    </div>
                  </div>

                  <span style={{ color: goalColor }} className="text-xs font-black">
                    {pct}%
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    style={{ width: `${Math.max(pct, 0)}%`, backgroundColor: goalColor }}
                    className="h-full rounded-full"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}