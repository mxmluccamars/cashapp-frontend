import React, { useEffect, useState } from 'react';
import {
  X,
  Check,
  Loader2,
  Zap,
  Banknote,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { SearchableSelect } from '../components/SearchableSelect';
import type { TransactionType } from '../types/finance';

interface PitStopPageProps {
  onClose: () => void;
}

export function PitStopPage({ onClose }: PitStopPageProps) {
  const { currentTheme } = useTheme();
  const {
    categories,
    paymentMethods,
    isLoadingCatalogs,
    ensureCatalogsLoaded,
    addTransaction,
  } = useData();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [cents, setCents] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');

  const [installmentsInput, setInstallmentsInput] = useState<string>('1');
  const [isInstallmentFocused, setIsInstallmentFocused] = useState<boolean>(false);

  const [contextId, setContextId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureCatalogsLoaded();
  }, [ensureCatalogsLoaded]);

  // Filtra categorias conforme o tipo (EXPENSE ou INCOME)
  const filteredCategories = categories.filter((c) => c.type === type);

  // Na Entrada (INCOME), remove métodos que parcelam (Cartão de Crédito)
  const availablePaymentMethods = paymentMethods.filter((pm) => {
    if (type === 'INCOME') {
      return !pm.allows_installments && !pm.allow_installments;
    }
    return true;
  });

  // Garante uma categoria válida selecionada ao alternar entre Saída e Entrada
  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.some((c) => c.id === categoryId)) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [type, filteredCategories, categoryId]);

  // Garante uma forma de pagamento válida selecionada (e limpa o Cartão se mudar para Entrada)
  useEffect(() => {
    if (
      availablePaymentMethods.length > 0 &&
      !availablePaymentMethods.some((pm) => pm.id === paymentMethodId)
    ) {
      setPaymentMethodId(availablePaymentMethods[0].id);
      setInstallmentsInput('1');
    }
  }, [type, availablePaymentMethods, paymentMethodId]);

  const formattedAmount = (cents / 100).toFixed(2);
  const numericAmount = cents / 100;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setCents(Number(digitsOnly));
  };

  const renderPaymentIcon = (iconName?: string, isSelected?: boolean) => {
    const color = isSelected
      ? type === 'INCOME'
        ? '#FFFFFF'
        : currentTheme.primaryText
      : currentTheme.secondaryText;

    switch (iconName?.toLowerCase()) {
      case 'zap':
        return <Zap size={18} style={{ color }} />;
      case 'banknote':
        return <Banknote size={18} style={{ color }} />;
      case 'credit-card':
        return <CreditCard size={18} style={{ color }} />;
      default:
        return <Wallet size={18} style={{ color }} />;
    }
  };

  const selectedPayment = availablePaymentMethods.find((p) => p.id === paymentMethodId);
  const canInstallment = Boolean(
    selectedPayment?.allows_installments || selectedPayment?.allow_installments
  );
  const showInstallments = type === 'EXPENSE' && canInstallment;

  const installments = Math.max(1, Math.min(72, parseInt(installmentsInput, 10) || 1));
  const installmentValue = (numericAmount / installments).toFixed(2);

  const installmentDisplayValue = isInstallmentFocused
    ? installmentsInput
    : `${installments}x parcelas de R$ ${installmentValue}`;

  const handleInstallmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 2);
    setInstallmentsInput(digits);
  };

  const handleInstallmentBlur = () => {
    setIsInstallmentFocused(false);
    setInstallmentsInput(String(installments));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0 || !description.trim() || !categoryId || !paymentMethodId) {
      setError('Informe um valor maior que 0, descrição, categoria e forma de pagamento.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await addTransaction({
        description: description.trim(),
        amount: numericAmount,
        date,
        type,
        category_id: categoryId,
        payment_method_id: paymentMethodId,
        context_id: type === 'EXPENSE' && contextId ? contextId : null,
        // location_id: type === 'EXPENSE' && locationId ? locationId : null,
        installments: showInstallments ? installments : 1,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar transação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-5 flex flex-col max-w-md mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <span
            style={{ color: currentTheme.secondaryText }}
            className="text-[10px] font-bold uppercase tracking-widest block"
          >
            Box Confirmado
          </span>
          <h2 style={{ color: currentTheme.primaryText }} className="text-xl font-black uppercase">
            🛞 Novo Pit Stop
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
          className="p-2.5 rounded-full cursor-pointer active:scale-90 transition-transform"
        >
          <X size={20} />
        </button>
      </div>

      {isLoadingCatalogs ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin" size={32} style={{ color: currentTheme.primary }} />
          <span style={{ color: currentTheme.secondaryText }} className="text-xs uppercase font-bold">
            Carregando telemetria do Box...
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500 text-red-200 text-xs font-bold">
              {error}
            </div>
          )}

          {/* 1. Chave Seletora: Saída vs Entrada */}
          <div
            style={{ backgroundColor: currentTheme.bgCard }}
            className="grid grid-cols-2 p-1 rounded-xl"
          >
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              style={{
                backgroundColor: type === 'EXPENSE' ? currentTheme.primary : 'transparent',
                color: type === 'EXPENSE' ? currentTheme.primaryText : currentTheme.secondaryText,
              }}
              className="py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Saída (Despesa)
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              style={{
                backgroundColor: type === 'INCOME' ? '#10B981' : 'transparent',
                color: type === 'INCOME' ? '#FFFFFF' : currentTheme.secondaryText,
              }}
              className="py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Entrada (Receita)
            </button>
          </div>

          {/* 2. Valor com máscara da direita para a esquerda */}
          <div
            style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.secondary }}
            className="p-4 rounded-2xl border"
          >
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-wider block mb-1"
            >
              Valor Total (R$)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formattedAmount}
              onChange={handleAmountChange}
              style={{ color: currentTheme.primaryText }}
              className="w-full text-3xl font-black bg-transparent focus:outline-none tracking-tight"
              required
            />
          </div>

          {/* 3. Descrição */}
          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3 rounded-xl">
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              Descrição *
            </label>
            <input
              type="text"
              placeholder={
                type === 'EXPENSE' ? 'Ex: Padaria, Gasolina, Almoço...' : 'Ex: Salário, Freela...'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ color: currentTheme.primaryText }}
              className="w-full text-sm font-semibold bg-transparent focus:outline-none"
              required
            />
          </div>

          {/* 4. Data e Categoria */}
          <div className="grid grid-cols-5 gap-3">
            <div
              style={{ backgroundColor: currentTheme.bgCard }}
              className="col-span-2 p-3 rounded-xl"
            >
              <label
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase block mb-1.5"
              >
                Data *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ color: currentTheme.primaryText }}
                className="w-full text-xs font-semibold bg-transparent focus:outline-none"
                required
              />
            </div>

            <div className="col-span-3">
              <SearchableSelect
                label="Categoria"
                placeholder="Ex: Alimentação..."
                options={filteredCategories}
                value={categoryId}
                onChange={setCategoryId}
                required
              />
            </div>
          </div>

          {/* 5. Forma de Pagamento / Recebimento (Para Ambos, filtrando Crédito na Entrada) */}
          <div>
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1.5 px-1"
            >
              {type === 'EXPENSE' ? 'Forma de Pagamento *' : 'Recebido via *'}
            </label>
            <div
              className={`grid gap-2.5 ${
                availablePaymentMethods.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
              }`}
            >
              {availablePaymentMethods.map((pm) => {
                const isSelected = paymentMethodId === pm.id;
                const activeBg = type === 'INCOME' ? '#10B981' : currentTheme.primary;
                const activeText = type === 'INCOME' ? '#FFFFFF' : currentTheme.primaryText;

                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethodId(pm.id);
                      setInstallmentsInput('1');
                    }}
                    style={{
                      backgroundColor: isSelected ? activeBg : currentTheme.bgCard,
                      borderColor: isSelected ? activeBg : 'transparent',
                      color: isSelected ? activeText : currentTheme.secondaryText,
                    }}
                    className="p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    {renderPaymentIcon(pm.icon, isSelected)}
                    <span className="text-[11px] font-bold text-center leading-tight">
                      {pm.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CAMPOS EXCLUSIVOS DE DESPESA (SAÍDA) */}
          {type === 'EXPENSE' && (
            <>
              {/* 6. Input Inteligente de Parcelas */}
              {showInstallments && (
                <div
                  style={{
                    backgroundColor: currentTheme.bgCard,
                    borderColor: currentTheme.primary,
                  }}
                  className="p-3 rounded-xl border transition-all"
                >
                  <label
                    style={{ color: currentTheme.secondaryText }}
                    className="text-[10px] font-bold uppercase block mb-1"
                  >
                    💳 Número de Parcelas
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={installmentDisplayValue}
                    onFocus={() => setIsInstallmentFocused(true)}
                    onBlur={handleInstallmentBlur}
                    onChange={handleInstallmentChange}
                    placeholder="Digite o nº de parcelas (ex: 3)"
                    style={{ color: currentTheme.primaryText }}
                    className="w-full text-sm font-black bg-transparent focus:outline-none"
                  />
                </div>
              )}

              {/* 7. Contexto e Local com Barra de Pesquisa
              <div className="grid grid-cols-2 gap-3">
                <SearchableSelect
                  label="Contexto"
                  placeholder="Ex: Trabalho..."
                  options={contexts}
                  value={contextId}
                  onChange={setContextId}
                />

                <SearchableSelect
                  label="Local / Lugar"
                  placeholder="Ex: Padaria..."
                  options={locations.map((loc) => ({
                    id: loc.id,
                    name: loc.name,
                    subtitle: loc.city ? `${loc.city}` : null,
                  }))}
                  value={locationId}
                  onChange={setLocationId}
                />
              </div> */}
            </>
          )}

          {/* Botão de Confirmação */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor:
                type === 'INCOME' ? '#10B981' : currentTheme.primary,
              color: type === 'INCOME' ? '#FFFFFF' : currentTheme.primaryText,
            }}
            className="mt-auto py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Check size={20} strokeWidth={3} />
                {type === 'EXPENSE' ? 'Confirmar Saída' : 'Confirmar Entrada'}
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}