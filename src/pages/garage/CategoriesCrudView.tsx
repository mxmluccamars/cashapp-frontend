import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Search, Trash2, Check, Loader2, ChevronRight } from 'lucide-react';
import { DynamicIcon } from '../../components/DynamicIcon';
import { IconPicker } from '../../components/IconPicker';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import type { Category, TransactionType } from '../../types/finance';

interface CategoriesCrudViewProps {
  onBack: () => void;
}

const COLOR_PRESETS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#EC4899', '#64748B',
];

export function CategoriesCrudView({ onBack }: CategoriesCrudViewProps) {
  const { currentTheme } = useTheme();
  const {
    categories,
    isLoadingCatalogs,
    ensureCatalogsLoaded,
    addCategory,
    editCategory,
    removeCategory,
  } = useData();

  // Estado da lista
  const [filterType, setFilterType] = useState<TransactionType>('EXPENSE');
  const [search, setSearch] = useState('');

  // Estado da tela de edição/criação (null = mostra lista)
  const [editing, setEditing] = useState<Category | 'new' | null>(null);

  // Campos do formulário
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [color, setColor] = useState('#10B981');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [icon, setIcon] = useState('Tag');

  // Lazy Load dos catálogos
  useEffect(() => {
    ensureCatalogsLoaded();
  }, [ensureCatalogsLoaded]);

  const openCreate = () => {
    setEditing('new');
    setName('');
    setType(filterType);
    setColor(COLOR_PRESETS[0]);
    setMonthlyLimit('');
    setError(null);
    setIcon('Tag');
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color || '#10B981');
    setMonthlyLimit(cat.monthly_limit ? String(cat.monthly_limit) : '');
    setError(null);
    setIcon(cat.icon || 'Tag');
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
        type,
        color,
        icon: icon || 'Tag',
        monthly_limit:
          type === 'EXPENSE' && monthlyLimit && Number(monthlyLimit) > 0
            ? Number(monthlyLimit)
            : null,
      };

      if (editing === 'new') {
        await addCategory(payload);
      } else if (editing) {
        await editCategory(editing.id, payload);
      }
      setEditing(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar categoria.');
    } finally {
      setIsSaving(false);
    }
    
  };

  const handleDelete = async () => {
    if (!editing || editing === 'new') return;
    if (!window.confirm(`Excluir a categoria "${editing.name}"?`)) return;

    setIsSaving(true);
    setError(null);
    try {
      await removeCategory(editing.id);
      setEditing(null);
    } catch (err: any) {
      setError(
        err.message || 'Não foi possível excluir (pode haver transações vinculadas).'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // SUB-TELA: CRIAR / EDITAR CATEGORIA
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
              Categorias
            </span>
            <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
              {isNew ? 'Nova Categoria' : 'Editar Categoria'}
            </h2>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500 text-red-200 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Tipo: Saída ou Entrada */}
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
              className="py-2.5 rounded-lg font-black text-xs uppercase cursor-pointer"
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
              className="py-2.5 rounded-lg font-black text-xs uppercase cursor-pointer"
            >
              Entrada (Receita)
            </button>
          </div>

          {/* Nome */}
          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              Nome da Categoria *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Alimentação, Lazer, Salário..."
              style={{ color: currentTheme.primaryText }}
              className="w-full text-sm font-semibold bg-transparent focus:outline-none"
              required
            />
          </div>

          {/* Limite Mensal (Apenas para Despesas) */}
          {type === 'EXPENSE' && (
            <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
              <label
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase block mb-1"
              >
                Teto Mensal Opcional (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="Ex: 800.00 (deixe vazio se não tiver limite)"
                style={{ color: currentTheme.primaryText }}
                className="w-full text-sm font-semibold bg-transparent focus:outline-none"
              />
            </div>
          )}

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

          <IconPicker value={icon} color={color} onChange={setIcon} />

          {/* Botão Salvar */}
          <button
            type="submit"
            disabled={isSaving}
            style={{ backgroundColor: currentTheme.primary, color: currentTheme.primaryText }}
            className="py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-50 mt-2"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
            {isNew ? 'Criar Categoria' : 'Salvar Alterações'}
          </button>

          {/* Botão Excluir (Apenas na edição) */}
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <Trash2 size={16} />
              Excluir Categoria
            </button>
          )}
        </form>
      </div>
    );
  }

  // ==========================================
  // TELA PRINCIPAL: LISTA DE CATEGORIAS
  // ==========================================
  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredList = categories.filter(
    (c) => c.type === filterType && normalize(c.name).includes(normalize(search))
  );

  return (
    <div className="p-5 pb-28 max-w-md mx-auto flex flex-col gap-4">
      {/* Header com botão + Nova */}
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
              Categorias
            </h2>
          </div>
        </div>

        <button
          onClick={openCreate}
          style={{ backgroundColor: currentTheme.primary, color: currentTheme.primaryText }}
          className="px-3.5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
        >
          <Plus size={16} strokeWidth={3} />
          Nova
        </button>
      </div>

      {/* Filtro Saídas / Entradas */}
      <div
        style={{ backgroundColor: currentTheme.bgCard }}
        className="grid grid-cols-2 p-1 rounded-xl"
      >
        <button
          onClick={() => setFilterType('EXPENSE')}
          style={{
            backgroundColor: filterType === 'EXPENSE' ? currentTheme.primary : 'transparent',
            color: filterType === 'EXPENSE' ? currentTheme.primaryText : currentTheme.secondaryText,
          }}
          className="py-2 rounded-lg font-black text-xs uppercase cursor-pointer"
        >
          Saídas
        </button>
        <button
          onClick={() => setFilterType('INCOME')}
          style={{
            backgroundColor: filterType === 'INCOME' ? '#10B981' : 'transparent',
            color: filterType === 'INCOME' ? '#FFFFFF' : currentTheme.secondaryText,
          }}
          className="py-2 rounded-lg font-black text-xs uppercase cursor-pointer"
        >
          Entradas
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
          placeholder="Buscar categoria..."
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
          Nenhuma categoria encontrada.
        </p>
      ) : (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="rounded-2xl overflow-hidden divide-y divide-white/5"
        >
          {filteredList.map((cat) => (
            <button
              key={cat.id}
              onClick={() => openEdit(cat)}
              className="w-full p-4 flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <div
                    style={{
                        backgroundColor: `${cat.color || '#10B981'}25`,
                        color: cat.color || '#10B981',
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    >
                    <DynamicIcon name={cat.icon} size={18} />
                    </div>
                <div className="text-left">
                  <span
                    style={{ color: currentTheme.primaryText }}
                    className="text-sm font-bold block"
                  >
                    {cat.name}
                  </span>
                  {cat.monthly_limit && (
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[11px] font-medium"
                    >
                      Limite: R$ {Number(cat.monthly_limit).toFixed(2)}/mês
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} style={{ color: currentTheme.secondaryText }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}