import { ArrowLeft, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { SUPPORTED_LANGUAGES } from '../../i18n';

interface LanguageSettingsViewProps {
  onBack: () => void;
}

export function LanguageSettingsView({ onBack }: LanguageSettingsViewProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.slice(0, 2) || 'pt';

  return (
    <div className="p-5 pb-10 max-w-md mx-auto flex flex-col gap-5">
      {/* Header da Sub-tela */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('common.back')}
          style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
          className="p-2.5 rounded-xl cursor-pointer active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase tracking-widest block"
          >
            {t('garage.cockpitSetup')}
          </span>
          <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
            {t('garage.language')}
          </h2>
        </div>
      </div>

      {/* Lista de Idiomas */}
      <div className="flex flex-col gap-2.5">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = currentLang === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => i18n.changeLanguage(lang.code)}
              style={{
                backgroundColor: currentTheme.bgCard,
                borderColor: isSelected ? currentTheme.primary : 'transparent',
              }}
              className="p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <div className="text-left">
                  <span
                    style={{ color: currentTheme.primaryText }}
                    className="text-sm font-black block"
                  >
                    {lang.label}
                  </span>
                  <span
                    style={{ color: currentTheme.secondaryText }}
                    className="text-[10px] font-bold uppercase"
                  >
                    {lang.region}
                  </span>
                </div>
              </div>

              {isSelected && (
                <div
                  style={{ backgroundColor: currentTheme.primary, color: currentTheme.primaryText }}
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                >
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}