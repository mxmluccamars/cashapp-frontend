import { useEffect, useRef, useState } from 'react';
import { Home, Flag, BarChart3, Settings, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

export type TabType = 'home' | 'extrato' | 'pitstop' | 'telemetria' | 'garage';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setIsVisible(true);
    lastScrollY.current = window.scrollY;
  }, [activeTab]);

  useEffect(() => {
    const HIDE_THRESHOLD = 24;
    const SHOW_THRESHOLD = 18;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

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
        paddingBottom: 'calc(0.4rem + env(safe-area-inset-bottom, 0px))',
      }}
      className={`fixed bottom-0 left-0 right-0 border-t px-2 pt-1.5 z-50 transition-all duration-300 ease-in-out ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-32 opacity-0 pointer-events-none'
      }`}
    >
      <div className="max-w-md mx-auto h-16 grid grid-cols-5 items-center">
        {navItems.map((item) => {
          if (item.isCenter) {
            return (
              <div key={item.id} className="flex flex-col items-center justify-center -mt-7">
                <button
                  type="button"
                  aria-label={item.label}
                  onClick={() => onChangeTab('pitstop')}
                  style={{
                    backgroundColor: '#111111',
                    borderColor: currentTheme.primary,
                    boxShadow: `0 6px 20px -4px ${currentTheme.primary}66`,
                  }}
                  className="w-15 h-15 rounded-full border-[5px] flex items-center justify-center transition-transform active:scale-90 cursor-pointer relative"
                >
                  <div
                    style={{ borderColor: currentTheme.secondary }}
                    className="w-10 h-10 rounded-full border border-dashed flex items-center justify-center"
                  >
                    <Plus
                      size={24}
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

          const Icon = item.icon!;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
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