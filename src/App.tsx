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

  const handleTabChange = (nextTab: TabType) => {
    if (nextTab === 'pitstop') {
      setPreviousTab(activeTab); // Guarda onde você estava para voltar ao fechar o Pit Stop
    }
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
      {activeTab === 'home' && <HomePage onOpenGarage={() => setActiveTab('garage')} />}
      {activeTab === 'extrato' && <ExtratoPage />}
      {activeTab === 'telemetria' && <TelemetriaPage />}
      {activeTab === 'garage' && <GaragePage />}
      {activeTab === 'pitstop' && <PitStopPage onClose={() => setActiveTab(previousTab)} />}

      {/* A barra inferior aparece apenas nas 4 abas raiz */}
      {activeTab !== 'pitstop' && (
        <BottomNav activeTab={activeTab} onChangeTab={handleTabChange} />
      )}
    </div>
  );
}