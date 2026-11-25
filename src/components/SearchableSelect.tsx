import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { DynamicIcon } from './DynamicIcon';

export interface SelectOption {
  id: string;
  name: string;
  subtitle?: string | null;
  icon?: string | null;
  color?: string | null;
}

interface SearchableSelectProps {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
}

export function SearchableSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  required = false,
}: SearchableSelectProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);
  const resolvedPlaceholder = placeholder || t('common.searchPlaceholder');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredOptions = options.filter((opt) =>
    normalize(opt.name).includes(normalize(search))
  );

  const handleSelect = (opt: SelectOption) => {
    onChange(opt.id);
    setSearch('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div
      ref={containerRef}
      style={{ backgroundColor: currentTheme.bgCard }}
      className="p-3 rounded-xl relative"
    >
      <label
        style={{ color: currentTheme.secondaryText }}
        className="text-[10px] font-bold uppercase block mb-1.5"
      >
        {label} {required && '*'}
      </label>

      <div
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2.5 cursor-pointer"
      >
        {/* Mostra o ícone colorido da opção selecionada quando fechado, ou lupa ao buscar */}
        {!isOpen && selectedOption?.icon ? (
          <div
            style={{
              backgroundColor: `${selectedOption.color || currentTheme.primary}25`,
              color: selectedOption.color || currentTheme.primary,
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          >
            <DynamicIcon name={selectedOption.icon} size={15} />
          </div>
        ) : (
          <Search size={15} style={{ color: currentTheme.secondaryText }} className="shrink-0" />
        )}

        <input
          type="text"
          value={isOpen ? search : selectedOption?.name || ''}
          placeholder={selectedOption ? selectedOption.name : resolvedPlaceholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          style={{ color: currentTheme.primaryText }}
          className="w-full text-sm font-semibold bg-transparent focus:outline-none placeholder:opacity-50"
        />

        {isOpen && search ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSearch('');
            }}
            aria-label={t('common.clearSearch')}
            style={{ color: currentTheme.secondaryText }}
            className="p-0.5 hover:opacity-80 cursor-pointer shrink-0"
          >
            <X size={15} />
          </button>
        ) : value && !required ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label={t('common.clearSearch')}
            style={{ color: currentTheme.secondaryText }}
            className="p-0.5 hover:opacity-80 cursor-pointer shrink-0"
          >
            <X size={15} />
          </button>
        ) : (
          <ChevronDown
            size={15}
            style={{ color: currentTheme.secondaryText }}
            className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </div>

      {/* Lista Dropdown Filtrada */}
      {isOpen && (
        <div
          style={{
            backgroundColor: currentTheme.bgCard,
            borderColor: currentTheme.secondary,
          }}
          className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-white/5"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = opt.id === value;
              const optColor = opt.color || currentTheme.primary;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  style={{
                    backgroundColor: isSelected ? `${currentTheme.primary}22` : 'transparent',
                    color: isSelected ? currentTheme.primary : currentTheme.primaryText,
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold flex items-center justify-between gap-2.5 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {opt.icon && (
                      <div
                        style={{
                          backgroundColor: `${optColor}25`,
                          color: optColor,
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      >
                        <DynamicIcon name={opt.icon} size={15} />
                      </div>
                    )}
                    <span className="truncate">{opt.name}</span>
                  </div>

                  {opt.subtitle && (
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[10px] font-medium shrink-0"
                    >
                      {opt.subtitle}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div
              style={{ color: currentTheme.secondaryText }}
              className="p-3 text-xs text-center"
            >
              {t('common.noResults', { query: search })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}