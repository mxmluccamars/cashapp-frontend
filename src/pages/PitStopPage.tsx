import React, { useEffect, useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { getAppLocale } from '../i18n';
import { DynamicIcon } from '../components/DynamicIcon';
import { SearchableSelect } from '../components/SearchableSelect';
import type { TransactionType } from '../types/finance';

interface PitStopPageProps {
  onClose: () => void;
}

function getLocalDateISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Mantém compatibilidade com ícones legados do seed (kebab-case -> PascalCase) */
function normalizePaymentIcon(iconName?: string | null): string {
  if (!iconName) return 'Wallet';
  const legacyMap: Record<string, string> = {
    zap: 'Zap',
    banknote: 'Banknote',
    'credit-card': 'CreditCard',
    wallet: 'Wallet',
  };
  return legacyMap[iconName.toLowerCase()] || iconName;
}

export function PitStopPage({ onClose }: PitStopPageProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = getAppLocale(i18n.language);

  const {
    categories,
    paymentMethods,
    isLoadingCatalogs,
    ensureCatalogsLoaded,
    addTransaction,
  } = useData();

  const todayISO = getLocalDateISO(0);
  const yesterdayISO = getLocalDateISO(-1);

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [cents, setCents] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => getLocalDateISO(0));
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');

  const [installmentsInput, setInstallmentsInput] = useState<string>('1');
  const [isInstallmentFocused, setIsInstallmentFocused] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureCatalogsLoaded();
  }, [ensureCatalogsLoaded]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const availablePaymentMethods = paymentMethods.filter((pm) => {
    if (type === 'INCOME') {
      return !pm.allow_installments && !pm.allows_installments;
    }
    return true;
  });

  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.some((c) => c.id === categoryId)) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [type, filteredCategories, categoryId]);

  useEffect(() => {
    if (
      availablePaymentMethods.length > 0 &&
      !availablePaymentMethods.some((pm) => pm.id === paymentMethodId)
    ) {
      setPaymentMethodId(availablePaymentMethods[0].id);
      setInstallmentsInput('1');
    }
  }, [type, availablePaymentMethods, paymentMethodId]);

  const numericAmount = cents / 100;
  const formattedAmount = numericAmount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setCents(Number(digitsOnly));
  };

  const selectedPayment = availablePaymentMethods.find((p) => p.id === paymentMethodId);
  const canInstallment = Boolean(
    selectedPayment?.allow_installments || selectedPayment?.allows_installments
  );
  const showInstallments = type === 'EXPENSE' && canInstallment;

  const installments = Math.max(1, Math.min(72, parseInt(installmentsInput, 10) || 1));
  const installmentValue = (numericAmount / installments).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const installmentDisplayValue = isInstallmentFocused
    ? installmentsInput
    : t('pitstop.installmentsDisplay', { count: installments, value: installmentValue });

  const handleInstallmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 2);
    setInstallmentsInput(digits);
  };

  const handleInstallmentBlur = () => {
    setIsInstallmentFocused(false);
    setInstallmentsInput(String(installments));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0 || !description.trim() || !categoryId || !paymentMethodId) {
      setError(t('pitstop.validationError'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await addTransaction({
        description: description.trim(),
        amount: numericAmount,
        date,
        type,
        category_id: categoryId,
        payment_method_id: paymentMethodId,
        context_id: null,
        installments: showInstallments ? installments : 1,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || t('pitstop.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{ 
        minHeight: 'calc(100dvh - env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      className="px-5 pt-4 flex flex-col max-w-md mx-auto"
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase tracking-widest block"
          >
            {t('pitstop.subtitle')}
          </span>
          <h2 style={{ color: currentTheme.primaryText }} className="text-xl font-black uppercase">
            🛞 {t('pitstop.title')}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('pitstop.close')}
          style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
          className="p-2.5 rounded-full cursor-pointer active:scale-90 transition-transform"
        >
          <X size={20} />
        </button>
      </div>

      {isLoadingCatalogs ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin" size={32} style={{ color: currentTheme.primary }} />
          <span style={{ color: currentTheme.secondaryText }} className="text-xs uppercase font-bold">
            {t('pitstop.loading')}
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500 text-red-200 text-xs font-bold">
              {error}
            </div>
          )}

          {/* 1. Chave Seletora: Saída vs Entrada */}
          <div
            style={{ backgroundColor: currentTheme.bgCard }}
            className="grid grid-cols-2 p-1 rounded-xl"
          >
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              style={{
                backgroundColor: type === 'EXPENSE' ? currentTheme.primary : 'transparent',
                color: type === 'EXPENSE' ? currentTheme.primaryText : currentTheme.secondaryText,
              }}
              className="py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              {t('pitstop.expense')}
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              style={{
                backgroundColor: type === 'INCOME' ? '#10B981' : 'transparent',
                color: type === 'INCOME' ? '#FFFFFF' : currentTheme.secondaryText,
              }}
              className="py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              {t('pitstop.income')}
            </button>
          </div>

          {/* 2. Valor com máscara da direita para a esquerda */}
          <div
            style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.secondary }}
            className="p-3.5 rounded-2xl border"
          >
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-wider block mb-0.5"
            >
              {t('pitstop.amount')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formattedAmount}
              onChange={handleAmountChange}
              style={{ color: currentTheme.primaryText }}
              className="w-full text-3xl font-black bg-transparent focus:outline-none tracking-tight"
              required
            />
          </div>

          {/* 3. Descrição */}
          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3 rounded-xl">
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              {t('pitstop.description')} *
            </label>
            <input
              type="text"
              placeholder={
                type === 'EXPENSE'
                  ? t('pitstop.descriptionExpensePlaceholder')
                  : t('pitstop.descriptionIncomePlaceholder')
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ color: currentTheme.primaryText }}
              className="w-full text-sm font-semibold bg-transparent focus:outline-none"
              required
            />
          </div>

          {/* 4. Data em largura total + atalhos rápidos Hoje / Ontem */}
          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3 rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <label
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase"
              >
                {t('pitstop.date')} *
              </label>
              <div className="flex items-center gap-1.5">
                {[
                  { label: t('common.today'), value: todayISO },
                  { label: t('common.yesterday'), value: yesterdayISO },
                ].map((chip) => {
                  const isActive = date === chip.value;
                  return (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => setDate(chip.value)}
                      style={{
                        backgroundColor: isActive ? `${currentTheme.primary}25` : currentTheme.bgDark,
                        color: isActive ? currentTheme.primary : currentTheme.secondaryText,
                      }}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase cursor-pointer transition-colors"
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ color: currentTheme.primaryText, colorScheme: 'dark' }}
              className="w-full min-w-0 text-sm font-semibold bg-transparent focus:outline-none"
              required
            />
          </div>

          {/* 5. Categoria em largura total (com ícone e cor no campo e no dropdown) */}
          <SearchableSelect
            label={t('pitstop.category')}
            placeholder={t('pitstop.categoryPlaceholder')}
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

          {/* 6. Forma de Pagamento / Recebimento */}
          <div>
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1.5 px-1"
            >
              {type === 'EXPENSE'
                ? `${t('pitstop.paymentExpense')} *`
                : `${t('pitstop.paymentIncome')} *`}
            </label>
            <div
              className={`grid gap-2 ${
                availablePaymentMethods.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
              }`}
            >
              {availablePaymentMethods.map((pm) => {
                const isSelected = paymentMethodId === pm.id;
                const activeBg = type === 'INCOME' ? '#10B981' : currentTheme.primary;
                const activeText = type === 'INCOME' ? '#FFFFFF' : currentTheme.primaryText;
                const iconColor = isSelected
                  ? activeText
                  : pm.color || currentTheme.secondaryText;

                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethodId(pm.id);
                      setInstallmentsInput('1');
                    }}
                    style={{
                      backgroundColor: isSelected ? activeBg : currentTheme.bgCard,
                      borderColor: isSelected ? activeBg : 'transparent',
                      color: isSelected ? activeText : currentTheme.secondaryText,
                    }}
                    className="p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                  >
                    <span style={{ color: iconColor }}>
                      <DynamicIcon name={normalizePaymentIcon(pm.icon)} size={18} />
                    </span>
                    <span className="text-[11px] font-bold text-center leading-tight line-clamp-1">
                      {pm.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Número de Parcelas (apenas para Despesa em método parcelável) */}
          {showInstallments && (
            <div
              style={{
                backgroundColor: currentTheme.bgCard,
                borderColor: currentTheme.primary,
              }}
              className="p-3 rounded-xl border transition-all"
            >
              <label
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase block mb-1"
              >
                💳 {t('pitstop.installments')}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={installmentDisplayValue}
                onFocus={() => setIsInstallmentFocused(true)}
                onBlur={handleInstallmentBlur}
                onChange={handleInstallmentChange}
                placeholder={t('pitstop.installmentsPlaceholder')}
                style={{ color: currentTheme.primaryText }}
                className="w-full text-sm font-black bg-transparent focus:outline-none"
              />
            </div>
          )}

          {/* Botão de Confirmação (colado no fluxo, sem buraco vazio nem corte no iOS) */}
          <div className="mt-auto pt-3 w-full">
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: type === 'INCOME' ? '#10B981' : currentTheme.primary,
                color: type === 'INCOME' ? '#FFFFFF' : currentTheme.primaryText,
              }}
              className="w-full py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Check size={20} strokeWidth={3} />
                  {type === 'EXPENSE' ? t('pitstop.confirmExpense') : t('pitstop.confirmIncome')}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}