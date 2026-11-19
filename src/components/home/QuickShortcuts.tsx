import { Target, Repeat, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface QuickShortcutsProps {
  goalsCount: number;
  goalsSavedTotal: number;
  activeBillsCount: number;
  activeBillsTotal: number;
  hideValues: boolean;
  onOpenGoals: () => void;
  onOpenRecurring: () => void;
}

const formatBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

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
  const mask = (val: number) => (hideValues ? 'R$ ••••' : formatBRL(val));

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
            Caixinhas
          </span>
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[11px] font-medium block mt-0.5"
          >
            {goalsCount} {goalsCount === 1 ? 'meta' : 'metas'} • {mask(goalsSavedTotal)}
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
            Recorrentes
          </span>
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[11px] font-medium block mt-0.5"
          >
            {activeBillsCount} ativas • {mask(activeBillsTotal)}
          </span>
        </div>
      </button>
    </div>
  );
}