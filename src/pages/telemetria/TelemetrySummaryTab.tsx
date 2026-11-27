import { useMemo, useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  PiggyBank,
  Gauge,
  CreditCard,
  Zap,
  Flame,
  Hash,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { getAppLocale } from '../../i18n';
import { DynamicIcon } from '../../components/DynamicIcon';
import { MonthSelector } from '../../components/home/MonthSelector';
import { formatCurrency, normalizeIconName } from '../../utils/format';
import { computeMonthlySummary } from '../../utils/telemetry';

interface TelemetrySummaryTabProps {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  hideValues: boolean;
}

const DONUT_RADIUS = 64;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

export function TelemetrySummaryTab({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  hideValues,
}: TelemetrySummaryTabProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = getAppLocale(i18n.language);

  const { transactions, categories, paymentMethods, contexts } = useData();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const data = useMemo(
    () =>
      computeMonthlySummary(
        transactions,
        categories,
        paymentMethods,
        contexts,
        year,
        month,
        t('extrato.noCategory')
      ),
    [transactions, categories, paymentMethods, contexts, year, month, t]
  );

  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const mask = (val: number) =>
    hideValues ? 'R$ ••••' : formatCurrency(val, locale);

  const selectedSlice =
    data.categorySlices.find((s) => s.categoryId === activeCategoryId) || null;

  const donutSegments = useMemo(() => {
    const slices = data.categorySlices;
    const gap = slices.length > 1 ? 3 : 0;
    let offset = 0;

    return slices.map((slice) => {
      const rawLength = (slice.pct / 100) * DONUT_CIRCUMFERENCE;
      const dashLength = Math.max(rawLength - gap, 0);
      const seg = {
        ...slice,
        dashLength,
        offset,
      };
      offset += rawLength;
      return seg;
    });
  }, [data.categorySlices]);

  const cashPct =
    data.realConsumption > 0
      ? Math.round((data.cashTotal / data.realConsumption) * 100)
      : 0;
  const cardPct = data.realConsumption > 0 ? 100 - cashPct : 0;

  return (
    <div className="flex flex-col gap-4">
      <MonthSelector
        year={year}
        month={month}
        onPrev={onPrevMonth}
        onNext={onNextMonth}
      />

      {/* 1. KPIs Principais: Consumo Real + Taxa de Economia */}
      <div className="grid grid-cols-2 gap-3">
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-4 rounded-2xl flex flex-col justify-between gap-2"
        >
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            {t('telemetry.summary.realConsumption')}
          </span>
          <span
            style={{ color: currentTheme.primaryText }}
            className="text-lg font-black truncate"
          >
            {mask(data.realConsumption)}
          </span>
          {data.consumptionDeltaPct !== null ? (
            <div
              className={`flex items-center gap-1 text-[10px] font-bold ${
                data.consumptionDeltaPct <= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {data.consumptionDeltaPct <= 0 ? (
                <TrendingDown size={12} />
              ) : (
                <TrendingUp size={12} />
              )}
              <span>
                {t('telemetry.summary.vsPrevMonth', {
                  diff: `${data.consumptionDeltaPct > 0 ? '+' : ''}${data.consumptionDeltaPct}%`,
                })}
              </span>
            </div>
          ) : (
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-medium"
            >
              —
            </span>
          )}
        </div>

        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-4 rounded-2xl flex flex-col justify-between gap-2"
        >
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            {t('telemetry.summary.savingsRate')}
          </span>
          <span
            className={`text-lg font-black ${
              data.savingsRate === null
                ? 'text-slate-400'
                : data.savingsRate >= 20
                ? 'text-emerald-400'
                : data.savingsRate >= 0
                ? 'text-amber-400'
                : 'text-red-400'
            }`}
          >
            {data.savingsRate === null ? '—' : `${data.savingsRate}%`}
          </span>
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-medium truncate"
          >
            {data.savingsRate === null
              ? t('telemetry.summary.savingsRateNoIncome')
              : mask(data.netSavedTotal)}
          </span>
        </div>
      </div>

      {/* Faixa de Aportes em Metas */}
      {data.goalDeposits > 0 && (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="px-4 py-3 rounded-2xl flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <PiggyBank size={16} />
            </div>
            <span
              style={{ color: currentTheme.primaryText }}
              className="text-xs font-bold"
            >
              {t('telemetry.summary.goalDeposits')}
            </span>
          </div>
          <span className="text-sm font-black text-purple-400">
            +{mask(data.goalDeposits)}
          </span>
        </div>
      )}

      {/* 2. Rosca Interativa de Categorias */}
      <div
        style={{ backgroundColor: currentTheme.bgCard }}
        className="p-5 rounded-3xl flex flex-col gap-4"
      >
        <div>
          <h3
            style={{ color: currentTheme.primaryText }}
            className="text-xs font-black uppercase tracking-wider"
          >
            {t('telemetry.summary.categorySplitTitle')}
          </h3>
          <p
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-medium mt-0.5"
          >
            {t('telemetry.summary.categorySplitSubtitle')}
          </p>
        </div>

        {data.categorySlices.length === 0 ? (
          <p
            style={{ color: currentTheme.secondaryText }}
            className="text-xs text-center py-8"
          >
            {t('telemetry.summary.noExpenses')}
          </p>
        ) : (
          <>
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              <svg
                viewBox="0 0 160 160"
                className="w-full h-full -rotate-90 overflow-visible"
              >
                <circle
                  cx="80"
                  cy="80"
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="16"
                />
                {donutSegments.map((seg) => {
                  const isSelected = activeCategoryId === seg.categoryId;
                  const isDimmed = activeCategoryId !== null && !isSelected;

                  return (
                    <circle
                      key={seg.categoryId}
                      cx="80"
                      cy="80"
                      r={DONUT_RADIUS}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={isSelected ? 20 : 16}
                      strokeLinecap="butt"
                      strokeDasharray={`${seg.dashLength} ${DONUT_CIRCUMFERENCE - seg.dashLength}`}
                      strokeDashoffset={-seg.offset}
                      opacity={isDimmed ? 0.3 : 1}
                      className="cursor-pointer transition-all duration-200"
                      onClick={() =>
                        setActiveCategoryId((prev) =>
                          prev === seg.categoryId ? null : seg.categoryId
                        )
                      }
                    />
                  );
                })}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
                <span
                  style={{ color: currentTheme.secondaryText }}
                  className="text-[10px] font-bold uppercase tracking-wider truncate max-w-full"
                >
                  {selectedSlice
                    ? selectedSlice.name
                    : t('telemetry.summary.totalConsumed')}
                </span>
                <span
                  style={{ color: currentTheme.primaryText }}
                  className="text-base font-black mt-0.5 truncate max-w-full"
                >
                  {mask(selectedSlice ? selectedSlice.amount : data.realConsumption)}
                </span>
                {selectedSlice && (
                  <span
                    style={{ color: selectedSlice.color }}
                    className="text-[11px] font-black"
                  >
                    {Math.round(selectedSlice.pct)}%
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              {data.categorySlices.map((slice) => {
                const isSelected = activeCategoryId === slice.categoryId;
                return (
                  <button
                    key={slice.categoryId}
                    type="button"
                    onClick={() =>
                      setActiveCategoryId((prev) =>
                        prev === slice.categoryId ? null : slice.categoryId
                      )
                    }
                    style={{
                      backgroundColor: isSelected
                        ? `${slice.color}1F`
                        : currentTheme.bgDark,
                      borderColor: isSelected ? slice.color : 'transparent',
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        style={{
                          backgroundColor: `${slice.color}25`,
                          color: slice.color,
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      >
                        <DynamicIcon name={slice.icon} size={15} />
                      </div>
                      <div className="min-w-0">
                        <span
                          style={{ color: currentTheme.primaryText }}
                          className="text-xs font-bold block truncate"
                        >
                          {slice.name}
                        </span>
                        <span
                          style={{ color: currentTheme.secondaryText }}
                          className="text-[10px] font-medium"
                        >
                          {t('telemetry.summary.lapCount', { count: slice.count })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        style={{ color: currentTheme.primaryText }}
                        className="text-xs font-black block"
                      >
                        {mask(slice.amount)}
                      </span>
                      <span
                        style={{ color: slice.color }}
                        className="text-[10px] font-black"
                      >
                        {Math.round(slice.pct)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 3. Desempenho dos Tetos */}
      {data.budgetPaces.length > 0 && (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-5 rounded-3xl flex flex-col gap-3.5"
        >
          <div className="flex items-center gap-2">
            <Gauge size={16} style={{ color: currentTheme.primary }} />
            <h3
              style={{ color: currentTheme.primaryText }}
              className="text-xs font-black uppercase tracking-wider"
            >
              {t('telemetry.summary.limitsTitle')}
            </h3>
          </div>

          {data.monthElapsedPct > 0 && data.monthElapsedPct < 100 && (
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-medium -mt-2"
            >
              {t('telemetry.summary.limitsPaceHint', { pct: data.monthElapsedPct })}
            </span>
          )}

          <div className="flex flex-col gap-3">
            {data.budgetPaces.map(({ category, spent, limit, pct, status }) => {
              const barColor =
                status === 'exceeded'
                  ? '#EF4444'
                  : status === 'ahead'
                  ? '#F59E0B'
                  : '#10B981';

              const statusLabel =
                status === 'exceeded'
                  ? t('telemetry.summary.limitsExceeded')
                  : status === 'ahead'
                  ? t('telemetry.summary.limitsAhead')
                  : t('telemetry.summary.limitsOk');

              return (
                <div key={category.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span style={{ color: category.color || currentTheme.primary }}>
                        <DynamicIcon name={category.icon} size={14} />
                      </span>
                      <span
                        style={{ color: currentTheme.primaryText }}
                        className="font-bold truncate"
                      >
                        {category.name}
                      </span>
                    </div>
                    <span
                      style={{ color: barColor }}
                      className="text-[10px] font-black uppercase shrink-0"
                    >
                      {pct}% • {statusLabel}
                    </span>
                  </div>

                  <div className="relative h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: barColor,
                      }}
                      className="h-full rounded-full transition-all duration-300"
                    />
                    {data.monthElapsedPct > 0 && data.monthElapsedPct < 100 && (
                      <div
                        style={{ left: `${data.monthElapsedPct}%` }}
                        className="absolute top-0 bottom-0 w-0.5 bg-white/80"
                      />
                    )}
                  </div>

                  <div
                    style={{ color: currentTheme.secondaryText }}
                    className="flex justify-between text-[10px] font-medium"
                  >
                    <span>{mask(spent)}</span>
                    <span>{mask(limit)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Mix de Pagamento */}
      {data.realConsumption > 0 && (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-5 rounded-3xl flex flex-col gap-4"
        >
          <h3
            style={{ color: currentTheme.primaryText }}
            className="text-xs font-black uppercase tracking-wider"
          >
            {t('telemetry.summary.paymentMixTitle')}
          </h3>

          <div className="flex flex-col gap-2">
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-white/10">
              {cashPct > 0 && (
                <div
                  style={{ width: `${cashPct}%` }}
                  className="bg-emerald-400 h-full transition-all"
                />
              )}
              {cardPct > 0 && (
                <div
                  style={{
                    width: `${cardPct}%`,
                    backgroundColor: currentTheme.primary,
                  }}
                  className="h-full transition-all"
                />
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-400">
                <Zap size={12} />
                {t('telemetry.summary.cashShort')} {cashPct}%
              </span>
              <span
                style={{ color: currentTheme.primary }}
                className="flex items-center gap-1"
              >
                <CreditCard size={12} />
                {t('telemetry.summary.cardShort')} {cardPct}%
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
            {data.paymentMix.map((pm) => (
              <div
                key={pm.id}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    style={{
                      backgroundColor: `${pm.color}25`,
                      color: pm.color,
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  >
                    <DynamicIcon name={normalizeIconName(pm.icon)} size={14} />
                  </div>
                  <span
                    style={{ color: currentTheme.primaryText }}
                    className="font-bold truncate"
                  >
                    {pm.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    style={{ color: currentTheme.primaryText }}
                    className="font-black"
                  >
                    {mask(pm.amount)}
                  </span>
                  <span
                    style={{ color: currentTheme.secondaryText }}
                    className="text-[10px] font-bold w-8 text-right"
                  >
                    {pm.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {data.installmentTotal > 0 && (
            <div
              style={{
                backgroundColor: currentTheme.bgDark,
                color: currentTheme.secondaryText,
              }}
              className="px-3 py-2 rounded-xl text-[11px] font-semibold text-center"
            >
              {t('telemetry.summary.installmentShare', {
                pct: data.installmentPct,
                value: mask(data.installmentTotal),
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Gastos por Contexto no Mês */}
      {data.realConsumption > 0 && contexts.length > 0 && (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-5 rounded-3xl flex flex-col gap-3.5"
        >
          <div className="flex items-center gap-2">
            <Hash size={15} style={{ color: currentTheme.primary }} />
            <h3
              style={{ color: currentTheme.primaryText }}
              className="text-xs font-black uppercase tracking-wider"
            >
              {t('telemetry.summary.contextsTitle')}
            </h3>
          </div>

          {data.contextBreakdown.length === 0 ? (
            <p
              style={{ color: currentTheme.secondaryText }}
              className="text-xs text-center py-3"
            >
              {t('telemetry.summary.contextsEmpty')}
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {data.contextBreakdown.map((ctx) => (
                  <div key={ctx.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          style={{ color: currentTheme.primaryText }}
                          className="font-bold truncate"
                        >
                          #{ctx.name}
                        </span>
                        <span
                          style={{ color: currentTheme.secondaryText }}
                          className="text-[10px] font-medium shrink-0"
                        >
                          ({t('telemetry.summary.lapCount', { count: ctx.count })})
                        </span>
                      </div>
                      <span
                        style={{ color: currentTheme.primaryText }}
                        className="font-black shrink-0"
                      >
                        {mask(ctx.amount)}{' '}
                        <span
                          style={{ color: currentTheme.primary }}
                          className="text-[10px] font-black"
                        >
                          {ctx.pct}%
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        style={{
                          width: `${Math.max(ctx.pct, 2)}%`,
                          backgroundColor: currentTheme.primary,
                        }}
                        className="h-full rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {data.untaggedContextTotal > 0 && (
                <div
                  style={{
                    backgroundColor: currentTheme.bgDark,
                    color: currentTheme.secondaryText,
                  }}
                  className="px-3 py-2 rounded-xl text-[11px] font-medium text-center"
                >
                  {t('telemetry.summary.contextsUntagged', {
                    value: mask(data.untaggedContextTotal),
                    pct: data.untaggedContextPct,
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 6. Top 5 Maiores Lançamentos do Mês */}
      {data.topExpenses.length > 0 && (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-5 rounded-3xl flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-400" />
            <h3
              style={{ color: currentTheme.primaryText }}
              className="text-xs font-black uppercase tracking-wider"
            >
              {t('telemetry.summary.topExpensesTitle')}
            </h3>
          </div>

          <div className="flex flex-col divide-y divide-white/5">
            {data.topExpenses.map((tx, idx) => {
              const cat = catMap.get(tx.category_id);
              const dateLabel = tx.date.split('-').reverse().slice(0, 2).join('/');
              return (
                <div
                  key={tx.id}
                  className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-xs font-black w-4 shrink-0"
                    >
                      {idx + 1}.
                    </span>
                    <div className="min-w-0">
                      <span
                        style={{ color: currentTheme.primaryText }}
                        className="text-xs font-bold block truncate"
                      >
                        {tx.description}
                      </span>
                      <span
                        style={{ color: currentTheme.secondaryText }}
                        className="text-[10px] font-medium"
                      >
                        {cat?.name || t('extrato.noCategory')} • {dateLabel}
                      </span>
                    </div>
                  </div>
                  <span
                    style={{ color: currentTheme.primaryText }}
                    className="text-xs font-black shrink-0"
                  >
                    {mask(Number(tx.amount))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}