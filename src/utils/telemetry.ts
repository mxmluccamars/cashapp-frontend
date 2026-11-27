import type {
  Category,
  ContextItem,
  Goal,
  PaymentMethod,
  RecurringBill,
  Transaction,
} from '../types/finance';

export function getMonthPrefix(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function shiftYearMonth(
  year: number,
  month: number,
  deltaMonths: number
): { year: number; month: number; prefix: string } {
  const d = new Date(year, month + deltaMonths, 1);
  const y = d.getFullYear();
  const m = d.getMonth();
  return { year: y, month: m, prefix: getMonthPrefix(y, m) };
}

export function formatShortMonthLabel(
  year: number,
  month: number,
  locale: string,
  includeYear = false
): string {
  const raw = new Intl.DateTimeFormat(locale, {
    month: 'short',
    ...(includeYear ? { year: '2-digit' } : {}),
  }).format(new Date(year, month, 1));
  return raw.replace('.', '');
}

/** Percentual já decorrido do mês selecionado (0% futuro, 100% passado, dia/total atual) */
export function getMonthElapsedPct(year: number, month: number): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 100;
  }
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    return 0;
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Math.min(100, Math.round((now.getDate() / daysInMonth) * 100));
}

export interface CategorySlice {
  categoryId: string;
  name: string;
  color: string;
  icon?: string | null;
  amount: number;
  pct: number;
  count: number;
}

export interface BudgetPaceItem {
  category: Category;
  spent: number;
  limit: number;
  pct: number;
  status: 'ok' | 'ahead' | 'exceeded';
}

export interface PaymentMixItem {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  amount: number;
  pct: number;
  isCredit: boolean;
}

export interface ContextBreakdownItem {
  id: string;
  name: string;
  amount: number;
  pct: number;
  count: number;
}

export interface MonthlySummaryData {
  realIncome: number;
  realConsumption: number;
  goalDeposits: number;
  netSavedTotal: number;
  savingsRate: number | null;
  prevConsumption: number;
  consumptionDeltaPct: number | null;
  categorySlices: CategorySlice[];
  budgetPaces: BudgetPaceItem[];
  monthElapsedPct: number;
  paymentMix: PaymentMixItem[];
  cashTotal: number;
  cardTotal: number;
  installmentTotal: number;
  installmentPct: number;
  contextBreakdown: ContextBreakdownItem[];
  untaggedContextTotal: number;
  untaggedContextPct: number;
  topExpenses: Transaction[];
}

export function computeMonthlySummary(
  transactions: Transaction[],
  categories: Category[],
  paymentMethods: PaymentMethod[],
  contexts: ContextItem[],
  year: number,
  month: number,
  uncategorizedLabel: string
): MonthlySummaryData {
  const prefix = getMonthPrefix(year, month);
  const prevPrefix = shiftYearMonth(year, month, -1).prefix;
  const monthElapsedPct = getMonthElapsedPct(year, month);

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const pmMap = new Map(paymentMethods.map((pm) => [pm.id, pm]));
  const ctxMap = new Map(contexts.map((ctx) => [ctx.id, ctx.name]));
  const creditIds = new Set(
    paymentMethods
      .filter((pm) => Boolean(pm.allow_installments || pm.allows_installments))
      .map((pm) => pm.id)
  );

  const monthTxs = transactions.filter((tx) => tx.date.startsWith(prefix));
  const prevConsumption = transactions
    .filter(
      (tx) => tx.date.startsWith(prevPrefix) && tx.type === 'EXPENSE' && !tx.goal_id
    )
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  let realIncome = 0;
  let realConsumption = 0;
  let goalDeposits = 0;
  let cashTotal = 0;
  let cardTotal = 0;
  let installmentTotal = 0;
  let untaggedContextTotal = 0;

  const catAgg = new Map<string, { amount: number; count: number }>();
  const pmAgg = new Map<string, number>();
  const ctxAgg = new Map<string, { amount: number; count: number }>();

  for (const tx of monthTxs) {
    const val = Number(tx.amount);
    if (tx.type === 'INCOME') {
      if (!tx.goal_id) realIncome += val;
      continue;
    }

    if (tx.goal_id) {
      goalDeposits += val;
      continue;
    }

    realConsumption += val;

    const currentCat = catAgg.get(tx.category_id) || { amount: 0, count: 0 };
    currentCat.amount += val;
    currentCat.count += 1;
    catAgg.set(tx.category_id, currentCat);

    const pmKey = tx.payment_method_id || '__none__';
    pmAgg.set(pmKey, (pmAgg.get(pmKey) || 0) + val);

    if (tx.context_id) {
      const currentCtx = ctxAgg.get(tx.context_id) || { amount: 0, count: 0 };
      currentCtx.amount += val;
      currentCtx.count += 1;
      ctxAgg.set(tx.context_id, currentCtx);
    } else {
      untaggedContextTotal += val;
    }

    if (tx.payment_method_id && creditIds.has(tx.payment_method_id)) {
      cardTotal += val;
    } else {
      cashTotal += val;
    }

    if (tx.installment_total && tx.installment_total > 1) {
      installmentTotal += val;
    }
  }

  const netSavedTotal = realIncome - realConsumption;
  const savingsRate =
    realIncome > 0 ? Math.round((netSavedTotal / realIncome) * 100) : null;

  const consumptionDeltaPct =
    prevConsumption > 0
      ? Math.round(((realConsumption - prevConsumption) / prevConsumption) * 100)
      : null;

  const categorySlices: CategorySlice[] = Array.from(catAgg.entries())
    .map(([categoryId, data]) => {
      const cat = catMap.get(categoryId);
      return {
        categoryId,
        name: cat?.name || uncategorizedLabel,
        color: cat?.color || '#64748B',
        icon: cat?.icon,
        amount: data.amount,
        pct: realConsumption > 0 ? (data.amount / realConsumption) * 100 : 0,
        count: data.count,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const budgetPaces: BudgetPaceItem[] = categories
    .filter(
      (c) => c.type === 'EXPENSE' && c.monthly_limit && Number(c.monthly_limit) > 0
    )
    .map((category) => {
      const spent = catAgg.get(category.id)?.amount || 0;
      const limit = Number(category.monthly_limit);
      const pct = Math.round((spent / limit) * 100);
      let status: 'ok' | 'ahead' | 'exceeded' = 'ok';
      if (pct >= 100) status = 'exceeded';
      else if (monthElapsedPct > 0 && pct > monthElapsedPct + 10) status = 'ahead';
      return { category, spent, limit, pct, status };
    })
    .sort((a, b) => b.pct - a.pct);

  const paymentMix: PaymentMixItem[] = Array.from(pmAgg.entries())
    .map(([pmId, amount]) => {
      const pm = pmId !== '__none__' ? pmMap.get(pmId) : null;
      return {
        id: pmId,
        name: pm?.name || uncategorizedLabel,
        color: pm?.color || '#64748B',
        icon: pm?.icon,
        amount,
        pct: realConsumption > 0 ? Math.round((amount / realConsumption) * 100) : 0,
        isCredit: pmId !== '__none__' && creditIds.has(pmId),
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const contextBreakdown: ContextBreakdownItem[] = Array.from(ctxAgg.entries())
    .map(([id, data]) => ({
      id,
      name: ctxMap.get(id) || 'Context',
      amount: data.amount,
      pct: realConsumption > 0 ? Math.round((data.amount / realConsumption) * 100) : 0,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  const untaggedContextPct =
    realConsumption > 0
      ? Math.round((untaggedContextTotal / realConsumption) * 100)
      : 0;

  const installmentPct =
    realConsumption > 0 ? Math.round((installmentTotal / realConsumption) * 100) : 0;

  const topExpenses = monthTxs
    .filter((tx) => tx.type === 'EXPENSE' && !tx.goal_id)
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5);

  return {
    realIncome,
    realConsumption,
    goalDeposits,
    netSavedTotal,
    savingsRate,
    prevConsumption,
    consumptionDeltaPct,
    categorySlices,
    budgetPaces,
    monthElapsedPct,
    paymentMix,
    cashTotal,
    cardTotal,
    installmentTotal,
    installmentPct,
    contextBreakdown,
    untaggedContextTotal,
    untaggedContextPct,
    topExpenses,
  };
}

export interface MonthlyTrendPoint {
  year: number;
  month: number;
  prefix: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export function computeSixMonthEvolution(
  transactions: Transaction[],
  locale: string,
  anchorYear: number,
  anchorMonth: number
): {
  points: MonthlyTrendPoint[];
  avgExpense: number;
  currentVsAvgPct: number | null;
} {
  const points: MonthlyTrendPoint[] = [];

  for (let offset = -5; offset <= 0; offset++) {
    const { year, month, prefix } = shiftYearMonth(anchorYear, anchorMonth, offset);
    let income = 0;
    let expense = 0;

    for (const tx of transactions) {
      if (!tx.date.startsWith(prefix)) continue;
      const val = Number(tx.amount);
      if (tx.type === 'INCOME' && !tx.goal_id) income += val;
      if (tx.type === 'EXPENSE' && !tx.goal_id) expense += val;
    }

    points.push({
      year,
      month,
      prefix,
      label: formatShortMonthLabel(year, month, locale),
      income,
      expense,
      net: income - expense,
    });
  }

  const activeMonths = points.filter((p) => p.expense > 0);
  const avgExpense =
    activeMonths.length > 0
      ? activeMonths.reduce((s, p) => s + p.expense, 0) / activeMonths.length
      : 0;

  const currentExpense = points[points.length - 1]?.expense || 0;
  const currentVsAvgPct =
    avgExpense > 0
      ? Math.round(((currentExpense - avgExpense) / avgExpense) * 100)
      : null;

  return { points, avgExpense, currentVsAvgPct };
}

export function computeCategoryTrend(
  transactions: Transaction[],
  categoryId: string,
  locale: string,
  anchorYear: number,
  anchorMonth: number
): { prefix: string; label: string; amount: number }[] {
  const result: { prefix: string; label: string; amount: number }[] = [];

  for (let offset = -5; offset <= 0; offset++) {
    const { year, month, prefix } = shiftYearMonth(anchorYear, anchorMonth, offset);
    const amount = transactions
      .filter(
        (tx) =>
          tx.date.startsWith(prefix) &&
          tx.type === 'EXPENSE' &&
          tx.category_id === categoryId
      )
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    result.push({
      prefix,
      label: formatShortMonthLabel(year, month, locale),
      amount,
    });
  }

  return result;
}

export function computeContextBreakdown(
  transactions: Transaction[],
  contexts: ContextItem[],
  anchorYear: number,
  anchorMonth: number
): ContextBreakdownItem[] {
  const validPrefixes = new Set<string>();
  for (let offset = -5; offset <= 0; offset++) {
    validPrefixes.add(shiftYearMonth(anchorYear, anchorMonth, offset).prefix);
  }

  const ctxMap = new Map(contexts.map((c) => [c.id, c.name]));
  const agg = new Map<string, { amount: number; count: number }>();
  let total = 0;

  for (const tx of transactions) {
    if (tx.type !== 'EXPENSE' || tx.goal_id || !tx.context_id) continue;
    const txPrefix = tx.date.slice(0, 7);
    if (!validPrefixes.has(txPrefix)) continue;

    const val = Number(tx.amount);
    total += val;
    const cur = agg.get(tx.context_id) || { amount: 0, count: 0 };
    cur.amount += val;
    cur.count += 1;
    agg.set(tx.context_id, cur);
  }

  return Array.from(agg.entries())
    .map(([id, data]) => ({
      id,
      name: ctxMap.get(id) || 'Context',
      amount: data.amount,
      pct: total > 0 ? Math.round((data.amount / total) * 100) : 0,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export interface FutureRecurringItem {
  bill: RecurringBill;
  amount: number;
  isPaid: boolean;
}

export interface FutureMonthBucket {
  year: number;
  month: number;
  prefix: string;
  label: string;
  fullLabel: string;
  installmentsTotal: number;
  recurringTotal: number;
  combinedTotal: number;
  items: Transaction[];
  recurringItems: FutureRecurringItem[];
  finishingItems: Transaction[];
}

export function computeFutureCommitments(
  transactions: Transaction[],
  recurringBills: RecurringBill[],
  locale: string,
  startYear: number,
  startMonth: number,
  horizonMonths: 6 | 12
): {
  buckets: FutureMonthBucket[];
  grandTotalInstallments: number;
  grandTotalRecurring: number;
  grandTotalCombined: number;
  finishingSoon: { tx: Transaction; monthLabel: string; prefix: string }[];
} {
  const activeBills = recurringBills
    .filter((b) => b.is_active)
    .sort((a, b) => a.due_day - b.due_day);

  const buckets: FutureMonthBucket[] = [];
  let grandTotalInstallments = 0;
  let grandTotalRecurring = 0;
  const finishingSoon: { tx: Transaction; monthLabel: string; prefix: string }[] = [];

  for (let offset = 0; offset < horizonMonths; offset++) {
    const { year, month, prefix } = shiftYearMonth(startYear, startMonth, offset);

    const monthTxs = transactions.filter((tx) => tx.date.startsWith(prefix));

    // Parcelas agendadas neste mês
    const items = monthTxs
      .filter(
        (tx) =>
          tx.type === 'EXPENSE' &&
          !tx.goal_id &&
          tx.installment_total &&
          tx.installment_total > 1
      )
      .sort((a, b) => Number(b.amount) - Number(a.amount));

    const installmentsTotal = items.reduce((sum, tx) => sum + Number(tx.amount), 0);

    // Mapeia contas recorrentes já pagas neste mês (usa valor real pago se existir, senão o previsto)
    const paidRecurringMap = new Map<string, number>();
    for (const tx of monthTxs) {
      if (tx.recurring_bill_id && tx.type === 'EXPENSE') {
        paidRecurringMap.set(
          tx.recurring_bill_id,
          (paidRecurringMap.get(tx.recurring_bill_id) || 0) + Number(tx.amount)
        );
      }
    }

    const recurringItems: FutureRecurringItem[] = activeBills.map((bill) => {
      const paidAmount = paidRecurringMap.get(bill.id);
      const isPaid = paidAmount !== undefined;
      return {
        bill,
        amount: isPaid ? paidAmount : Number(bill.amount),
        isPaid,
      };
    });

    const recurringTotal = recurringItems.reduce((sum, r) => sum + r.amount, 0);
    const combinedTotal = installmentsTotal + recurringTotal;

    grandTotalInstallments += installmentsTotal;
    grandTotalRecurring += recurringTotal;

    const finishingItems = items.filter(
      (tx) => tx.installment_current === tx.installment_total
    );

    const fullLabel = formatShortMonthLabel(year, month, locale, true);
    finishingItems.forEach((tx) => {
      finishingSoon.push({ tx, monthLabel: fullLabel, prefix });
    });

    buckets.push({
      year,
      month,
      prefix,
      label: formatShortMonthLabel(year, month, locale),
      fullLabel,
      installmentsTotal,
      recurringTotal,
      combinedTotal,
      items,
      recurringItems,
      finishingItems,
    });
  }

  return {
    buckets,
    grandTotalInstallments,
    grandTotalRecurring,
    grandTotalCombined: grandTotalInstallments + grandTotalRecurring,
    finishingSoon,
  };
}

export interface CommitmentBreakdown {
  recurringTotal: number;
  installmentsTotal: number;
  variableTotal: number;
  fixedTotal: number;
  totalOutflow: number;
  income: number;
  fixedPctOfIncome: number | null;
}

export function computeCurrentCommitment(
  transactions: Transaction[],
  recurringBills: RecurringBill[],
  year: number,
  month: number
): CommitmentBreakdown {
  const prefix = getMonthPrefix(year, month);
  const recurringTotal = recurringBills
    .filter((b) => b.is_active)
    .reduce((sum, b) => sum + Number(b.amount), 0);

  let installmentsTotal = 0;
  let variableTotal = 0;
  let income = 0;

  for (const tx of transactions) {
    if (!tx.date.startsWith(prefix)) continue;
    const val = Number(tx.amount);

    if (tx.type === 'INCOME' && !tx.goal_id) {
      income += val;
      continue;
    }

    if (tx.type === 'EXPENSE' && !tx.goal_id) {
      if (tx.installment_total && tx.installment_total > 1) {
        installmentsTotal += val;
      } else if (!tx.recurring_bill_id) {
        variableTotal += val;
      }
    }
  }

  const fixedTotal = recurringTotal + installmentsTotal;
  const totalOutflow = fixedTotal + variableTotal;
  const fixedPctOfIncome =
    income > 0 ? Math.round((fixedTotal / income) * 100) : null;

  return {
    recurringTotal,
    installmentsTotal,
    variableTotal,
    fixedTotal,
    totalOutflow,
    income,
    fixedPctOfIncome,
  };
}

export interface GoalProjection {
  goal: Goal;
  saved: number;
  target: number;
  remaining: number;
  pct: number;
  monthsLeft: number | null;
  requiredMonthly: number | null;
  avgMonthlyDeposit: number;
  onTrack: boolean | null;
}

export function computeGoalProjections(
  goals: Goal[],
  transactions: Transaction[],
  anchorYear: number,
  anchorMonth: number
): GoalProjection[] {
  const recentPrefixes = new Set<string>([
    shiftYearMonth(anchorYear, anchorMonth, -2).prefix,
    shiftYearMonth(anchorYear, anchorMonth, -1).prefix,
    shiftYearMonth(anchorYear, anchorMonth, 0).prefix,
  ]);

  const now = new Date();

  return goals.map((goal) => {
    let saved = 0;
    let recentDeposits = 0;

    for (const tx of transactions) {
      if (tx.goal_id !== goal.id) continue;
      const val = Number(tx.amount);
      saved += tx.type === 'EXPENSE' ? val : -val;
      if (tx.type === 'EXPENSE' && recentPrefixes.has(tx.date.slice(0, 7))) {
        recentDeposits += val;
      }
    }

    const target = Number(goal.target_amount);
    const remaining = Math.max(target - saved, 0);
    const pct = target > 0 ? Math.min(Math.round((saved / target) * 100), 100) : 0;
    const avgMonthlyDeposit = recentDeposits / 3;

    let monthsLeft: number | null = null;
    let requiredMonthly: number | null = null;
    let onTrack: boolean | null = null;

    if (goal.target_date && remaining > 0) {
      const [ty, tm] = goal.target_date.split('-').map(Number);
      const diffMonths = (ty - now.getFullYear()) * 12 + (tm - (now.getMonth() + 1));
      monthsLeft = Math.max(1, diffMonths);
      requiredMonthly = remaining / monthsLeft;
      onTrack = avgMonthlyDeposit >= requiredMonthly;
    }

    return {
      goal,
      saved,
      target,
      remaining,
      pct,
      monthsLeft,
      requiredMonthly,
      avgMonthlyDeposit,
      onTrack,
    };
  });
}