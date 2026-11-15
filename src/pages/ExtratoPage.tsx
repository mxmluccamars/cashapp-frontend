import { useTheme } from '../context/ThemeContext';

export function ExtratoPage() {
  const { currentTheme } = useTheme();
  return (
    <div className="p-6 pb-28 flex flex-col items-center justify-center min-h-[80vh]">
      <h2 style={{ color: currentTheme.primaryText }} className="text-2xl font-black uppercase">
        🏁 Extrato (Voltas)
      </h2>
    </div>
  );
}