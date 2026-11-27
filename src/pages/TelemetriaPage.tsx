import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { TelemetrySummaryTab } from './telemetria/TelemetrySummaryTab';
import { TelemetryEvolutionTab } from './telemetria/TelemetryEvolutionTab';
import { TelemetryFutureTab } from './telemetria/TelemetryFutureTab';

type TelemetryTab = 'summary' | 'evolution' | 'future';

const HIDE_VALUES_KEY = 'cashapp_hide_values';

export function TelemetriaPage() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { isLoadingTransactions, ensureHomeLoaded } = useData();

  const now = new Date();
  const [activeTab, setActiveTab] = useState<TelemetryTab>('summary');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [hideValues, setHideValues] = useState<boolean>(() => {
    try {
      return localStorage.getItem(HIDE_VALUES_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    ensureHomeLoaded();
  }, [ensureHomeLoaded]);

  const toggleHideValues = () => {
    setHideValues((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(HIDE_VALUES_KEY, String(next));
      } catch {
        // Ignora falha em modo privado
      }
      return next;
    });
  };

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const tabs: { id: TelemetryTab; label: string }[] = [
    { id: 'summary', label: t('telemetry.tabs.summary') },
    { id: 'evolution', label: t('telemetry.tabs.evolution') },
    { id: 'future', label: t('telemetry.tabs.future') },
  ];

  return (
    <div className="p-5 pb-28 max-w-md mx-auto flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase tracking-widest block"
          >
            {t('telemetry.subtitle')}
          </span>
          <h1
            style={{ color: currentTheme.primaryText }}
            className="text-xl font-black uppercase"
          >
            {t('telemetry.title')}
          </h1>
        </div>

        <button
          type="button"
          onClick={toggleHideValues}
          aria-label={hideValues ? t('home.showValues') : t('home.hideValues')}
          title={hideValues ? t('home.showValues') : t('home.hideValues')}
          style={{
            backgroundColor: currentTheme.bgCard,
            color: currentTheme.primaryText,
          }}
          className="p-2.5 rounded-xl cursor-pointer active:scale-90 transition-transform"
        >
          {hideValues ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Abas Internas: Resumo | Evolução | Futuro */}
      <div
        style={{ backgroundColor: currentTheme.bgCard }}
        className="p-1 rounded-2xl grid grid-cols-3 gap-1"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                backgroundColor: isActive ? currentTheme.primary : 'transparent',
                color: isActive
                  ? currentTheme.primaryText
                  : currentTheme.secondaryText,
              }}
              className="py-2 rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer transition-colors"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      {isLoadingTransactions ? (
        <div className="py-16 flex justify-center">
          <Loader2
            className="animate-spin"
            size={28}
            style={{ color: currentTheme.primary }}
          />
        </div>
      ) : activeTab === 'summary' ? (
        <TelemetrySummaryTab
          year={year}
          month={month}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          hideValues={hideValues}
        />
      ) : activeTab === 'evolution' ? (
        <TelemetryEvolutionTab hideValues={hideValues} />
      ) : (
        <TelemetryFutureTab hideValues={hideValues} />
      )}
    </div>
  );
}