import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Search, Trash2, Check, Loader2, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { DynamicIcon } from '../../components/DynamicIcon';
import { IconPicker } from '../../components/IconPicker';
import type { PaymentMethod } from '../../types/finance';

interface PaymentsCrudViewProps {
  onBack: () => void;
}

const COLOR_PRESETS = [
  '#10B981', '#F59E0B', '#8A05BE', '#3B82F6',
  '#EF4444', '#06B6D4', '#EC4899', '#64748B',
];

export function PaymentsCrudView({ onBack }: PaymentsCrudViewProps) {
  const { currentTheme } = useTheme();
  const {
    paymentMethods,
    isLoadingCatalogs,
    ensureCatalogsLoaded,
    addPaymentMethod,
    editPaymentMethod,
    removePaymentMethod,
  } = useData();

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PaymentMethod | 'new' | null>(null);

  // Campos do formulário
  const [name, setName] = useState('');
  const [color, setColor] = useState('#8A05BE');
  const [icon, setIcon] = useState('CreditCard');
  const [allowsInstallments, setAllowsInstallments] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureCatalogsLoaded();
  }, [ensureCatalogsLoaded]);

  const openCreate = () => {
    setEditing('new');
    setName('');
    setColor('#8A05BE');
    setIcon('CreditCard');
    setAllowsInstallments(false);
    setError(null);
  };

  const openEdit = (pm: PaymentMethod) => {
    setEditing(pm);
    setName(pm.name);
    setColor(pm.color || '#8A05BE');
    setIcon(pm.icon || 'CreditCard');
    setAllowsInstallments(Boolean(pm.allows_installments || pm.allow_installments));
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('O nome precisa ter pelo menos 2 caracteres.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        color,
        icon: icon || 'CreditCard',
        allows_installments: allowsInstallments,
      };

      if (editing === 'new') {
        await addPaymentMethod(payload);
      } else if (editing) {
        await editPaymentMethod(editing.id, payload);
      }
      setEditing(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar forma de pagamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing || editing === 'new') return;
    if (!window.confirm(`Excluir a forma de pagamento "${editing.name}"?`)) return;

    setIsSaving(true);
    setError(null);
    try {
      await removePaymentMethod(editing.id);
      setEditing(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir forma de pagamento.');
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // SUB-TELA: CRIAR / EDITAR FORMA DE PAGAMENTO
  // ==========================================
  if (editing !== null) {
    const isNew = editing === 'new';

    return (
      <div className="p-5 pb-10 max-w-md mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(null)}
            style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
            className="p-2.5 rounded-xl cursor-pointer active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-widest block"
            >
              Formas de Pagamento
            </span>
            <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
              {isNew ? 'Nova Forma' : 'Editar Forma'}
            </h2>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500 text-red-200 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Nome */}
          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              Nome *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pix, Cartão Nubank, Dinheiro..."
              style={{ color: currentTheme.primaryText }}
              className="w-full text-sm font-semibold bg-transparent focus:outline-none"
              required
            />
          </div>

          {/* Toggle: Permite Parcelamento */}
          <button
            type="button"
            onClick={() => setAllowsInstallments((prev) => !prev)}
            style={{ backgroundColor: currentTheme.bgCard }}
            className="p-4 rounded-xl flex items-center justify-between cursor-pointer text-left"
          >
            <div>
              <span
                style={{ color: currentTheme.primaryText }}
                className="text-sm font-bold block"
              >
                Permite parcelamento?
              </span>
              <span
                style={{ color: currentTheme.secondaryText }}
                className="text-[11px] font-medium"
              >
                {allowsInstallments
                  ? 'Habilita divisão em parcelas (ex: Cartão de Crédito)'
                  : 'Apenas à vista (disponível também para Entradas)'}
              </span>
            </div>

            {/* Switch visual */}
            <div
              style={{
                backgroundColor: allowsInstallments
                  ? currentTheme.primary
                  : currentTheme.bgDark,
              }}
              className="w-12 h-7 rounded-full p-1 transition-colors shrink-0 flex items-center"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  allowsInstallments ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          {/* Seletor de Cor */}
          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-4 rounded-xl">
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-3"
            >
              Cor de Identificação
            </label>
            <div className="flex flex-wrap gap-2.5 items-center">
              {COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  style={{
                    backgroundColor: hex,
                    outline: color === hex ? `3px solid ${currentTheme.primaryText}` : 'none',
                    outlineOffset: '2px',
                  }}
                  className="w-8 h-8 rounded-full cursor-pointer transition-transform active:scale-90"
                />
              ))}
            </div>
          </div>

          {/* Seletor de Ícones Lucide */}
          <IconPicker value={icon} color={color} onChange={setIcon} />

          {/* Botão Salvar */}
          <button
            type="submit"
            disabled={isSaving}
            style={{ backgroundColor: currentTheme.primary, color: currentTheme.primaryText }}
            className="py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-50 mt-2"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
            {isNew ? 'Criar Forma de Pagamento' : 'Salvar Alterações'}
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <Trash2 size={16} />
              Excluir Forma de Pagamento
            </button>
          )}
        </form>
      </div>
    );
  }

  // ==========================================
  // TELA PRINCIPAL: LISTA DE FORMAS DE PAGAMENTO
  // ==========================================
  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredList = paymentMethods.filter((pm) =>
    normalize(pm.name).includes(normalize(search))
  );

  return (
    <div className="p-5 pb-10 max-w-md mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
            className="p-2.5 rounded-xl cursor-pointer active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase tracking-widest block"
            >
              Gerenciar Cadastros
            </span>
            <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
              Pagamentos
            </h2>
          </div>
        </div>

        <button
          onClick={openCreate}
          style={{ backgroundColor: currentTheme.primary, color: currentTheme.primaryText }}
          className="px-3.5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
        >
          <Plus size={16} strokeWidth={3} />
          Novo
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div
        style={{ backgroundColor: currentTheme.bgCard }}
        className="px-3.5 py-2.5 rounded-xl flex items-center gap-2.5"
      >
        <Search size={16} style={{ color: currentTheme.secondaryText }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar forma de pagamento..."
          style={{ color: currentTheme.primaryText }}
          className="w-full text-sm font-medium bg-transparent focus:outline-none"
        />
      </div>

      {/* Lista */}
      {isLoadingCatalogs ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="animate-spin" size={28} style={{ color: currentTheme.primary }} />
        </div>
      ) : filteredList.length === 0 ? (
        <p style={{ color: currentTheme.secondaryText }} className="text-center text-xs py-10">
          Nenhuma forma de pagamento encontrada.
        </p>
      ) : (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="rounded-2xl overflow-hidden divide-y divide-white/5"
        >
          {filteredList.map((pm) => {
            const canParcel = Boolean(pm.allows_installments || pm.allow_installments);
            const pmColor = pm.color || '#8A05BE';

            return (
              <button
                key={pm.id}
                onClick={() => openEdit(pm)}
                className="w-full p-4 flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      backgroundColor: `${pmColor}25`,
                      color: pmColor,
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <DynamicIcon name={pm.icon} size={18} />
                  </div>
                  <div className="text-left">
                    <span
                      style={{ color: currentTheme.primaryText }}
                      className="text-sm font-bold block"
                    >
                      {pm.name}
                    </span>
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[11px] font-medium"
                    >
                      {canParcel ? 'Aceita parcelamento' : 'Somente à vista'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: currentTheme.secondaryText }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}