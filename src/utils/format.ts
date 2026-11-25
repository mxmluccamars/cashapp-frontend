export function getLocalDateISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatCurrency(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDayHeading(
  isoDate: string,
  locale: string,
  includeYear: boolean,
  todayLabel: string,
  yesterdayLabel: string
): string {
  if (isoDate === getLocalDateISO(0)) return todayLabel;
  if (isoDate === getLocalDateISO(-1)) return yesterdayLabel;

  const [y, m, d] = isoDate.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    ...(includeYear ? { year: 'numeric' } : {}),
  }).format(dateObj);
}

export function formatMonthYear(isoDate: string, locale: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
  }).format(new Date(y, m - 1, d));
}

export function normalizeIconName(iconName?: string | null, fallback = 'Wallet'): string {
  if (!iconName) return fallback;
  const legacyMap: Record<string, string> = {
    zap: 'Zap',
    banknote: 'Banknote',
    'credit-card': 'CreditCard',
    wallet: 'Wallet',
  };
  return legacyMap[iconName.toLowerCase()] || iconName;
}