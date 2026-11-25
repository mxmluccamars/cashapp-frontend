import { useEffect, useState } from 'react';
import { Pipette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  presets: string[];
  label?: string;
}

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function ColorPicker({ value, onChange, presets, label }: ColorPickerProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const normalizedValue = HEX_REGEX.test(value) ? value.toUpperCase() : '#8A05BE';
  const [hexInput, setHexInput] = useState(normalizedValue);

  useEffect(() => {
    setHexInput(normalizedValue);
  }, [normalizedValue]);

  const isPreset = presets.some((p) => p.toUpperCase() === normalizedValue);

  const handleHexChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9A-Fa-f#]/g, '').toUpperCase();
    const withHash = cleaned.startsWith('#') ? cleaned : `#${cleaned.replace(/#/g, '')}`;
    const trimmed = withHash.slice(0, 7);

    setHexInput(trimmed);
    if (HEX_REGEX.test(trimmed)) {
      onChange(trimmed);
    }
  };

  const handleHexBlur = () => {
    if (!HEX_REGEX.test(hexInput)) {
      setHexInput(normalizedValue);
    }
  };

  return (
    <div style={{ backgroundColor: currentTheme.bgCard }} className="p-4 rounded-xl flex flex-col gap-3">
      <label
        style={{ color: currentTheme.secondaryText }}
        className="text-[10px] font-bold uppercase block"
      >
        {label || t('garage.colorLabel')}
      </label>

      {/* Bolinhas padrão + botão de paleta livre */}
      <div className="flex flex-wrap gap-2.5 items-center">
        {presets.map((hex) => {
          const isSelected = normalizedValue === hex.toUpperCase();
          return (
            <button
              key={hex}
              type="button"
              onClick={() => onChange(hex.toUpperCase())}
              aria-label={hex}
              style={{
                backgroundColor: hex,
                outline: isSelected ? `3px solid ${currentTheme.primaryText}` : 'none',
                outlineOffset: '2px',
              }}
              className="w-8 h-8 rounded-full cursor-pointer transition-transform active:scale-90"
            />
          );
        })}

        {/* Botão de cor livre (abre o seletor nativo arrastável no iOS e Desktop) */}
        <div
          title={t('garage.pickCustomColor')}
          style={{
            background: isPreset
              ? 'conic-gradient(from 0deg, #EF4444, #F59E0B, #10B981, #3B82F6, #8B5CF6, #EC4899, #EF4444)'
              : normalizedValue,
            outline: !isPreset ? `3px solid ${currentTheme.primaryText}` : 'none',
            outlineOffset: '2px',
          }}
          className="relative w-8 h-8 rounded-full flex items-center justify-center overflow-hidden cursor-pointer transition-transform active:scale-90"
        >
          <Pipette size={14} className="text-white drop-shadow pointer-events-none" />
          <input
            type="color"
            value={normalizedValue}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            aria-label={t('garage.pickCustomColor')}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Preview + Input HEX manual/ao vivo */}
      <div
        style={{ backgroundColor: currentTheme.bgDark }}
        className="px-3 py-2 rounded-xl flex items-center justify-between gap-2.5"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="relative w-6 h-6 rounded-lg border border-white/15 shrink-0 overflow-hidden cursor-pointer"
            style={{ backgroundColor: normalizedValue }}
          >
            <input
              type="color"
              value={normalizedValue}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
              aria-label={t('garage.pickCustomColor')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[11px] font-bold uppercase tracking-wider shrink-0"
          >
            {t('garage.customColor')}
          </span>
        </div>

        <input
          type="text"
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          onBlur={handleHexBlur}
          maxLength={7}
          spellCheck={false}
          style={{ color: currentTheme.primaryText }}
          className="w-24 text-right font-mono text-xs font-bold uppercase bg-transparent focus:outline-none"
        />
      </div>
    </div>
  );
}