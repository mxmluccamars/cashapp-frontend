import { useState } from 'react';
import { useTheme } from './context/ThemeContext';
import { BottomNav, type TabType } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { ExtratoPage } from './pages/ExtratoPage';
import { TelemetriaPage } from './pages/TelemetriaPage';
import { GaragePage } from './pages/GaragePage';
import { PitStopPage } from './pages/PitStopPage';

export default function App() {
  const { currentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [previousTab, setPreviousTab] = useState<TabType>('home');
  const [isSubScreenOpen, setIsSubScreenOpen] = useState(false);

  const handleTabChange = (nextTab: TabType) => {
    if (nextTab === 'pitstop') {
      setPreviousTab(activeTab);
    }
    setIsSubScreenOpen(false);
    setActiveTab(nextTab);
  };

  return (
    <div
      style={{
        backgroundColor: currentTheme.bgDark,
        color: currentTheme.primaryText,
      }}
      className="min-h-screen transition-colors duration-300"
    >
      {activeTab === 'home' && <HomePage onOpenGarage={() => handleTabChange('garage')} />}
      {activeTab === 'extrato' && <ExtratoPage />}
      {activeTab === 'telemetria' && <TelemetriaPage />}
      {activeTab === 'garage' && <GaragePage onSubScreenChange={setIsSubScreenOpen} />}
      {activeTab === 'pitstop' && <PitStopPage onClose={() => setActiveTab(previousTab)} />}

      {/* Barra inferior aparece apenas nas 4 telas raiz (fora do Pit Stop e fora de sub-telas) */}
      {activeTab !== 'pitstop' && !isSubScreenOpen && (
        <BottomNav activeTab={activeTab} onChangeTab={handleTabChange} />
      )}
    </div>
  );
}