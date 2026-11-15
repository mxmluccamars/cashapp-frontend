import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onOpenGarage?: () => void;
}

export function Header({ onOpenGarage }: HeaderProps) {
  const { currentTheme } = useTheme();

  // Usa a cor exclusiva do header se existir no tema, senão usa a cor padrão dos cards
  const headerBg = currentTheme.bgHeader || currentTheme.bgCard;

  return (
    <header
      style={{
        backgroundColor: headerBg,
        borderBottomColor: currentTheme.secondary,
      }}
      className="relative w-full h-[100px] border-b transition-colors duration-300 px-4"
    >
      <div className="max-w-4xl mx-auto h-full flex items-center justify-between">
        {/* Identidade da Escuderia / App */}
        <div className="flex flex-col justify-center">
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase tracking-widest"
          >
            {currentTheme.subtitle}
          </span>
          <h1
            style={{ color: currentTheme.primaryText }}
            className="text-lg font-black tracking-tight leading-tight"
          >
            {currentTheme.name}
          </h1>
        </div>

        {/* Logo com 50px (50% dos 100px do Header) */}
        <button
          onClick={onOpenGarage}
          title="Trocar Escuderia na Garage"
          className="h-[50px] flex items-center justify-center cursor-pointer transition-transform active:scale-95 focus:outline-none"
        >
          {currentTheme.logoUrl ? (
            <img
              src={currentTheme.logoUrl}
              alt={currentTheme.name}
              className="h-[50px] w-auto max-w-[140px] object-contain drop-shadow-md"
            />
          ) : (
            <div
              style={{
                backgroundColor: currentTheme.primary,
                color: currentTheme.primaryText,
              }}
              className="h-[50px] px-4 rounded-xl flex items-center justify-center font-black text-xs uppercase tracking-wider"
            >
              {currentTheme.id}
            </div>
          )}
        </button>
      </div>
    </header>
  );
}