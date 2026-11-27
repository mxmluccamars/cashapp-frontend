import { useMemo, useState } from 'react';
import {
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  Layers,
  Repeat,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { getAppLocale } from '../../i18n';
import { DynamicIcon } from '../../components/DynamicIcon';
import { formatCurrency } from '../../utils/format';
import {
  computeCurrentCommitment,
  computeFutureCommitments,
  computeGoalProjections,
} from '../../utils/telemetry';

interface TelemetryFutureTabProps {
  hideValues: boolean;
}

export function TelemetryFutureTab({ hideValues }: TelemetryFutureTabProps) {
  const { currentTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = getAppLocale(i18n.language);

  const { transactions, recurringBills, goals } = useData();

  const now = new Date();
  const startYear = now.getFullYear();
  const startMonth = now.getMonth();

  const [horizon, setHorizon] = useState<6 | 12>(6);
  const [includeRecurring, setIncludeRecurring] = useState(true);
  const [selectedBucketIdx, setSelectedBucketIdx] = useState(0);
  const [showRecurringDetail, setShowRecurringDetail] = useState(false);

  const future = useMemo(
    () =>
      computeFutureCommitments(
        transactions,
        recurringBills,
        locale,
        startYear,
        startMonth,
        horizon
      ),
    [transactions, recurringBills, locale, startYear, startMonth, horizon]
  );

  const commitment = useMemo(
    () =>
      computeCurrentCommitment(
        transactions,
        recurringBills,
        startYear,
        startMonth
      ),
    [transactions, recurringBills, startYear, startMonth]
  );

  const goalProjections = useMemo(
    () => computeGoalProjections(goals, transactions, startYear, startMonth),
    [goals, transactions, startYear, startMonth]
  );

  const mask = (val: number) =>
    hideValues ? 'R$ ••••' : formatCurrency(val, locale);

  const safeIdx = Math.min(selectedBucketIdx, future.buckets.length - 1);
  const activeBucket = future.buckets[safeIdx];

  const displayedGrandTotal = includeRecurring
    ? future.grandTotalCombined
    : future.grandTotalInstallments;

  const maxFutureVal = Math.max(
    1,
    ...future.buckets.map((b) =>
      includeRecurring ? b.combinedTotal : b.installmentsTotal
    )
  );

  const activeBarTotal = activeBucket
    ? includeRecurring
      ? activeBucket.combinedTotal
      : activeBucket.installmentsTotal
    : 0;

  const recurringPct =
    commitment.totalOutflow > 0
      ? Math.round((commitment.recurringTotal / commitment.totalOutflow) * 100)
      : 0;
  const installmentsPct =
    commitment.totalOutflow > 0
      ? Math.round((commitment.installmentsTotal / commitment.totalOutflow) * 100)
      : 0;
  const variablePct =
    commitment.totalOutflow > 0
      ? Math.max(0, 100 - recurringPct - installmentsPct)
      : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Projeção Empilhada: Recorrentes Ativas + Parcelas Futuras */}
      <div
        style={{ backgroundColor: currentTheme.bgCard }}
        className="p-5 rounded-3xl flex flex-col gap-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Layers size={15} style={{ color: currentTheme.primary }} />
              <h3
                style={{ color: currentTheme.primaryText }}
                className="text-xs font-black uppercase tracking-wider truncate"
              >
                {t('telemetry.future.escalatorTitle')}
              </h3>
            </div>
            <p
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-medium mt-0.5"
            >
              {t('telemetry.future.tapBarHint')}
            </p>
          </div>

          <div
            style={{ backgroundColor: currentTheme.bgDark }}
            className="p-0.5 rounded-xl flex items-center shrink-0"
          >
            {([6, 12] as const).map((h) => {
              const active = horizon === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setHorizon(h);
                    setSelectedBucketIdx(0);
                  }}
                  style={{
                    backgroundColor: active
                      ? currentTheme.primary
                      : 'transparent',
                    color: active
                      ? currentTheme.primaryText
                      : currentTheme.secondaryText,
                  }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase cursor-pointer"
                >
                  {h}m
                </button>
              );
            })}
          </div>
        </div>

        {/* Legenda + Toggle rápido de incluir/excluir Recorrentes */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase">
            <span
              style={{ color: currentTheme.primary }}
              className="flex items-center gap-1.5"
            >
              <span
                style={{ backgroundColor: currentTheme.primary }}
                className="w-2.5 h-2.5 rounded-sm inline-block"
              />
              {t('telemetry.future.installmentsLegend')}
            </span>
            {includeRecurring && (
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block" />
                {t('telemetry.future.recurringLegend')}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIncludeRecurring((v) => !v)}
            style={{
              backgroundColor: includeRecurring
                ? 'rgba(56, 189, 248, 0.16)'
                : currentTheme.bgDark,
              borderColor: includeRecurring ? '#38BDF8' : 'transparent',
              color: includeRecurring ? '#38BDF8' : currentTheme.secondaryText,
            }}
            className="px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Repeat size={11} />
            {t('telemetry.future.includeRecurringToggle')}
          </button>
        </div>

        {/* Total Projetado */}
        <div
          style={{ backgroundColor: currentTheme.bgDark }}
          className="px-4 py-3 rounded-2xl flex flex-col gap-1.5"
        >
          <div className="flex items-center justify-between">
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-wider"
            >
              {t('telemetry.future.totalScheduled', { months: horizon })}
            </span>
            <span
              style={{ color: currentTheme.primaryText }}
              className="text-base font-black"
            >
              {mask(displayedGrandTotal)}
            </span>
          </div>

          {includeRecurring && future.grandTotalRecurring > 0 && (
            <div
              style={{ color: currentTheme.secondaryText }}
              className="flex items-center justify-between text-[10px] font-semibold pt-1 border-t border-white/5"
            >
              <span>
                {t('telemetry.future.installmentsLegend')}:{' '}
                <strong style={{ color: currentTheme.primaryText }}>
                  {mask(future.grandTotalInstallments)}
                </strong>
              </span>
              <span>
                {t('telemetry.future.includeRecurringToggle')}:{' '}
                <strong className="text-sky-400">
                  {mask(future.grandTotalRecurring)}
                </strong>
              </span>
            </div>
          )}
        </div>

        {displayedGrandTotal === 0 ? (
          <p
            style={{ color: currentTheme.secondaryText }}
            className="text-xs text-center py-6"
          >
            {t('telemetry.future.noFutureInstallments')}
          </p>
        ) : (
          <>
            {/* Barras empilhadas (Recorrentes no piso + Parcelas no topo) */}
            <div
              className={`grid gap-1.5 items-end h-40 pt-3 ${
                horizon === 6 ? 'grid-cols-6' : 'grid-cols-12'
              }`}
            >
              {future.buckets.map((bucket, idx) => {
                const isSelected = idx === safeIdx;
                const barTotal = includeRecurring
                  ? bucket.combinedTotal
                  : bucket.installmentsTotal;
                const hPct =
                  barTotal > 0
                    ? Math.max(8, Math.round((barTotal / maxFutureVal) * 100))
                    : 0;
                const hasFinishing = bucket.finishingItems.length > 0;

                return (
                  <button
                    key={bucket.prefix}
                    type="button"
                    onClick={() => setSelectedBucketIdx(idx)}
                    className="h-full flex flex-col items-center justify-end gap-1 cursor-pointer"
                  >
                    <div className="w-full flex-1 flex items-end justify-center relative">
                      <div
                        style={{ height: `${hPct}%` }}
                        className="w-full max-w-[28px] relative flex flex-col transition-all duration-300"
                      >
                        {hasFinishing && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                        <div className="w-full h-full rounded-t-lg overflow-hidden flex flex-col">
                          {bucket.installmentsTotal > 0 && (
                            <div
                              style={{
                                flexGrow: bucket.installmentsTotal,
                                backgroundColor: isSelected
                                  ? currentTheme.primary
                                  : `${currentTheme.primary}75`,
                              }}
                              className="w-full transition-colors"
                            />
                          )}
                          {includeRecurring && bucket.recurringTotal > 0 && (
                            <div
                              style={{
                                flexGrow: bucket.recurringTotal,
                                backgroundColor: isSelected
                                  ? '#38BDF8'
                                  : 'rgba(56, 189, 248, 0.45)',
                              }}
                              className="w-full transition-colors"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        color: isSelected
                          ? currentTheme.primaryText
                          : currentTheme.secondaryText,
                      }}
                      className={`uppercase ${
                        horizon === 12 ? 'text-[8px]' : 'text-[10px]'
                      } ${isSelected ? 'font-black' : 'font-semibold'}`}
                    >
                      {bucket.label.slice(0, horizon === 12 ? 1 : 3)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Detalhe do mês selecionado */}
            {activeBucket && (
              <div
                style={{ backgroundColor: currentTheme.bgDark }}
                className="p-3.5 rounded-2xl flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span
                    style={{ color: currentTheme.secondaryText }}
                    className="font-bold capitalize"
                  >
                    {t('telemetry.future.commitmentsInMonth', {
                      month: activeBucket.fullLabel,
                    })}
                  </span>
                  <span
                    style={{ color: currentTheme.primaryText }}
                    className="font-black"
                  >
                    {mask(activeBarTotal)}
                  </span>
                </div>

                {/* Resumo rápido Parcelas vs Recorrentes dentro do mês */}
                {includeRecurring && (
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      style={{ backgroundColor: currentTheme.bgCard }}
                      className="px-2.5 py-1.5 rounded-xl flex items-center justify-between text-[10px]"
                    >
                      <span
                        style={{ color: currentTheme.primary }}
                        className="font-bold"
                      >
                        {t('telemetry.future.installmentsLegend')}
                      </span>
                      <span
                        style={{ color: currentTheme.primaryText }}
                        className="font-black"
                      >
                        {mask(activeBucket.installmentsTotal)}
                      </span>
                    </div>
                    <div
                      style={{ backgroundColor: currentTheme.bgCard }}
                      className="px-2.5 py-1.5 rounded-xl flex items-center justify-between text-[10px]"
                    >
                      <span className="font-bold text-sky-400">
                        {t('telemetry.future.includeRecurringToggle')}
                      </span>
                      <span
                        style={{ color: currentTheme.primaryText }}
                        className="font-black"
                      >
                        {mask(activeBucket.recurringTotal)}
                      </span>
                    </div>
                  </div>
                )}

                {activeBarTotal === 0 && (
                  <p
                    style={{ color: currentTheme.secondaryText }}
                    className="text-[11px] text-center py-1"
                  >
                    {t('telemetry.future.noCommitmentsInMonth')}
                  </p>
                )}

                {/* Lista de Parcelas do mês */}
                {activeBucket.items.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-white/5">
                    {activeBucket.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 text-[11px]"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            style={{ color: currentTheme.primaryText }}
                            className="font-semibold truncate"
                          >
                            {item.description}
                          </span>
                          <span
                            style={{
                              backgroundColor: `${currentTheme.primary}20`,
                              color: currentTheme.primary,
                            }}
                            className="text-[9px] font-black px-1.5 py-0.5 rounded shrink-0"
                          >
                            {item.installment_current}/{item.installment_total}
                          </span>
                        </div>
                        <span
                          style={{ color: currentTheme.primaryText }}
                          className="font-bold shrink-0"
                        >
                          {mask(Number(item.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bloco expansível das Recorrentes previstas no mês */}
                {includeRecurring && activeBucket.recurringItems.length > 0 && (
                  <div className="pt-1.5 border-t border-white/5 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowRecurringDetail((v) => !v)}
                      className="w-full flex items-center justify-between text-[11px] font-bold text-sky-400 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Repeat size={12} />
                        {t('telemetry.future.activeRecurringCount', {
                          count: activeBucket.recurringItems.length,
                        })}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${
                          showRecurringDetail ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showRecurringDetail && (
                      <div className="flex flex-col gap-1.5 pt-1">
                        {activeBucket.recurringItems.map(
                          ({ bill, amount, isPaid }) => (
                            <div
                              key={bill.id}
                              className="flex items-center justify-between gap-2 text-[11px]"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  style={{ color: currentTheme.primaryText }}
                                  className="font-medium truncate"
                                >
                                  {bill.name}
                                </span>
                                <span
                                  className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                                    isPaid
                                      ? 'bg-emerald-500/15 text-emerald-400'
                                      : 'bg-sky-500/15 text-sky-300'
                                  }`}
                                >
                                  {isPaid
                                    ? t('recurring.paidBadge')
                                    : t('telemetry.future.pendingBadge')}
                                </span>
                              </div>
                              <span
                                style={{ color: currentTheme.secondaryText }}
                                className="font-bold shrink-0"
                              >
                                {mask(amount)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quitações previstas no horizonte */}
            {future.finishingSoon.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <CalendarRange size={13} className="text-emerald-400" />
                  <span
                    style={{ color: currentTheme.secondaryText }}
                    className="text-[10px] font-bold uppercase tracking-wider"
                  >
                    {t('telemetry.future.finishingSoonTitle')}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {future.finishingSoon.slice(0, 4).map(({ tx, monthLabel }) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span
                        style={{ color: currentTheme.primaryText }}
                        className="font-bold truncate"
                      >
                        <span className="capitalize text-emerald-400">
                          {monthLabel}
                        </span>{' '}
                        • {tx.description}
                      </span>
                      <span className="text-[11px] font-black text-emerald-400 shrink-0">
                        {t('telemetry.future.finishingBadge', {
                          value: mask(Number(tx.amount)),
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 2. Comprometimento Fixo vs. Variável (Mês Atual) */}
      <div
        style={{ backgroundColor: currentTheme.bgCard }}
        className="p-5 rounded-3xl flex flex-col gap-4"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} style={{ color: currentTheme.primary }} />
          <h3
            style={{ color: currentTheme.primaryText }}
            className="text-xs font-black uppercase tracking-wider"
          >
            {t('telemetry.future.commitmentTitle')}
          </h3>
        </div>

        <div className="h-3 w-full rounded-full overflow-hidden flex bg-white/10">
          {recurringPct > 0 && (
            <div
              style={{ width: `${recurringPct}%` }}
              className="bg-sky-400 h-full"
            />
          )}
          {installmentsPct > 0 && (
            <div
              style={{
                width: `${installmentsPct}%`,
                backgroundColor: currentTheme.primary,
              }}
              className="h-full"
            />
          )}
          {variablePct > 0 && (
            <div
              style={{ width: `${variablePct}%` }}
              className="bg-amber-400 h-full"
            />
          )}
        </div>

        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold text-sky-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              {t('telemetry.future.fixedRecurring')}
            </span>
            <span
              style={{ color: currentTheme.primaryText }}
              className="font-black"
            >
              {mask(commitment.recurringTotal)} ({recurringPct}%)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span
              style={{ color: currentTheme.primary }}
              className="flex items-center gap-2 font-bold"
            >
              <span
                style={{ backgroundColor: currentTheme.primary }}
                className="w-2.5 h-2.5 rounded-full"
              />
              {t('telemetry.future.fixedInstallments')}
            </span>
            <span
              style={{ color: currentTheme.primaryText }}
              className="font-black"
            >
              {mask(commitment.installmentsTotal)} ({installmentsPct}%)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              {t('telemetry.future.variableSpending')}
            </span>
            <span
              style={{ color: currentTheme.primaryText }}
              className="font-black"
            >
              {mask(commitment.variableTotal)} ({variablePct}%)
            </span>
          </div>
        </div>

        {commitment.fixedPctOfIncome !== null && (
          <div
            style={{
              backgroundColor: currentTheme.bgDark,
              color: currentTheme.secondaryText,
            }}
            className="px-3 py-2 rounded-xl text-[11px] font-bold text-center"
          >
            {t('telemetry.future.fixedPctOfIncome', {
              pct: commitment.fixedPctOfIncome,
            })}
          </div>
        )}
      </div>

      {/* 3. Projeção das Caixinhas */}
      <div
        style={{ backgroundColor: currentTheme.bgCard }}
        className="p-5 rounded-3xl flex flex-col gap-3.5"
      >
        <div className="flex items-center gap-2">
          <Target size={16} className="text-purple-400" />
          <h3
            style={{ color: currentTheme.primaryText }}
            className="text-xs font-black uppercase tracking-wider"
          >
            {t('telemetry.future.goalsProjectionTitle')}
          </h3>
        </div>

        {goalProjections.length === 0 ? (
          <p
            style={{ color: currentTheme.secondaryText }}
            className="text-xs text-center py-4"
          >
            {t('telemetry.future.goalsEmpty')}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {goalProjections.map((item) => {
              const gColor = item.goal.color || '#8B5CF6';
              const isDone = item.remaining <= 0;

              return (
                <div
                  key={item.goal.id}
                  style={{ backgroundColor: currentTheme.bgDark }}
                  className="p-3.5 rounded-2xl flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        style={{ backgroundColor: `${gColor}25`, color: gColor }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      >
                        <DynamicIcon name={item.goal.icon} size={16} />
                      </div>
                      <span
                        style={{ color: currentTheme.primaryText }}
                        className="text-xs font-black truncate"
                      >
                        {item.goal.name}
                      </span>
                    </div>

                    <span
                      style={{ color: isDone ? '#10B981' : gColor }}
                      className="text-xs font-black shrink-0"
                    >
                      {item.pct}%
                    </span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.max(item.pct, 0)}%`,
                        backgroundColor: isDone ? '#10B981' : gColor,
                      }}
                      className="h-full rounded-full"
                    />
                  </div>

                  {isDone ? (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      {t('telemetry.future.goalCompleted')}
                    </span>
                  ) : (
                    <div className="flex flex-col gap-0.5 text-[11px]">
                      <span
                        style={{ color: currentTheme.primaryText }}
                        className="font-semibold"
                      >
                        {item.requiredMonthly !== null && item.monthsLeft !== null
                          ? t('telemetry.future.goalRequiredMonthly', {
                              value: mask(item.requiredMonthly),
                              months: item.monthsLeft,
                            })
                          : t('telemetry.future.goalNoDate', {
                              value: mask(item.remaining),
                            })}
                      </span>

                      <div className="flex items-center justify-between">
                        <span
                          style={{ color: currentTheme.secondaryText }}
                          className="text-[10px]"
                        >
                          {t('telemetry.future.goalAvgDeposit', {
                            value: mask(item.avgMonthlyDeposit),
                          })}
                        </span>
                        {item.onTrack !== null && (
                          <span
                            className={`text-[10px] font-black uppercase ${
                              item.onTrack ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {item.onTrack
                              ? t('telemetry.future.goalOnTrack')
                              : t('telemetry.future.goalBehind')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}