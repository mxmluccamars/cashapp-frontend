import { useTheme } from '../context/ThemeContext';
import { CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';

interface GarageProps {
  onBack: () => void;
}

export function Garage({ onBack }: GarageProps) {
  const { currentTheme, availableThemes, setTheme } = useTheme();

  return (
    <section className="space-y-6 animate-fadeIn">
      {/* Botão de retorno */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Telemetria
        </button>
        <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
          Paddock Setup
        </span>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" style={{ color: currentTheme.primary }} />
            Escolha sua Escuderia
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Personalize a identidade visual, cores e telemetria do seu cockpit financeiro.
          </p>
        </div>

        {/* Grade de Escuderias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableThemes.map((theme) => {
            const isSelected = currentTheme.id === theme.id;

            return (
              <div
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={`relative rounded-xl p-5 border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'border-white/80 bg-slate-800/80 shadow-lg scale-[1.01]'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                {/* Indicador de Seleção */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-white">{theme.name}</h3>
                    <p className="text-xs text-slate-400">{theme.subtitle}</p>
                  </div>
                  {isSelected ? (
                    <CheckCircle2
                      className="w-5 h-5"
                      style={{ color: theme.primary }}
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-700" />
                  )}
                </div>

                {/* Prévia do Logo e Amostra de Cores */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
                  {theme.logoUrl ? (
                    <img
                      src={theme.logoUrl}
                      alt={theme.name}
                      className="h-6 max-w-[90px] object-contain drop-shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">
                      {theme.name}
                    </span>
                  )}

                  {/* Amostras das cores primária e secundária */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-4 h-4 rounded-full border border-black/40 shadow-xs"
                      style={{ backgroundColor: theme.primary }}
                      title="Cor Primária"
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/40 shadow-xs"
                      style={{ backgroundColor: theme.secondary }}
                      title="Cor Secundária"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}