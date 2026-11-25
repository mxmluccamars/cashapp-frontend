import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { getAppLocale } from '../../i18n';
import { formatCurrency } from '../../utils/format';
import { DynamicIcon } from '../DynamicIcon';
import type { Category, Transaction } from '../../types/finance';

interface RecentTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  hideValues: boolean;
  onViewAll: () => void;
}

export function RecentTransactions({
  transactions,
  categories,
  hideValues,
  onViewAll,
}: RecentTransactionsProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = getAppLocale(i18n.language);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const recent = transactions.slice(0, 5);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between px-1">
        <span
          style={{ color: currentTheme.secondaryText }}
          className="text-[10px] font-bold uppercase tracking-widest"
        >
          {t('home.recentTitle')}
        </span>
        <button
          type="button"
          onClick={onViewAll}
          style={{ color: currentTheme.primary }}
          className="text-[11px] font-black uppercase flex items-center gap-1 cursor-pointer"
        >
          {t('home.viewStatement')}
          <ArrowRight size={13} />
        </button>
      </div>

      {recent.length === 0 ? (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-6 rounded-2xl text-center"
        >
          <p style={{ color: currentTheme.secondaryText }} className="text-xs font-medium">
            {t('home.recentEmpty')}
          </p>
        </div>
      ) : (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="rounded-2xl overflow-hidden divide-y divide-white/5"
        >
          {recent.map((tx) => {
            const cat = categoryMap.get(tx.category_id);
            const catColor = cat?.color || '#10B981';
            const isIncome = tx.type === 'INCOME';
            const formattedDate = tx.date.split('-').reverse().slice(0, 2).join('/');

            return (
              <div
                key={tx.id}
                className="p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    style={{
                      backgroundColor: `${catColor}22`,
                      color: catColor,
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <DynamicIcon name={cat?.icon} size={17} />
                  </div>

                  <div className="min-w-0">
                    <span
                      style={{ color: currentTheme.primaryText }}
                      className="text-sm font-bold block truncate"
                    >
                      {tx.description}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        style={{ color: currentTheme.secondaryText }}
                        className="text-[11px] font-medium truncate"
                      >
                        {cat?.name || t('extrato.noCategory')} • {formattedDate}
                      </span>
                      {tx.installment_total && tx.installment_total > 1 && (
                        <span
                          style={{
                            backgroundColor: `${currentTheme.primary}20`,
                            color: currentTheme.primary,
                          }}
                          className="text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0"
                        >
                          {tx.installment_current}/{tx.installment_total}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    color: isIncome ? '#10B981' : currentTheme.primaryText,
                  }}
                  className="text-sm font-black shrink-0"
                >
                  {hideValues
                    ? '••••'
                    : `${isIncome ? '+' : '-'} ${formatCurrency(Number(tx.amount), locale)}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}