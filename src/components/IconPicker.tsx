import { useMemo, useState } from 'react';
import { icons, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { DynamicIcon } from './DynamicIcon';

interface IconPickerProps {
  value: string;
  color: string;
  onChange: (iconName: string) => void;
}

// Todos os nomes de ícones disponíveis no lucide-react
const ALL_ICON_NAMES = Object.keys(icons) as (keyof typeof icons)[];

// Sugestões iniciais exibidas quando a busca está vazia
const POPULAR_ICONS: (keyof typeof icons)[] = [
  'Tag', 'Utensils', 'Coffee', 'ShoppingCart', 'ShoppingBag', 'Car',
  'Fuel', 'Bus', 'Plane', 'Zap', 'Wifi',
  'HeartPulse', 'Pill', 'Dumbbell', 'Film', 'Gamepad2', 'Music',
  'GraduationCap', 'Briefcase', 'Wallet', 'TrendingUp', 'Gift', 'PawPrint',
];

export function IconPicker({ value, color, onChange }: IconPickerProps) {
  const { currentTheme } = useTheme();
  const [search, setSearch] = useState('');

  const visibleIcons = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return POPULAR_ICONS;

    return ALL_ICON_NAMES.filter((name) =>
      name.toLowerCase().includes(query)
    ).slice(0, 36); // Limita a 36 por vez para não pesar no mobile
  }, [search]);

  return (
    <div style={{ backgroundColor: currentTheme.bgCard }} className="p-4 rounded-xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label
          style={{ color: currentTheme.secondaryText }}
          className="text-[10px] font-bold uppercase"
        >
          Ícone ({value || 'Tag'})
        </label>

        {/* Preview do ícone selecionado com a cor escolhida */}
        <div
          style={{ backgroundColor: `${color}25`, color }}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
        >
          <DynamicIcon name={value} size={18} />
        </div>
      </div>

      {/* Campo de busca de ícones */}
      <div
        style={{ backgroundColor: currentTheme.bgDark }}
        className="px-3 py-2 rounded-xl flex items-center gap-2"
      >
        <Search size={15} style={{ color: currentTheme.secondaryText }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ícone em inglês (ex: car, food, home)..."
          style={{ color: currentTheme.primaryText }}
          className="w-full text-xs font-medium bg-transparent focus:outline-none"
        />
      </div>

      {/* Grade de ícones */}
      {visibleIcons.length === 0 ? (
        <p style={{ color: currentTheme.secondaryText }} className="text-xs text-center py-4">
          Nenhum ícone encontrado para "{search}"
        </p>
      ) : (
        <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
          {visibleIcons.map((iconName) => {
            const isSelected = value === iconName;
            return (
              <button
                key={iconName}
                type="button"
                title={iconName}
                onClick={() => onChange(iconName)}
                style={{
                  backgroundColor: isSelected ? `${color}30` : currentTheme.bgDark,
                  borderColor: isSelected ? color : 'transparent',
                  color: isSelected ? color : currentTheme.secondaryText,
                }}
                className="aspect-square rounded-xl border-2 flex items-center justify-center cursor-pointer transition-transform active:scale-90"
              >
                <DynamicIcon name={iconName} size={18} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}