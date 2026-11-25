import { useMemo, useState } from 'react';
import { icons, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { DynamicIcon } from './DynamicIcon';

interface IconPickerProps {
  value: string;
  color: string;
  onChange: (iconName: string) => void;
}

const ALL_ICON_NAMES = Object.keys(icons) as (keyof typeof icons)[];

const POPULAR_ICONS: (keyof typeof icons)[] = [
  'Tag', 'Utensils', 'Coffee', 'ShoppingCart', 'ShoppingBag', 'Car',
  'Fuel', 'Bus', 'Plane', 'Zap', 'Wifi',
  'HeartPulse', 'Pill', 'Dumbbell', 'Film', 'Gamepad2', 'Music',
  'GraduationCap', 'Briefcase', 'Wallet', 'TrendingUp', 'Gift', 'PawPrint',
];

export function IconPicker({ value, color, onChange }: IconPickerProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const visibleIcons = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return POPULAR_ICONS;

    return ALL_ICON_NAMES.filter((name) =>
      name.toLowerCase().includes(query)
    ).slice(0, 36);
  }, [search]);

  return (
    <div style={{ backgroundColor: currentTheme.bgCard }} className="p-4 rounded-xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label
          style={{ color: currentTheme.secondaryText }}
          className="text-[10px] font-bold uppercase"
        >
          {t('iconPicker.label', { name: value || 'Tag' })}
        </label>

        <div
          style={{ backgroundColor: `${color}25`, color }}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
        >
          <DynamicIcon name={value} size={18} />
        </div>
      </div>

      <div
        style={{ backgroundColor: currentTheme.bgDark }}
        className="px-3 py-2 rounded-xl flex items-center gap-2"
      >
        <Search size={15} style={{ color: currentTheme.secondaryText }} className="shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('iconPicker.searchPlaceholder')}
          style={{ color: currentTheme.primaryText }}
          className="w-full text-xs font-medium bg-transparent focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label={t('common.clearSearch')}
            style={{ color: currentTheme.secondaryText }}
            className="cursor-pointer p-0.5 shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {visibleIcons.length === 0 ? (
        <p style={{ color: currentTheme.secondaryText }} className="text-xs text-center py-4">
          {t('iconPicker.empty', { query: search })}
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