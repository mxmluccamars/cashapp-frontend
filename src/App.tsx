import { useEffect, useState } from 'react';
import { useTheme } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearAuthToken,
  hasValidLocalToken,
} from './api/client';
import { PinLockScreen } from './components/PinLockScreen';
import { BottomNav, type TabType } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { ExtratoPage } from './pages/ExtratoPage';
import { TelemetriaPage } from './pages/TelemetriaPage';
import { GaragePage } from './pages/GaragePage';
import { PitStopPage } from './pages/PitStopPage';

export default function App() {
  const { currentTheme } = useTheme();

  useEffect(() => {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', currentTheme.bgDark);
    }
    document.documentElement.style.backgroundColor = currentTheme.bgDark;
    document.body.style.backgroundColor = currentTheme.bgDark;
  }, [currentTheme.bgDark]);

  
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [previousTab, setPreviousTab] = useState<TabType>('home');
  const [isSubScreenOpen, setIsSubScreenOpen] = useState(false);

  // 1. Estado de autenticação (verifica se o JWT de 7 dias ainda é válido)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    hasValidLocalToken()
  );

  // 2. Escuta quedas de sessão (401 do backend) ou bloqueio manual
  useEffect(() => {
    const handleLock = () => {
      clearAuthToken();
      setIsAuthenticated(false);
      setIsSubScreenOpen(false);
      setActiveTab('home');
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleLock);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleLock);
  }, []);

  const handleTabChange = (nextTab: TabType) => {
    if (nextTab === 'pitstop') {
      setPreviousTab(activeTab);
    }
    setIsSubScreenOpen(false);
    setActiveTab(nextTab);
  };

  // 3. Bloqueia tudo e exibe a tela de PIN se não estiver autenticado
  if (!isAuthenticated) {
    return <PinLockScreen onUnlocked={() => setIsAuthenticated(true)} />;
  }

  return (
    <DataProvider>
      <div
        style={{
          backgroundColor: currentTheme.bgDark,
          color: currentTheme.primaryText,
          minHeight: 'calc(100dvh - env(safe-area-inset-top, 0px))',
        }}
        className="min-h-screen transition-colors duration-300"
      >
        {activeTab === 'home' && (
          <HomePage
            onOpenExtrato={() => handleTabChange('extrato')}
            onSubScreenChange={setIsSubScreenOpen}
          />
        )}
        {activeTab === 'extrato' && (
          <ExtratoPage onSubScreenChange={setIsSubScreenOpen} />
        )}
        {activeTab === 'telemetria' && <TelemetriaPage />}
        {activeTab === 'garage' && (
          <GaragePage onSubScreenChange={setIsSubScreenOpen} />
        )}
        {activeTab === 'pitstop' && (
          <PitStopPage onClose={() => setActiveTab(previousTab)} />
        )}

        {/* Barra inferior aparece apenas nas 4 telas raiz (fora do Pit Stop e fora de sub-telas) */}
        {activeTab !== 'pitstop' && !isSubScreenOpen && (
          <BottomNav activeTab={activeTab} onChangeTab={handleTabChange} />
        )}
      </div>
    </DataProvider>
  );
}