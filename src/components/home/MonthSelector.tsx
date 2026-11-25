import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { getAppLocale } from '../../i18n';

interface MonthSelectorProps {
  year: number;
  month: number; // 0 a 11
  onPrev: () => void;
  onNext: () => void;
}

export function MonthSelector({ year, month, onPrev, onNext }: MonthSelectorProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = getAppLocale(i18n.language);

  const label = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month, 1));

  return (
    <div
      style={{ backgroundColor: currentTheme.bgCard }}
      className="px-2 py-1.5 rounded-2xl flex items-center justify-between"
    >
      <button
        type="button"
        onClick={onPrev}
        aria-label={t('home.prevMonth')}
        style={{ color: currentTheme.primaryText }}
        className="p-2 rounded-xl cursor-pointer active:scale-90 transition-transform"
      >
        <ChevronLeft size={18} />
      </button>

      <span
        style={{ color: currentTheme.primaryText }}
        className="text-xs font-black uppercase tracking-wider capitalize"
      >
        {label}
      </span>

      <button
        type="button"
        onClick={onNext}
        aria-label={t('home.nextMonth')}
        style={{ color: currentTheme.primaryText }}
        className="p-2 rounded-xl cursor-pointer active:scale-90 transition-transform"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}