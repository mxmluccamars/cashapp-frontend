import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export interface SelectOption {
  id: string;
  name: string;
  subtitle?: string | null;
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
  placeholder = 'Pesquisar...',
  options,
  value,
  onChange,
  required = false,
}: SearchableSelectProps) {
  const { currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  // Fecha a lista ao clicar fora do componente
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtra opções pelo que o usuário digita (ignorando maiúsculas e acentos)
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
        className="flex items-center gap-2 cursor-pointer"
      >
        <Search size={15} style={{ color: currentTheme.secondaryText }} />

        <input
          type="text"
          value={isOpen ? search : selectedOption?.name || ''}
          placeholder={selectedOption ? selectedOption.name : placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          style={{ color: currentTheme.primaryText }}
          className="w-full text-sm font-semibold bg-transparent focus:outline-none placeholder:opacity-50"
        />

        {value && !required ? (
          <button
            type="button"
            onClick={handleClear}
            style={{ color: currentTheme.secondaryText }}
            className="p-0.5 hover:opacity-80"
          >
            <X size={15} />
          </button>
        ) : (
          <ChevronDown size={15} style={{ color: currentTheme.secondaryText }} />
        )}
      </div>

      {/* Lista Dropdown Filtrada */}
      {isOpen && (
        <div
          style={{
            backgroundColor: currentTheme.bgCard,
            borderColor: currentTheme.secondary,
          }}
          className="absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-2xl max-h-44 overflow-y-auto z-50 divide-y divide-white/5"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = opt.id === value;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  style={{
                    backgroundColor: isSelected ? `${currentTheme.primary}22` : 'transparent',
                    color: isSelected ? currentTheme.primary : currentTheme.primaryText,
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold flex items-center justify-between hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <span>{opt.name}</span>
                  {opt.subtitle && (
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[10px] font-medium"
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
              Nenhum resultado para "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}