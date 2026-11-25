import { useEffect, useState } from 'react';
import {
  ChevronRight,
  Palette,
  Globe,
  Tags,
  Compass,
  CreditCard,
  SlidersHorizontal,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { getAppLocale, SUPPORTED_LANGUAGES } from '../i18n';
import { AUTH_UNAUTHORIZED_EVENT, clearAuthToken } from '../api/client';
import { ThemeSettingsView } from './garage/ThemeSettingsView';
import { LanguageSettingsView } from './garage/LanguageSettingsView';
import { CategoriesCrudView } from './garage/CategoriesCrudView';
import { ContextsCrudView } from './garage/ContextsCrudView';
import { PaymentsCrudView } from './garage/PaymentsCrudView';

type GarageSection =
  | 'menu'
  | 'theme'
  | 'language'
  | 'categories'
  | 'contexts'
  | 'payments';



interface GaragePageProps {
  onSubScreenChange?: (isOpen: boolean) => void;
}

export function GaragePage({ onSubScreenChange }: GaragePageProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [section, setSection] = useState<GarageSection>('menu');

  useEffect(() => {
    onSubScreenChange?.(section !== 'menu');
    return () => onSubScreenChange?.(false);
  }, [section, onSubScreenChange]);

  const { syncAll, isSyncing, lastSyncedAt } = useData();
  const locale = getAppLocale(i18n.language);

  const handleSyncData = async () => {
    await syncAll();
  };

  const syncSubtitle = lastSyncedAt
    ? t('garage.syncSuccess', {
        time: lastSyncedAt.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    : t('garage.syncDataSubtitle');

  const currentLangCode = i18n.language?.slice(0, 2) || 'pt';
  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLangCode) || SUPPORTED_LANGUAGES[0];

  const handleLockApp = () => {
    clearAuthToken();
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
  };

  if (section === 'theme') {
    return <ThemeSettingsView onBack={() => setSection('menu')} />;
  }

  if (section === 'language') {
    return <LanguageSettingsView onBack={() => setSection('menu')} />;
  }

  if (section === 'categories') {
    return <CategoriesCrudView onBack={() => setSection('menu')} />;
  }

  if (section === 'contexts') {
    return <ContextsCrudView onBack={() => setSection('menu')} />;
  }

  if (section === 'payments') {
    return <PaymentsCrudView onBack={() => setSection('menu')} />;
  }

  const appearanceItems = [
    {
      id: 'theme' as GarageSection,
      label: t('garage.theme'),
      value: currentTheme.name,
      icon: Palette,
    },
    {
      id: 'language' as GarageSection,
      label: t('garage.language'),
      value: `${currentLangObj.flag} ${currentLangObj.label}`,
      icon: Globe,
    },
  ];

  const catalogItems = [
    {
      id: 'categories' as GarageSection,
      label: t('garage.categories'),
      subtitle: t('garage.categoriesSubtitle'),
      icon: Tags,
    },
    {
      id: 'contexts' as GarageSection,
      label: t('garage.contexts'),
      subtitle: t('garage.contextsSubtitle'),
      icon: Compass,
    },
    {
      id: 'payments' as GarageSection,
      label: t('garage.payments'),
      subtitle: t('garage.paymentsSubtitle'),
      icon: CreditCard,
    },
  ];

  return (
    <div className="p-5 pb-28 max-w-md mx-auto flex flex-col gap-6">
      {/* Header estilo Paddock Pass */}
      <div
        style={{
          backgroundColor: currentTheme.bgCard,
          borderColor: currentTheme.secondary,
        }}
        className="p-5 rounded-3xl border relative overflow-hidden flex items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <SlidersHorizontal size={12} style={{ color: currentTheme.primary }} />
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-widest"
            >
              {t('garage.paddockSetup')}
            </span>
          </div>
          <h1
            style={{ color: currentTheme.primaryText }}
            className="text-2xl font-black uppercase tracking-tight"
          >
            {t('garage.title')}
          </h1>
          <p
            style={{ color: currentTheme.secondaryText }}
            className="text-xs mt-1 font-medium truncate"
          >
            {currentTheme.name} • {currentLangObj.flag} {currentLangObj.locale}
          </p>
        </div>

        {currentTheme.logoUrl && (
          <img
            src={currentTheme.logoUrl}
            alt={currentTheme.name}
            className="h-12 w-auto max-w-[90px] object-contain opacity-90 shrink-0"
          />
        )}
      </div>

      {/* Grupo 1: Aparência e Sistema */}
      <div>
        <span
          style={{ color: currentTheme.secondaryText }}
          className="text-[10px] font-bold uppercase tracking-widest px-1 block mb-2"
        >
          {t('garage.appearanceSection')}
        </span>
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="rounded-2xl overflow-hidden divide-y divide-white/5"
        >
          {appearanceItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className="w-full p-4 flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    style={{
                      backgroundColor: `${currentTheme.primary}20`,
                      color: currentTheme.primary,
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <Icon size={18} />
                  </div>
                  <div className="text-left min-w-0">
                    <span
                      style={{ color: currentTheme.primaryText }}
                      className="text-sm font-bold block truncate"
                    >
                      {item.label}
                    </span>
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[11px] font-medium block truncate"
                    >
                      {item.value}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  style={{ color: currentTheme.secondaryText }}
                  className="shrink-0"
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Grupo 2: Gestão de Catálogos */}
      <div>
        <span
          style={{ color: currentTheme.secondaryText }}
          className="text-[10px] font-bold uppercase tracking-widest px-1 block mb-2"
        >
          {t('garage.catalogsSection')}
        </span>
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="rounded-2xl overflow-hidden divide-y divide-white/5"
        >
          {catalogItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className="w-full p-4 flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    style={{
                      backgroundColor: currentTheme.bgDark,
                      color: currentTheme.primaryText,
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <Icon size={18} />
                  </div>
                  <div className="text-left min-w-0">
                    <span
                      style={{ color: currentTheme.primaryText }}
                      className="text-sm font-bold block truncate"
                    >
                      {item.label}
                    </span>
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[11px] font-medium block truncate"
                    >
                      {item.subtitle}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  style={{ color: currentTheme.secondaryText }}
                  className="shrink-0"
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Grupo 3: Segurança */}
      <div>
        <span
          style={{ color: currentTheme.secondaryText }}
          className="text-[10px] font-bold uppercase tracking-widest px-1 block mb-2"
        >
          {t('garage.dataSecuritySection')}
        </span>
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="rounded-2xl overflow-hidden divide-y divide-white/5"
        >
          {/* Botão Sincronizar Dados */}
          <button
            type="button"
            onClick={handleSyncData}
            disabled={isSyncing}
            className="w-full p-4 flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity disabled:opacity-50"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                style={{
                  backgroundColor: `${currentTheme.primary}20`,
                  color: currentTheme.primary,
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              >
                <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
              </div>
              <div className="text-left min-w-0">
                <span
                  style={{ color: currentTheme.primaryText }}
                  className="text-sm font-bold block truncate"
                >
                  {isSyncing ? t('garage.syncing') : t('garage.syncData')}
                </span>
                <span
                  style={{ color: currentTheme.secondaryText }}
                  className="text-[11px] font-medium block truncate"
                >
                  {t('garage.syncDataSubtitle')}
                </span>
              </div>
            </div>
            <ChevronRight
              size={18}
              style={{ color: currentTheme.secondaryText }}
              className="shrink-0"
            />
          </button>

          {/* Botão Trancar App */}
          <button
            type="button"
            onClick={handleLockApp}
            className="w-full p-4 flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                <Lock size={18} />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-red-400 block">
                  {t('garage.lockApp')}
                </span>
                <span
                  style={{ color: currentTheme.secondaryText }}
                  className="text-[11px] font-medium block"
                >
                  {syncSubtitle}
                </span>
              </div>
            </div>
            <ChevronRight size={18} className="text-red-400/70 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}