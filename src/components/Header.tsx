import { useTheme } from '../context/ThemeContext';
import { Gauge } from 'lucide-react';

interface HeaderProps {
  onOpenGarage?: () => void;
}

export function Header({ onOpenGarage }: HeaderProps) {
  const { currentTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 px-4 py-3 transition-colors duration-300">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Lado Esquerdo: Identidade do App */}
        <div className="flex items-center gap-2.5">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs"
            style={{ backgroundColor: currentTheme.primary }}
          >
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider uppercase text-white flex items-center gap-1.5">
              CashApp <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">F1</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Telemetry Cockpit</p>
          </div>
        </div>

        {/* Lado Direito: Logo Oficial da Escuderia Ativa */}
        <div 
          onClick={onOpenGarage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer hover:border-slate-700 transition"
          title="Clique para abrir a Garage e trocar de escuderia"
        >
          {currentTheme.logoUrl ? (
            <img 
              src={currentTheme.logoUrl} 
              alt={currentTheme.name}
              className="h-7 max-w-[120px] object-contain drop-shadow-sm"
              onError={(e) => {
                // Fallback caso a imagem não carregue: oculta a tag de imagem quebrada
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : null}
          <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
            {currentTheme.name}
          </span>
        </div>
      </div>
    </header>
  );
}