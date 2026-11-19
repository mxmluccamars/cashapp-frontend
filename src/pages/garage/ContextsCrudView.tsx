import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Search, Trash2, Check, Loader2, ChevronRight} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import type { ContextItem } from '../../types/finance';

interface ContextsCrudViewProps {
  onBack: () => void;
}

export function ContextsCrudView({ onBack }: ContextsCrudViewProps) {
  const { currentTheme } = useTheme();
  const {
    contexts,
    isLoadingCatalogs,
    ensureCatalogsLoaded,
    addContext,
    editContext,
    removeContext,
  } = useData();

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ContextItem | 'new' | null>(null);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureCatalogsLoaded();
  }, [ensureCatalogsLoaded]);

  const openCreate = () => {
    setEditing('new');
    setName('');
    setError(null);
  };

  const openEdit = (ctx: ContextItem) => {
    setEditing(ctx);
    setName(ctx.name);
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
      if (editing === 'new') {
        await addContext({ name: name.trim() });
      } else if (editing) {
        await editContext(editing.id, { name: name.trim() });
      }
      setEditing(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar contexto.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing || editing === 'new') return;
    if (!window.confirm(`Excluir o contexto "${editing.name}"?`)) return;

    setIsSaving(true);
    setError(null);
    try {
      await removeContext(editing.id);
      setEditing(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir contexto.');
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // SUB-TELA: CRIAR / EDITAR CONTEXTO
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
              Contextos
            </span>
            <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
              {isNew ? 'Novo Contexto' : 'Editar Contexto'}
            </h2>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500 text-red-200 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              Nome do Contexto *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Dia a dia, Trabalho, Igreja, Férias..."
              style={{ color: currentTheme.primaryText }}
              className="w-full text-sm font-semibold bg-transparent focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            style={{ backgroundColor: currentTheme.primary, color: currentTheme.primaryText }}
            className="py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-50 mt-2"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
            {isNew ? 'Criar Contexto' : 'Salvar Alterações'}
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <Trash2 size={16} />
              Excluir Contexto
            </button>
          )}
        </form>
      </div>
    );
  }

  // ==========================================
  // TELA PRINCIPAL: LISTA DE CONTEXTOS
  // ==========================================
  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredList = contexts.filter((c) =>
    normalize(c.name).includes(normalize(search))
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
              Contextos
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
          placeholder="Buscar contexto..."
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
          Nenhum contexto encontrado.
        </p>
      ) : (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="rounded-2xl overflow-hidden divide-y divide-white/5"
        >
          {filteredList.map((ctx) => (
            <button
              key={ctx.id}
              onClick={() => openEdit(ctx)}
              className="w-full px-4 py-3.5 flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-2.5">
                <span
                  style={{ color: currentTheme.primary }}
                  className="text-base font-black opacity-80"
                >
                  #
                </span>
                <span
                  style={{ color: currentTheme.primaryText }}
                  className="text-sm font-bold"
                >
                  {ctx.name}
                </span>
              </div>
              <ChevronRight size={18} style={{ color: currentTheme.secondaryText }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}