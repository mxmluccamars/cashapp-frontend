import { Target, Repeat, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { getAppLocale } from '../../i18n';
import { formatCurrency } from '../../utils/format';

interface QuickShortcutsProps {
  goalsCount: number;
  goalsSavedTotal: number;
  activeBillsCount: number;
  activeBillsTotal: number;
  hideValues: boolean;
  onOpenGoals: () => void;
  onOpenRecurring: () => void;
}

export function QuickShortcuts({
  goalsCount,
  goalsSavedTotal,
  activeBillsCount,
  activeBillsTotal,
  hideValues,
  onOpenGoals,
  onOpenRecurring,
}: QuickShortcutsProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = getAppLocale(i18n.language);

  const mask = (val: number) => (hideValues ? 'R$ ••••' : formatCurrency(val, locale));

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Card Caixinhas */}
      <button
        type="button"
        onClick={onOpenGoals}
        style={{ backgroundColor: currentTheme.bgCard }}
        className="p-4 rounded-2xl text-left flex flex-col justify-between gap-3 cursor-pointer active:scale-[0.97] transition-transform"
      >
        <div className="flex items-center justify-between w-full">
          <div
            style={{
              backgroundColor: `${currentTheme.primary}20`,
              color: currentTheme.primary,
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
          >
            <Target size={18} />
          </div>
          <ChevronRight size={16} style={{ color: currentTheme.secondaryText }} />
        </div>

        <div>
          <span
            style={{ color: currentTheme.primaryText }}
            className="text-xs font-black uppercase block"
          >
            {t('home.goals')}
          </span>
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[11px] font-medium block mt-0.5 truncate"
          >
            {goalsCount}{' '}
            {goalsCount === 1 ? t('home.goalSingular') : t('home.goalPlural')} •{' '}
            {mask(goalsSavedTotal)}
          </span>
        </div>
      </button>

      {/* Card Contas Mensais */}
      <button
        type="button"
        onClick={onOpenRecurring}
        style={{ backgroundColor: currentTheme.bgCard }}
        className="p-4 rounded-2xl text-left flex flex-col justify-between gap-3 cursor-pointer active:scale-[0.97] transition-transform"
      >
        <div className="flex items-center justify-between w-full">
          <div
            style={{
              backgroundColor: currentTheme.bgDark,
              color: currentTheme.primaryText,
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
          >
            <Repeat size={18} />
          </div>
          <ChevronRight size={16} style={{ color: currentTheme.secondaryText }} />
        </div>

        <div>
          <span
            style={{ color: currentTheme.primaryText }}
            className="text-xs font-black uppercase block"
          >
            {t('home.recurring')}
          </span>
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[11px] font-medium block mt-0.5 truncate"
          >
            {activeBillsCount}{' '}
            {activeBillsCount === 1
              ? t('home.activeSingular')
              : t('home.activePlural')}{' '}
            • {mask(activeBillsTotal)}
          </span>
        </div>
      </button>
    </div>
  );
}