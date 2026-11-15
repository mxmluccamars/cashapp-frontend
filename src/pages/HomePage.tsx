import { Header } from '../components/Header';
import { useTheme } from '../context/ThemeContext';

interface HomePageProps {
  onOpenGarage: () => void;
}

export function HomePage({ onOpenGarage }: HomePageProps) {
  const { currentTheme } = useTheme();

  return (
    <div className="min-h-[130vh] pb-28">
      <Header onOpenGarage={onOpenGarage} />
      <main className="p-6 flex flex-col items-center justify-center mt-10">
        <h2 style={{ color: currentTheme.primaryText }} className="text-2xl font-black uppercase">
          🏠 Home (Cockpit)
        </h2>
        <p style={{ color: currentTheme.secondaryText }} className="text-sm mt-2">
          Role a tela para baixo para ver o Header subir!
        </p>
      </main>
    </div>
  );
}