import { useEffect, useRef, useState } from 'react';
import { Home, Flag, BarChart3, Settings, Plus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export type TabType = 'home' | 'extrato' | 'pitstop' | 'telemetria' | 'garage';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const { currentTheme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Sempre mostra a barra ao trocar de aba
  useEffect(() => {
    setIsVisible(true);
    lastScrollY.current = window.scrollY;
  }, [activeTab]);

  useEffect(() => {
    const HIDE_THRESHOLD = 5; // Precisa rolar 60px para baixo para sumir
    const SHOW_THRESHOLD = 25; // Rola só 25px para cima e ela já volta

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Respiro no topo: nos primeiros 80px ela sempre fica visível
      if (currentScrollY <= 40) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;

      if (diff > HIDE_THRESHOLD) {
        setIsVisible(false);
        lastScrollY.current = currentScrollY;
      } else if (diff < -SHOW_THRESHOLD) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { t } = useTranslation();

  const navItems = [
    { id: 'home' as TabType, label: t('nav.home'), icon: Home },
    { id: 'extrato' as TabType, label: t('nav.extrato'), icon: Flag },
    { id: 'pitstop' as TabType, label: t('nav.pitstop'), isCenter: true },
    { id: 'telemetria' as TabType, label: t('nav.telemetria'), icon: BarChart3 },
    { id: 'garage' as TabType, label: t('nav.garage'), icon: Settings },
  ];

  return (
    <nav
      style={{
        backgroundColor: currentTheme.bgCard,
        borderTopColor: currentTheme.secondary,
        paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
      }}
      className={`fixed bottom-0 left-0 right-0 h-20 border-t px-2 z-50 transition-all duration-500 ease-in-out ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-32 opacity-0 pointer-events-none'
      }`}
    >
      <div className="max-w-md mx-auto h-full grid grid-cols-5 items-center">
        {navItems.map((item) => {
          // Botão Central: Pneu de F1 (Pit Stop)
          if (item.isCenter) {
            return (
              <div key={item.id} className="flex flex-col items-center justify-center -mt-7">
                <button
                  onClick={() => onChangeTab('pitstop')}
                  style={{
                    backgroundColor: '#111111',
                    borderColor: currentTheme.primary,
                    boxShadow: `0 6px 20px -4px ${currentTheme.primary}66`,
                  }}
                  className="w-16 h-16 rounded-full border-[5px] flex items-center justify-center transition-transform active:scale-90 cursor-pointer relative"
                >
                  <div
                    style={{ borderColor: currentTheme.secondary }}
                    className="w-11 h-11 rounded-full border border-dashed flex items-center justify-center"
                  >
                    <Plus
                      size={26}
                      style={{ color: currentTheme.primaryText }}
                      strokeWidth={3}
                    />
                  </div>
                </button>
                <span
                  style={{ color: currentTheme.secondaryText }}
                  className="text-[10px] font-bold uppercase tracking-wider mt-1"
                >
                  {item.label}
                </span>
              </div>
            );
          }

          // Abas Normais
          const Icon = item.icon!;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className="flex flex-col items-center justify-center h-full gap-1 cursor-pointer transition-opacity active:scale-95"
            >
              <Icon
                size={22}
                style={{
                  color: isActive ? currentTheme.primary : currentTheme.secondaryText,
                }}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                style={{
                  color: isActive ? currentTheme.primaryText : currentTheme.secondaryText,
                }}
                className={`text-[10px] tracking-wide ${isActive ? 'font-black' : 'font-medium'}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}