import { ArrowDownLeft, ArrowUpRight, CreditCard, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { getAppLocale } from '../../i18n';
import { formatCurrency } from '../../utils/format';

interface BalanceCardProps {
  income: number;
  expense: number;
  cashExpense: number;
  creditExpense: number;
  hideValues: boolean;
}

export function BalanceCard({
  income,
  expense,
  cashExpense,
  creditExpense,
  hideValues,
}: BalanceCardProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = getAppLocale(i18n.language);

  const balance = income - expense;
  const mask = (val: number) => (hideValues ? 'R$ •••••' : formatCurrency(val, locale));

  return (
    <div
      style={{
        backgroundColor: currentTheme.bgCard,
        borderColor: currentTheme.secondary,
      }}
      className="p-5 rounded-3xl border relative overflow-hidden flex flex-col gap-4"
    >
      {/* Saldo Principal */}
      <div>
        <span
          style={{ color: currentTheme.secondaryText }}
          className="text-[10px] font-bold uppercase tracking-widest block mb-1"
        >
          {t('home.balanceTitle')}
        </span>
        <div
          style={{
            color: balance < 0 ? '#EF4444' : currentTheme.primaryText,
          }}
          className="text-3xl font-black tracking-tight"
        >
          {mask(balance)}
        </div>
      </div>

      {/* Entradas vs Saídas */}
      <div className="grid grid-cols-2 gap-3">
        <div
          style={{ backgroundColor: currentTheme.bgDark }}
          className="p-3 rounded-2xl flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <ArrowDownLeft size={16} />
          </div>
          <div className="min-w-0">
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block"
            >
              {t('home.income')}
            </span>
            <span className="text-xs font-black text-emerald-400 truncate block">
              {mask(income)}
            </span>
          </div>
        </div>

        <div
          style={{ backgroundColor: currentTheme.bgDark }}
          className="p-3 rounded-2xl flex items-center gap-2.5"
        >
          <div
            style={{
              backgroundColor: `${currentTheme.primary}20`,
              color: currentTheme.primary,
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          >
            <ArrowUpRight size={16} />
          </div>
          <div className="min-w-0">
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block"
            >
              {t('home.expenses')}
            </span>
            <span
              style={{ color: currentTheme.primaryText }}
              className="text-xs font-black truncate block"
            >
              {mask(expense)}
            </span>
          </div>
        </div>
      </div>

      {/* Divisão À Vista vs. Cartão */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Zap size={13} className="text-emerald-400 shrink-0" />
          <span style={{ color: currentTheme.secondaryText }} className="font-medium shrink-0">
            {t('home.cashLabel')}
          </span>
          <span style={{ color: currentTheme.primaryText }} className="font-bold truncate">
            {mask(cashExpense)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <CreditCard size={13} style={{ color: currentTheme.primary }} className="shrink-0" />
          <span style={{ color: currentTheme.secondaryText }} className="font-medium shrink-0">
            {t('home.cardLabel')}
          </span>
          <span style={{ color: currentTheme.primaryText }} className="font-bold truncate">
            {mask(creditExpense)}
          </span>
        </div>
      </div>
    </div>
  );
}