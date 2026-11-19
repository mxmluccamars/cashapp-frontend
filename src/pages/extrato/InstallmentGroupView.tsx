import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { DynamicIcon } from '../../components/DynamicIcon';

interface InstallmentGroupViewProps {
  groupId: string;
  currentTxId: string;
  onBack: () => void;
  onSelectTransaction: (txId: string) => void;
  onDeletedAll: () => void;
}

const formatBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const getTodayLocalISO = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatMonthYear = (isoDate: string) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(y, m - 1, d));
};

export function InstallmentGroupView({
  groupId,
  currentTxId,
  onBack,
  onSelectTransaction,
  onDeletedAll,
}: InstallmentGroupViewProps) {
  const { currentTheme } = useTheme();
  const { transactions, categories, paymentMethods, removeTransaction } = useData();
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const todayISO = getTodayLocalISO();

  // Busca todas as parcelas do mesmo grupo e ordena da 1ª até a última
  const groupItems = useMemo(() => {
    return transactions
      .filter((tx) => tx.installment_group_id === groupId)
      .sort((a, b) => {
        const diff = (a.installment_current || 0) - (b.installment_current || 0);
        return diff !== 0 ? diff : a.date.localeCompare(b.date);
      });
  }, [transactions, groupId]);

  const refTx = groupItems.find((t) => t.id === currentTxId) || groupItems[0];
  const category = refTx
    ? categories.find((c) => c.id === refTx.category_id)
    : null;
  const paymentMethod = refTx?.payment_method_id
    ? paymentMethods.find((pm) => pm.id === refTx.payment_method_id)
    : null;

  const { totalAmount, paidAmount, remainingAmount, paidCount } = useMemo(() => {
    return groupItems.reduce(
      (acc, tx) => {
        const val = Number(tx.amount);
        acc.totalAmount += val;
        if (tx.date <= todayISO) {
          acc.paidAmount += val;
          acc.paidCount += 1;
        } else {
          acc.remainingAmount += val;
        }
        return acc;
      },
      { totalAmount: 0, paidAmount: 0, remainingAmount: 0, paidCount: 0 }
    );
  }, [groupItems, todayISO]);

  const totalCount = groupItems.length;
  const progressPct =
    totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
  const catColor = category?.color || currentTheme.primary;

  const handleDeleteAll = async () => {
    if (groupItems.length === 0) return;
    const confirmed = window.confirm(
      `Excluir TODAS as ${groupItems.length} parcelas de "${refTx?.description}" (${formatBRL(totalAmount)})? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setIsDeletingAll(true);
    try {
      for (const item of groupItems) {
        await removeTransaction(item.id);
      }
      onDeletedAll();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir parcelas.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="p-5 pb-10 max-w-md mx-auto flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          style={{
            backgroundColor: currentTheme.bgCard,
            color: currentTheme.primaryText,
          }}
          className="p-2.5 rounded-xl cursor-pointer active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase tracking-widest block"
          >
            Detalhes das Parcelas
          </span>
          <h2
            style={{ color: currentTheme.primaryText }}
            className="text-lg font-black uppercase truncate"
          >
            {refTx?.description || 'Compra Parcelada'}
          </h2>
        </div>
      </div>

      {/* Card Resumo do Parcelamento */}
      <div
        style={{ backgroundColor: currentTheme.bgCard }}
        className="p-5 rounded-3xl flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: `${catColor}25`, color: catColor }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            >
              <DynamicIcon name={category?.icon} size={20} />
            </div>
            <div>
              <span
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase tracking-widest block"
              >
                Valor Total ({totalCount}x)
              </span>
              <span
                style={{ color: currentTheme.primaryText }}
                className="text-2xl font-black block"
              >
                {formatBRL(totalAmount)}
              </span>
            </div>
          </div>

          {paymentMethod && (
            <span
              style={{
                backgroundColor: currentTheme.bgDark,
                color: currentTheme.secondaryText,
              }}
              className="px-2.5 py-1 rounded-xl text-[10px] font-bold"
            >
              {paymentMethod.name}
            </span>
          )}
        </div>

        {/* Barra de Progresso */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span style={{ color: currentTheme.secondaryText }}>
              {paidCount} de {totalCount} parcelas até hoje
            </span>
            <span style={{ color: currentTheme.primary }}>{progressPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              style={{
                width: `${progressPct}%`,
                backgroundColor: currentTheme.primary,
              }}
              className="h-full rounded-full transition-all duration-300"
            />
          </div>
        </div>

        {/* Até hoje vs A vencer */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
          <div>
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block"
            >
              Até hoje
            </span>
            <span className="text-sm font-black text-emerald-400">
              {formatBRL(paidAmount)}
            </span>
          </div>
          <div className="text-right">
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block"
            >
              A vencer
            </span>
            <span
              style={{ color: currentTheme.primaryText }}
              className="text-sm font-black"
            >
              {formatBRL(remainingAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Parcelas */}
      <div className="flex flex-col gap-2">
        <span
          style={{ color: currentTheme.secondaryText }}
          className="text-[10px] font-bold uppercase tracking-widest px-1"
        >
          Cronograma ({totalCount} parcelas)
        </span>

        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="rounded-2xl overflow-hidden divide-y divide-white/5"
        >
          {groupItems.map((item) => {
            const isCurrent = item.id === currentTxId;
            const isDue = item.date <= todayISO;
            const dateBr = item.date.split('-').reverse().join('/');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTransaction(item.id)}
                style={{
                  backgroundColor: isCurrent
                    ? `${currentTheme.primary}15`
                    : 'transparent',
                }}
                className="w-full p-3.5 flex items-center justify-between gap-3 cursor-pointer active:opacity-70 transition-opacity text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    style={{
                      backgroundColor: isDue
                        ? 'rgba(16, 185, 129, 0.15)'
                        : currentTheme.bgDark,
                      color: isDue ? '#10B981' : currentTheme.secondaryText,
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  >
                    {isDue ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        style={{ color: currentTheme.primaryText }}
                        className="text-sm font-bold capitalize"
                      >
                        Parcela {item.installment_current}/{item.installment_total}
                      </span>
                      {isCurrent && (
                        <span
                          style={{
                            backgroundColor: currentTheme.primary,
                            color: currentTheme.primaryText,
                          }}
                          className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md"
                        >
                          Atual
                        </span>
                      )}
                    </div>

                    <div
                      style={{ color: currentTheme.secondaryText }}
                      className="flex items-center gap-1 text-[11px] font-medium capitalize mt-0.5"
                    >
                      <Calendar size={10} />
                      <span>
                        {formatMonthYear(item.date)} • {dateBr}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    style={{ color: currentTheme.primaryText }}
                    className="text-sm font-black"
                  >
                    {formatBRL(Number(item.amount))}
                  </span>
                  <ChevronRight
                    size={16}
                    style={{ color: currentTheme.secondaryText }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Excluir todas as parcelas */}
      {groupItems.length > 1 && (
        <button
          type="button"
          onClick={handleDeleteAll}
          disabled={isDeletingAll}
          className="py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
        >
          {isDeletingAll ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Trash2 size={16} />
          )}
          Excluir todas as {groupItems.length} parcelas
        </button>
      )}
    </div>
  );
}