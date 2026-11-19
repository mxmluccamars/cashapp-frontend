import { ArrowLeft, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeSettingsViewProps {
  onBack: () => void;
}

export function ThemeSettingsView({ onBack }: ThemeSettingsViewProps) {
  const { currentTheme, availableThemes, setTheme } = useTheme();

  return (
    <div className="p-5 pb-28 max-w-md mx-auto flex flex-col gap-5">
      {/* Header da Sub-tela */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
          className="p-2.5 rounded-xl cursor-pointer active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase tracking-widest block"
          >
            Setup do Cockpit
          </span>
          <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
            Escuderia & Tema
          </h2>
        </div>
      </div>

      {/* Lista de Escuderias */}
      <div className="flex flex-col gap-3">
        {availableThemes.map((theme) => {
          const isSelected = theme.id === currentTheme.id;
          return (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              style={{
                backgroundColor: theme.bgCard,
                borderColor: isSelected ? theme.primary : 'transparent',
              }}
              className="p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] text-left relative overflow-hidden"
            >
              {/* Barra de acento da equipe na lateral esquerda */}
              <div
                style={{ backgroundColor: theme.primary }}
                className="absolute left-0 top-0 bottom-0 w-1.5"
              />

              <div className="flex items-center gap-3.5 pl-2">
                {theme.logoUrl ? (
                  <img
                    src={theme.logoUrl}
                    alt={theme.name}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <div
                    style={{ backgroundColor: theme.primary, color: theme.primaryText }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs uppercase"
                  >
                    {theme.id.slice(0, 3)}
                  </div>
                )}

                <div>
                  <h3 style={{ color: theme.primaryText }} className="text-sm font-black">
                    {theme.name}
                  </h3>
                  <p style={{ color: theme.secondaryText }} className="text-[11px] font-medium">
                    {theme.subtitle}
                  </p>
                  {/* Paleta de preview da equipe */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                      style={{ backgroundColor: theme.bgDark }}
                      className="w-3.5 h-3.5 rounded-full border border-white/20"
                    />
                    <span
                      style={{ backgroundColor: theme.primary }}
                      className="w-3.5 h-3.5 rounded-full"
                    />
                    <span
                      style={{ backgroundColor: theme.secondary }}
                      className="w-3.5 h-3.5 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {isSelected && (
                <div
                  style={{ backgroundColor: theme.primary, color: theme.primaryText }}
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                >
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}