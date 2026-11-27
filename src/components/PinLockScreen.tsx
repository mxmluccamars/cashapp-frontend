import { useCallback, useEffect, useState } from 'react';
import { Delete, Loader2, Lock, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { api, setAuthToken } from '../api/client';

interface PinLockScreenProps {
  onUnlocked: () => void;
}

const PIN_LENGTH = 6;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function PinLockScreen({ onUnlocked }: PinLockScreenProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPin = useCallback(
    async (candidate: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.login(candidate);
        setAuthToken(res.access_token);
        onUnlocked();
      } catch (err: any) {
        setError(err.message || t('auth.invalidPin'));
        setPin('');
      } finally {
        setIsLoading(false);
      }
    },
    [onUnlocked, t]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (isLoading) return;
      setError(null);
      setPin((prev) => {
        if (prev.length >= PIN_LENGTH) return prev;
        const next = prev + digit;
        if (next.length === PIN_LENGTH) {
          void submitPin(next);
        }
        return next;
      });
    },
    [isLoading, submitPin]
  );

  const handleDelete = useCallback(() => {
    if (isLoading) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  }, [isLoading]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDigit, handleDelete]);

  return (
    <div
      style={{
        backgroundColor: currentTheme.bgDark,
        minHeight: 'calc(100dvh - env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
      }}
      className="flex flex-col items-center justify-center p-6 select-none"
    >
      <div className="w-full max-w-xs flex flex-col items-center gap-8">
        <div className="flex flex-col items-center text-center gap-3">
          <div
            style={{
              backgroundColor: `${currentTheme.primary}22`,
              color: currentTheme.primary,
            }}
            className="w-16 h-16 rounded-3xl flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={28} />
            ) : (
              <Lock size={28} />
            )}
          </div>

          <div>
            <h1
              style={{ color: currentTheme.primaryText }}
              className="text-xl font-black uppercase tracking-wider"
            >
              CashApp
            </h1>
            <p
              style={{ color: currentTheme.secondaryText }}
              className="text-xs font-medium mt-1"
            >
              {isLoading ? t('auth.validating') : t('auth.enterPin')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          {Array.from({ length: PIN_LENGTH }).map((_, idx) => {
            const filled = idx < pin.length;
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: filled
                    ? currentTheme.primary
                    : currentTheme.bgCard,
                  borderColor: filled
                    ? currentTheme.primary
                    : 'rgba(255,255,255,0.12)',
                }}
                className="w-4 h-4 rounded-full border-2 transition-all duration-150"
              />
            );
          })}
        </div>

        <div className="min-h-5 flex items-center justify-center">
          {error && (
            <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
              <ShieldAlert size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3.5 w-full">
          {KEYS.map((key, idx) => {
            if (key === '') {
              return <div key={`empty-${idx}`} />;
            }

            if (key === 'del') {
              return (
                <button
                  key="del"
                  type="button"
                  disabled={isLoading || pin.length === 0}
                  onClick={handleDelete}
                  style={{
                    backgroundColor: currentTheme.bgCard,
                    color: currentTheme.secondaryText,
                  }}
                  className="h-16 rounded-2xl flex items-center justify-center cursor-pointer active:scale-90 transition-transform disabled:opacity-30"
                  aria-label={t('auth.deleteDigit')}
                >
                  <Delete size={22} />
                </button>
              );
            }

            return (
              <button
                key={key}
                type="button"
                disabled={isLoading}
                onClick={() => handleDigit(key)}
                style={{
                  backgroundColor: currentTheme.bgCard,
                  color: currentTheme.primaryText,
                }}
                className="h-16 rounded-2xl text-2xl font-black cursor-pointer active:scale-90 transition-transform disabled:opacity-50"
              >
                {key}
              </button>
            );
          })}
        </div>

        <span
          style={{ color: currentTheme.secondaryText }}
          className="text-[10px] font-semibold uppercase tracking-widest opacity-60"
        >
          {t('auth.sessionValidity')}
        </span>
      </div>
    </div>
  );
}