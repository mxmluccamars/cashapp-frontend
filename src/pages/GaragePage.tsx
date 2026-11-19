import { useState } from 'react';
import {
  ChevronRight,
  Palette,
  Globe,
  Tags,
  Compass,
  MapPin,
  CreditCard,
  SlidersHorizontal,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { ThemeSettingsView } from './garage/ThemeSettingsView';
import { LanguageSettingsView } from './garage/LanguageSettingsView';
import { CategoriesCrudView } from './garage/CategoriesCrudView';

type GarageSection =
  | 'menu'
  | 'theme'
  | 'language'
  | 'categories'
  | 'contexts'
  | 'locations'
  | 'payments';

export function GaragePage() {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [section, setSection] = useState<GarageSection>('menu');

  const currentLangCode = i18n.language?.slice(0, 2) || 'pt';
  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLangCode) || SUPPORTED_LANGUAGES[0];

  // Roteamento interno das sub-telas da Garage
  if (section === 'theme') {
    return <ThemeSettingsView onBack={() => setSection('menu')} />;
  }

  if (section === 'language') {
    return <LanguageSettingsView onBack={() => setSection('menu')} />;
  }

  if (section === 'categories') {
    return <CategoriesCrudView onBack={() => setSection('menu')} />;
  }

  // Placeholder temporário para os 4 CRUDs que vamos montar na sequência
  if (section !== 'menu') {
    return (
      <div className="p-5 pb-28 max-w-md mx-auto">
        <button
          onClick={() => setSection('menu')}
          style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
          className="px-4 py-2 rounded-xl text-xs font-bold mb-6 cursor-pointer"
        >
          ← Voltar para Garage
        </button>
        <h2 style={{ color: currentTheme.primaryText }} className="text-xl font-black uppercase">
          Em construção: {section}
        </h2>
      </div>
    );
  }

  const appearanceItems = [
    {
      id: 'theme' as GarageSection,
      label: 'Escuderia & Tema',
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
      label: 'Categorias',
      subtitle: 'Despesas, receitas e limites mensais',
      icon: Tags,
    },
    {
      id: 'contexts' as GarageSection,
      label: 'Contextos',
      subtitle: 'Dia a dia, Trabalho, Igreja...',
      icon: Compass,
    },
    {
      id: 'locations' as GarageSection,
      label: 'Locais / Lugares',
      subtitle: 'Estabelecimentos e cidades',
      icon: MapPin,
    },
    {
      id: 'payments' as GarageSection,
      label: 'Formas de Pagamento',
      subtitle: 'Pix, Dinheiro, Cartão e parcelamento',
      icon: CreditCard,
    },
  ];

  return (
    <div className="p-5 pb-28 max-w-md mx-auto flex flex-col gap-6">
      {/* Header estilizado estilo Box / Paddock Pass */}
      <div
        style={{
          backgroundColor: currentTheme.bgCard,
          borderColor: currentTheme.secondary,
        }}
        className="p-5 rounded-3xl border relative overflow-hidden flex items-center justify-between"
      >
        {/* Faixa de corrida no topo */}
        <div
          style={{ backgroundColor: currentTheme.primary }}
          className="absolute top-0 left-0 right-0 h-1"
        />

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <SlidersHorizontal size={12} style={{ color: currentTheme.primary }} />
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-widest"
            >
              Paddock Setup
            </span>
          </div>
          <h1
            style={{ color: currentTheme.primaryText }}
            className="text-2xl font-black uppercase tracking-tight"
          >
            {t('garage.title')}
          </h1>
          <p style={{ color: currentTheme.secondaryText }} className="text-xs mt-1 font-medium">
            {currentTheme.name} • {currentLangObj.flag} {currentLangObj.code.toUpperCase()}
          </p>
        </div>

        {currentTheme.logoUrl && (
          <img
            src={currentTheme.logoUrl}
            alt={currentTheme.name}
            className="h-12 w-auto max-w-[90px] object-contain opacity-90"
          />
        )}
      </div>

      {/* Grupo 1: Aparência e Sistema */}
      <div>
        <span
          style={{ color: currentTheme.secondaryText }}
          className="text-[10px] font-bold uppercase tracking-widest px-1 block mb-2"
        >
          Cockpit & Preferências
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
                onClick={() => setSection(item.id)}
                className="w-full p-4 flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    style={{
                      backgroundColor: `${currentTheme.primary}20`,
                      color: currentTheme.primary,
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                  >
                    <Icon size={18} />
                  </div>
                  <div className="text-left">
                    <span
                      style={{ color: currentTheme.primaryText }}
                      className="text-sm font-bold block"
                    >
                      {item.label}
                    </span>
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[11px] font-medium"
                    >
                      {item.value}
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: currentTheme.secondaryText }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Grupo 2: Gestão de Catálogos (CRUDs) */}
      <div>
        <span
          style={{ color: currentTheme.secondaryText }}
          className="text-[10px] font-bold uppercase tracking-widest px-1 block mb-2"
        >
          Gerenciar Cadastros
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
                onClick={() => setSection(item.id)}
                className="w-full p-4 flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    style={{
                      backgroundColor: currentTheme.bgDark,
                      color: currentTheme.primaryText,
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                  >
                    <Icon size={18} />
                  </div>
                  <div className="text-left">
                    <span
                      style={{ color: currentTheme.primaryText }}
                      className="text-sm font-bold block"
                    >
                      {item.label}
                    </span>
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[11px] font-medium"
                    >
                      {item.subtitle}
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: currentTheme.secondaryText }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}