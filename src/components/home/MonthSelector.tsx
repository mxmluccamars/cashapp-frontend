import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface MonthSelectorProps {
  year: number;
  month: number; // 0 a 11
  onPrev: () => void;
  onNext: () => void;
}

export function MonthSelector({ year, month, onPrev, onNext }: MonthSelectorProps) {
  const { currentTheme } = useTheme();

  const label = new Intl.DateTimeFormat('pt-BR', {
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
        style={{ color: currentTheme.primaryText }}
        className="p-2 rounded-xl cursor-pointer active:scale-90 transition-transform"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}