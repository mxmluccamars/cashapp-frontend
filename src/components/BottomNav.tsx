import { Home, Flag, BarChart3, Settings, Plus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type TabType = 'home' | 'extrato' | 'pitstop' | 'telemetria' | 'garage';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const { currentTheme } = useTheme();

  const navItems = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'extrato' as TabType, label: 'Extrato', icon: Flag },
    { id: 'pitstop' as TabType, label: 'Pit Stop', isCenter: true },
    { id: 'telemetria' as TabType, label: 'Telemetria', icon: BarChart3 },
    { id: 'garage' as TabType, label: 'Garage', icon: Settings },
  ];

  return (
    <nav
      style={{
        backgroundColor: currentTheme.bgCard,
        borderTopColor: currentTheme.secondary,
      }}
      className="fixed bottom-0 left-0 right-0 h-20 border-t px-2 z-50 transition-colors duration-300"
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
                  {/* Aro interno simulando a faixa Pirelli e roda */}
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