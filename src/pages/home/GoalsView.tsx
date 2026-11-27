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
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { getAppLocale } from '../../i18n';
import { DynamicIcon } from '../../components/DynamicIcon';
import { IconPicker } from '../../components/IconPicker';
import { ColorPicker } from '../../components/ColorPicker';
import { formatCurrency, getLocalDateISO } from '../../utils/format';
import type { Goal } from '../../types/finance';

interface GoalsViewProps {
  onBack: () => void;
}

const COLOR_PRESETS = [
  '#8B5CF6', '#10B981', '#3B82F6', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#64748B',
];

const DEPOSIT_CATEGORY_ALIASES = ['aporte em metas', 'goal deposits'];
const WITHDRAW_CATEGORY_ALIASES = ['resgate de metas', 'goal withdrawals'];

export function GoalsView({ onBack }: GoalsViewProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = getAppLocale(i18n.language);

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

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Goal | 'new' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Painel rápido de Guardar / Resgatar
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

  const cashPaymentMethods = useMemo(
    () => paymentMethods.filter((pm) => !pm.allow_installments && !pm.allows_installments),
    [paymentMethods]
  );

  const selectedGoal = goals.find((g) => g.id === selectedGoalId) || null;

  const openCreate = () => {
    setEditing('new');
    setConfirmDelete(false);
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
    setConfirmDelete(false);
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
      setError(t('goals.validationName'));
      return;
    }
    if (!targetAmount || Number(targetAmount) <= 0) {
      setError(t('goals.validationTarget'));
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
      setError(err.message || t('goals.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!editing || editing === 'new') return;

    setIsSaving(true);
    setError(null);
    try {
      await removeGoal(editing.id);
      setEditing(null);
      setSelectedGoalId(null);
      setConfirmDelete(false);
    } catch (err: any) {
      setError(err.message || t('goals.deleteError'));
    } finally {
      setIsSaving(false);
    }
  };

  const ensureGoalCategory = async (type: 'EXPENSE' | 'INCOME'): Promise<string> => {
    const aliases =
      type === 'EXPENSE' ? DEPOSIT_CATEGORY_ALIASES : WITHDRAW_CATEGORY_ALIASES;
    const existing = categories.find(
      (c) => c.type === type && aliases.includes(c.name.trim().toLowerCase())
    );
    if (existing) return existing.id;

    const created = await addCategory({
      name:
        type === 'EXPENSE'
          ? t('goals.depositCategoryName')
          : t('goals.withdrawCategoryName'),
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
      setError(t('goals.validationMove'));
      return;
    }

    setIsSubmittingMove(true);
    setError(null);
    try {
      const txType = moveMode === 'deposit' ? 'EXPENSE' : 'INCOME';
      const categoryId = await ensureGoalCategory(txType);

      await addTransaction({
        description:
          moveMode === 'deposit'
            ? t('goals.depositTxPrefix', { name: selectedGoal.name })
            : t('goals.withdrawTxPrefix', { name: selectedGoal.name }),
        amount,
        date: getLocalDateISO(0),
        type: txType,
        category_id: categoryId,
        payment_method_id: movePaymentId || cashPaymentMethods[0]?.id || null,
        goal_id: selectedGoal.id,
        installments: 1,
      });

      setMoveMode(null);
      setMoveCents(0);
    } catch (err: any) {
      setError(err.message || t('goals.moveError'));
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
              {t('goals.title')}
            </span>
            <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
              {isNew ? t('goals.newTitle') : t('goals.editTitle')}
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
              {t('goals.nameLabel')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('goals.namePlaceholder')}
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
              {t('goals.descriptionLabel')}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('goals.descriptionPlaceholder')}
              style={{ color: currentTheme.primaryText }}
              className="w-full text-sm font-semibold bg-transparent focus:outline-none"
            />
          </div>

          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              {t('goals.targetAmountLabel')}
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
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
              {t('goals.targetDateLabel')}
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              style={{ color: currentTheme.primaryText, colorScheme: 'dark' }}
              className="w-full min-w-0 text-sm font-semibold bg-transparent focus:outline-none"
            />
          </div>

          <ColorPicker value={color} onChange={setColor} presets={COLOR_PRESETS} />

          <IconPicker value={icon} color={color} onChange={setIcon} />

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
            {isNew ? t('goals.createBtn') : t('common.saveChanges')}
          </button>

          {!isNew && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={isSaving}
              className="w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <Trash2 size={16} />
              {t('goals.deleteBtn')}
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
                  onClick={handleDeleteGoal}
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
  // SUB-TELA 2: DETALHE DA CAIXINHA
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
      <div
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
        className="p-5 max-w-md mx-auto flex flex-col gap-5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                setSelectedGoalId(null);
                setMoveMode(null);
                setError(null);
              }}
              aria-label={t('common.back')}
              style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
              className="p-2.5 rounded-xl cursor-pointer active:scale-90 transition-transform shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <span
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase tracking-widest block"
              >
                {t('goals.singular')}
              </span>
              <h2
                style={{ color: currentTheme.primaryText }}
                className="text-lg font-black uppercase truncate"
              >
                {selectedGoal.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openEdit(selectedGoal)}
            aria-label={t('goals.editAction')}
            title={t('goals.editAction')}
            style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
            className="p-2.5 rounded-xl cursor-pointer active:scale-90 transition-transform shrink-0"
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
              {t('goals.totalSaved')}
            </span>
            <div style={{ color: currentTheme.primaryText }} className="text-3xl font-black mt-0.5">
              {formatCurrency(saved, locale)}
            </div>
            <span style={{ color: currentTheme.secondaryText }} className="text-xs font-medium">
              {t('goals.ofTarget', { target: formatCurrency(target, locale), pct })}
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
            {t('goals.depositBtn')}
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
            {t('goals.withdrawBtn')}
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
              {moveMode === 'deposit' ? t('goals.depositPrompt') : t('goals.withdrawPrompt')}
            </span>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-500/20 text-red-200 text-xs font-bold">
                {error}
              </div>
            )}

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
                value={(moveCents / 100).toLocaleString(locale, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
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
                {t('common.cancel')}
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
                {t('common.confirm')}
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
            {t('goals.historyTitle')}
          </span>

          {goalHistory.length === 0 ? (
            <p style={{ color: currentTheme.secondaryText }} className="text-xs text-center py-6">
              {t('goals.historyEmpty')}
            </p>
          ) : (
            <div
              style={{ backgroundColor: currentTheme.bgCard }}
              className="rounded-2xl overflow-hidden divide-y divide-white/5"
            >
              {goalHistory.map((tx) => {
                const isDeposit = tx.type === 'EXPENSE';
                const formattedDate = tx.date.split('-').reverse().join('/');
                return (
                  <div key={tx.id} className="px-4 py-3 flex items-center justify-between gap-2">
                    <div>
                      <span
                        style={{ color: currentTheme.primaryText }}
                        className="text-xs font-bold block"
                      >
                        {isDeposit ? t('goals.historyDeposit') : t('goals.historyWithdraw')}
                      </span>
                      <span style={{ color: currentTheme.secondaryText }} className="text-[11px]">
                        {formattedDate}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-black shrink-0 ${
                        isDeposit ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isDeposit ? '+' : '-'} {formatCurrency(Number(tx.amount), locale)}
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
    <div
      style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
      className="p-5 max-w-md mx-auto flex flex-col gap-4"
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
              {t('goals.subtitle')}
            </span>
            <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
              {t('goals.title')}
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

      {goals.length === 0 ? (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-8 rounded-2xl text-center"
        >
          <p style={{ color: currentTheme.secondaryText }} className="text-xs font-medium">
            {t('goals.emptyList')}
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
                type="button"
                onClick={() => setSelectedGoalId(goal.id)}
                style={{ backgroundColor: currentTheme.bgCard }}
                className="p-4 rounded-2xl text-left flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      style={{ backgroundColor: `${goalColor}25`, color: goalColor }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    >
                      <DynamicIcon name={goal.icon} size={20} />
                    </div>
                    <div className="min-w-0">
                      <span
                        style={{ color: currentTheme.primaryText }}
                        className="text-sm font-black block truncate"
                      >
                        {goal.name}
                      </span>
                      <span
                        style={{ color: currentTheme.secondaryText }}
                        className="text-[11px] font-medium block truncate"
                      >
                        {t('goals.ofTargetShort', {
                          saved: formatCurrency(saved, locale),
                          target: formatCurrency(target, locale),
                        })}
                      </span>
                    </div>
                  </div>

                  <span style={{ color: goalColor }} className="text-xs font-black shrink-0">
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