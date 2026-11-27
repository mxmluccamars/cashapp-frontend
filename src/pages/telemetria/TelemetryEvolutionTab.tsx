import { useMemo, useState } from 'react';
import { BarChart2, Hash, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { getAppLocale } from '../../i18n';
import { DynamicIcon } from '../../components/DynamicIcon';
import { formatCurrency } from '../../utils/format';
import {
  computeCategoryTrend,
  computeContextBreakdown,
  computeSixMonthEvolution,
} from '../../utils/telemetry';

interface TelemetryEvolutionTabProps {
  hideValues: boolean;
}

export function TelemetryEvolutionTab({ hideValues }: TelemetryEvolutionTabProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = getAppLocale(i18n.language);

  const { transactions, categories, contexts } = useData();

  const now = new Date();
  const anchorYear = now.getFullYear();
  const anchorMonth = now.getMonth();

  const evolution = useMemo(
    () => computeSixMonthEvolution(transactions, locale, anchorYear, anchorMonth),
    [transactions, locale, anchorYear, anchorMonth]
  );

  const [selectedIdx, setSelectedIdx] = useState(5);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'EXPENSE'),
    [categories]
  );

  const [selectedCatId, setSelectedCatId] = useState<string>(
    () => expenseCategories[0]?.id || ''
  );

  const resolvedCatId = expenseCategories.some((c) => c.id === selectedCatId)
    ? selectedCatId
    : expenseCategories[0]?.id || '';

  const selectedCat = expenseCategories.find((c) => c.id === resolvedCatId) || null;

  const categoryTrend = useMemo(
    () =>
      resolvedCatId
        ? computeCategoryTrend(
            transactions,
            resolvedCatId,
            locale,
            anchorYear,
            anchorMonth
          )
        : [],
    [transactions, resolvedCatId, locale, anchorYear, anchorMonth]
  );

  const contextBreakdown = useMemo(
    () => computeContextBreakdown(transactions, contexts, anchorYear, anchorMonth),
    [transactions, contexts, anchorYear, anchorMonth]
  );

  const mask = (val: number) =>
    hideValues ? 'R$ ••••' : formatCurrency(val, locale);

  const maxBarValue = Math.max(
    1,
    ...evolution.points.flatMap((p) => [p.income, p.expense])
  );

  const activePoint = evolution.points[selectedIdx] || evolution.points[5];

  const catMaxValue = Math.max(1, ...categoryTrend.map((p) => p.amount));
  const catTotal6m = categoryTrend.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. KPIs de Média e Comparativo */}
      <div className="grid grid-cols-2 gap-3">
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-4 rounded-2xl flex flex-col gap-1.5"
        >
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            {t('telemetry.evolution.avgMonthlyExpense')}
          </span>
          <span
            style={{ color: currentTheme.primaryText }}
            className="text-lg font-black truncate"
          >
            {mask(evolution.avgExpense)}
          </span>
        </div>

        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-4 rounded-2xl flex flex-col gap-1.5"
        >
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            {t('telemetry.evolution.currentVsAvg')}
          </span>
          {evolution.currentVsAvgPct !== null ? (
            <div
              className={`flex items-center gap-1.5 text-lg font-black ${
                evolution.currentVsAvgPct <= 0
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {evolution.currentVsAvgPct <= 0 ? (
                <TrendingDown size={18} />
              ) : (
                <TrendingUp size={18} />
              )}
              <span>
                {evolution.currentVsAvgPct > 0 ? '+' : ''}
                {evolution.currentVsAvgPct}%
              </span>
            </div>
          ) : (
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-lg font-black"
            >
              —
            </span>
          )}
        </div>
      </div>

      {/* 2. Gráfico de Barras 6 Meses (Entradas × Consumo) */}
      <div
        style={{ backgroundColor: currentTheme.bgCard }}
        className="p-5 rounded-3xl flex flex-col gap-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3
              style={{ color: currentTheme.primaryText }}
              className="text-xs font-black uppercase tracking-wider"
            >
              {t('telemetry.evolution.sixMonthsTitle')}
            </h3>
            <p
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-medium mt-0.5"
            >
              {t('telemetry.evolution.tapMonthHint')}
            </p>
          </div>
          <BarChart2 size={16} style={{ color: currentTheme.primary }} />
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
            {t('telemetry.evolution.incomeLegend')}
          </span>
          <span
            style={{ color: currentTheme.primary }}
            className="flex items-center gap-1.5"
          >
            <span
              style={{ backgroundColor: currentTheme.primary }}
              className="w-2.5 h-2.5 rounded-sm inline-block"
            />
            {t('telemetry.evolution.expenseLegend')}
          </span>
        </div>

        {/* Barras clicáveis */}
        <div className="grid grid-cols-6 gap-2 items-end h-40 pt-2">
          {evolution.points.map((point, idx) => {
            const isSelected = idx === selectedIdx;
            const incH = Math.max(
              point.income > 0 ? 6 : 0,
              Math.round((point.income / maxBarValue) * 100)
            );
            const expH = Math.max(
              point.expense > 0 ? 6 : 0,
              Math.round((point.expense / maxBarValue) * 100)
            );

            return (
              <button
                key={point.prefix}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                style={{
                  backgroundColor: isSelected
                    ? 'rgba(255,255,255,0.06)'
                    : 'transparent',
                }}
                className="h-full rounded-xl p-1 flex flex-col items-center justify-end gap-1.5 cursor-pointer transition-colors"
              >
                <div className="w-full flex-1 flex items-end justify-center gap-1">
                  <div
                    style={{ height: `${incH}%` }}
                    className="w-2.5 rounded-t-md bg-emerald-400 transition-all duration-300"
                  />
                  <div
                    style={{
                      height: `${expH}%`,
                      backgroundColor: currentTheme.primary,
                    }}
                    className="w-2.5 rounded-t-md transition-all duration-300"
                  />
                </div>
                <span
                  style={{
                    color: isSelected
                      ? currentTheme.primaryText
                      : currentTheme.secondaryText,
                  }}
                  className={`text-[10px] uppercase ${
                    isSelected ? 'font-black' : 'font-semibold'
                  }`}
                >
                  {point.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detalhe do mês selecionado */}
        {activePoint && (
          <div
            style={{ backgroundColor: currentTheme.bgDark }}
            className="p-3 rounded-2xl grid grid-cols-3 gap-2 text-center"
          >
            <div>
              <span
                style={{ color: currentTheme.secondaryText }}
                className="text-[9px] font-bold uppercase block"
              >
                {t('telemetry.evolution.incomeLegend')}
              </span>
              <span className="text-xs font-black text-emerald-400">
                {mask(activePoint.income)}
              </span>
            </div>
            <div>
              <span
                style={{ color: currentTheme.secondaryText }}
                className="text-[9px] font-bold uppercase block"
              >
                {t('telemetry.evolution.expenseLegend')}
              </span>
              <span
                style={{ color: currentTheme.primaryText }}
                className="text-xs font-black"
              >
                {mask(activePoint.expense)}
              </span>
            </div>
            <div>
              <span
                style={{ color: currentTheme.secondaryText }}
                className="text-[9px] font-bold uppercase block"
              >
                {t('telemetry.evolution.netBalance')}
              </span>
              <span
                className={`text-xs font-black ${
                  activePoint.net >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {mask(activePoint.net)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Histórico por Categoria */}
      {expenseCategories.length > 0 && (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="p-5 rounded-3xl flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h3
              style={{ color: currentTheme.primaryText }}
              className="text-xs font-black uppercase tracking-wider"
            >
              {t('telemetry.evolution.categoryTrendTitle')}
            </h3>
            {catTotal6m > 0 && (
              <span
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold"
              >
                {t('telemetry.evolution.totalSixMonths', {
                  value: mask(catTotal6m),
                })}
              </span>
            )}
          </div>

          {/* Chips de seleção rápida de categoria */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {expenseCategories.map((cat) => {
              const isSelected = cat.id === resolvedCatId;
              const c = cat.color || currentTheme.primary;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCatId(cat.id)}
                  style={{
                    backgroundColor: isSelected ? `${c}28` : currentTheme.bgDark,
                    borderColor: isSelected ? c : 'transparent',
                    color: isSelected ? c : currentTheme.secondaryText,
                  }}
                  className="px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <DynamicIcon name={cat.icon} size={13} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {catTotal6m === 0 ? (
            <p
              style={{ color: currentTheme.secondaryText }}
              className="text-xs text-center py-6"
            >
              {t('telemetry.evolution.noCategoryData')}
            </p>
          ) : (
            <div className="grid grid-cols-6 gap-2 items-end h-32 pt-2">
              {categoryTrend.map((point) => {
                const h = Math.max(
                  point.amount > 0 ? 8 : 0,
                  Math.round((point.amount / catMaxValue) * 100)
                );
                const barColor = selectedCat?.color || currentTheme.primary;

                return (
                  <div
                    key={point.prefix}
                    className="h-full flex flex-col items-center justify-end gap-1"
                  >
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[9px] font-bold truncate max-w-full"
                    >
                      {hideValues
                        ? '••'
                        : point.amount > 0
                        ? Math.round(point.amount)
                        : '0'}
                    </span>
                    <div className="w-full flex-1 flex items-end justify-center">
                      <div
                        style={{
                          height: `${h}%`,
                          backgroundColor: barColor,
                        }}
                        className="w-5 rounded-t-lg transition-all duration-300"
                      />
                    </div>
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[10px] font-bold uppercase"
                    >
                      {point.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Gastos por Contexto (6 meses) */}
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
            {t('telemetry.evolution.contextsTitle')}
          </h3>
        </div>

        {contextBreakdown.length === 0 ? (
          <p
            style={{ color: currentTheme.secondaryText }}
            className="text-xs text-center py-4"
          >
            {t('telemetry.evolution.contextsEmpty')}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {contextBreakdown.map((ctx) => (
              <div key={ctx.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span
                    style={{ color: currentTheme.primaryText }}
                    className="font-bold"
                  >
                    #{ctx.name}
                  </span>
                  <span
                    style={{ color: currentTheme.primaryText }}
                    className="font-black"
                  >
                    {mask(ctx.amount)}{' '}
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[10px] font-bold"
                    >
                      ({ctx.pct}%)
                    </span>
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    style={{
                      width: `${ctx.pct}%`,
                      backgroundColor: currentTheme.primary,
                    }}
                    className="h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}