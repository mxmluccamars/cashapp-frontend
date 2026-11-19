import { ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { DynamicIcon } from '../DynamicIcon';
import type { Category, Transaction } from '../../types/finance';

interface RecentTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  hideValues: boolean;
  onViewAll: () => void;
}

const formatBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export function RecentTransactions({
  transactions,
  categories,
  hideValues,
  onViewAll,
}: RecentTransactionsProps) {
  const { currentTheme } = useTheme();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const recent = transactions.slice(0, 5);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between px-1">
        <span
          style={{ color: currentTheme.secondaryText }}
          className="text-[10px] font-bold uppercase tracking-widest"
        >
          Últimas Voltas
        </span>
        <button
          type="button"
          onClick={onViewAll}
          style={{ color: currentTheme.primary }}
          className="text-[11px] font-black uppercase flex items-center gap-1 cursor-pointer"
        >
          Ver extrato
          <ArrowRight size={13} />
        </button>
      </div>

      {recent.length === 0 ? (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-6 rounded-2xl text-center"
        >
          <p style={{ color: currentTheme.secondaryText }} className="text-xs font-medium">
            Nenhuma movimentação neste mês ainda.
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
                        className="text-[11px] font-medium"
                      >
                        {cat?.name || 'Sem categoria'} • {formattedDate}
                      </span>
                      {tx.installment_total && tx.installment_total > 1 && (
                        <span
                          style={{
                            backgroundColor: `${currentTheme.primary}20`,
                            color: currentTheme.primary,
                          }}
                          className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
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
                    : `${isIncome ? '+' : '-'} ${formatBRL(Number(tx.amount))}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}