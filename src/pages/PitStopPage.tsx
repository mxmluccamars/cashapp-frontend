import React, { useEffect, useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import type { TransactionType } from '../types/finance';

interface PitStopPageProps {
  onClose: () => void;
}

export function PitStopPage({ onClose }: PitStopPageProps) {
  const { currentTheme } = useTheme();
  const {
    categories,
    paymentMethods,
    contexts,
    locations,
    goals,
    isLoadingCatalogs,
    ensureCatalogsLoaded,
    addTransaction,
  } = useData();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [installments, setInstallments] = useState(1);
  const [contextId, setContextId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gatilho Lazy: carrega os catálogos apenas ao abrir esta tela pela 1ª vez
  useEffect(() => {
    ensureCatalogsLoaded();
  }, [ensureCatalogsLoaded]);

  // Filtra categorias pelo tipo selecionado (EXPENSE ou INCOME)
  const filteredCategories = categories.filter((c) => c.type === type);

  // Seleciona automaticamente a primeira categoria disponível quando a lista carrega ou muda o tipo
  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.some((c) => c.id === categoryId)) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [type, categories, filteredCategories, categoryId]);

  // Verifica se o método de pagamento escolhido aceita parcelas (ou se tem "crédito" no nome)
  const selectedPayment = paymentMethods.find((p) => p.id === paymentMethodId);
  const showInstallments =
    type === 'EXPENSE' &&
    selectedPayment &&
    (selectedPayment.allows_installments ||
      selectedPayment.name.toLowerCase().includes('crédito') ||
      selectedPayment.name.toLowerCase().includes('credito'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !description || !categoryId) {
      setError('Preencha valor, descrição e categoria.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await addTransaction({
        description,
        amount: Number(amount),
        date,
        type,
        category_id: categoryId,
        payment_method_id: paymentMethodId || null,
        context_id: contextId || null,
        location_id: locationId || null,
        goal_id: goalId || null,
        installments: showInstallments ? installments : 1,
      });
      onClose(); // Volta imediatamente para a tela onde você estava!
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar transação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-5 flex flex-col max-w-md mx-auto">
      {/* Topo da Tela de Foco */}
      <div className="flex items-center justify-between mb-6">
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
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500 text-red-200 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Seletor Despesa / Receita */}
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

          {/* Valor em Destaque */}
          <div
            style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.secondary }}
            className="p-4 rounded-2xl border"
          >
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-wider block mb-1"
            >
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ color: currentTheme.primaryText }}
              className="w-full text-3xl font-black bg-transparent focus:outline-none"
              required
            />
          </div>

          {/* Descrição e Data */}
          <div className="grid grid-cols-3 gap-3">
            <div
              style={{ backgroundColor: currentTheme.bgCard }}
              className="col-span-2 p-3 rounded-xl"
            >
              <label
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase block mb-1"
              >
                Descrição *
              </label>
              <input
                type="text"
                placeholder="Ex: Padaria, Gasolina..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ color: currentTheme.primaryText }}
                className="w-full text-sm font-semibold bg-transparent focus:outline-none"
                required
              />
            </div>

            <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3 rounded-xl">
              <label
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase block mb-1"
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
          </div>

          {/* Categoria (Obrigatória) e Forma de Pagamento */}
          <div className="grid grid-cols-2 gap-3">
            <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3 rounded-xl">
              <label
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase block mb-1"
              >
                Categoria *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{ color: currentTheme.primaryText, backgroundColor: currentTheme.bgCard }}
                className="w-full text-sm font-semibold focus:outline-none"
                required
              >
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3 rounded-xl">
              <label
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase block mb-1"
              >
                Pagamento
              </label>
              <select
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
                style={{ color: currentTheme.primaryText, backgroundColor: currentTheme.bgCard }}
                className="w-full text-sm font-semibold focus:outline-none"
              >
                <option value="">Opcional...</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campo Condicional de Parcelas (Só aparece se for Cartão de Crédito) */}
          {showInstallments && (
            <div
              style={{
                backgroundColor: currentTheme.bgCard,
                borderColor: currentTheme.primary,
              }}
              className="p-3 rounded-xl border flex items-center justify-between"
            >
              <span
                style={{ color: currentTheme.primaryText }}
                className="text-xs font-bold uppercase"
              >
                💳 Quantidade de Parcelas:
              </span>
              <select
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                style={{ color: currentTheme.primaryText, backgroundColor: currentTheme.bgCard }}
                className="text-sm font-black focus:outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num}x {amount ? `de R$ ${(Number(amount) / num).toFixed(2)}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Contexto e Local (As camadas extras de filtro) */}
          <div className="grid grid-cols-2 gap-3">
            <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3 rounded-xl">
              <label
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase block mb-1"
              >
                Contexto
              </label>
              <select
                value={contextId}
                onChange={(e) => setContextId(e.target.value)}
                style={{ color: currentTheme.primaryText, backgroundColor: currentTheme.bgCard }}
                className="w-full text-sm font-semibold focus:outline-none"
              >
                <option value="">Opcional...</option>
                {contexts.map((ctx) => (
                  <option key={ctx.id} value={ctx.id}>
                    {ctx.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3 rounded-xl">
              <label
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase block mb-1"
              >
                Local / Lugar
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                style={{ color: currentTheme.primaryText, backgroundColor: currentTheme.bgCard }}
                className="w-full text-sm font-semibold focus:outline-none"
              >
                <option value="">Opcional...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vínculo com Caixinha / Meta */}
          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3 rounded-xl">
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              Vincular a uma Caixinha (Meta)
            </label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              style={{ color: currentTheme.primaryText, backgroundColor: currentTheme.bgCard }}
              className="w-full text-sm font-semibold focus:outline-none"
            >
              <option value="">Nenhuma caixinha...</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  🎯 {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Botão Confirmar no Rodapé */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: currentTheme.primary,
              color: currentTheme.primaryText,
            }}
            className="mt-auto py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Check size={20} strokeWidth={3} />
                Confirmar Pit Stop
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}