import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Search, Trash2, Check, Loader2, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import type { LocationItem } from '../../types/finance';

interface LocationsCrudViewProps {
  onBack: () => void;
}

const normalize = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Campo de texto com sugestões existentes + criação livre
interface SuggestionInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  maxLength?: number;
  uppercase?: boolean;
}

function SuggestionInput({
  label,
  placeholder,
  value,
  onChange,
  suggestions,
  maxLength,
  uppercase = false,
}: SuggestionInputProps) {
  const { currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = normalize(value.trim());
    return suggestions.filter((item) => {
      const normItem = normalize(item);
      // Não sugere se já for exatamente igual ao que está digitado
      return normItem.includes(q) && normItem !== q;
    });
  }, [suggestions, value]);

  return (
    <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl relative">
      <label
        style={{ color: currentTheme.secondaryText }}
        className="text-[10px] font-bold uppercase block mb-1"
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onChange={(e) => {
          const next = uppercase ? e.target.value.toUpperCase() : e.target.value;
          onChange(next);
          setIsOpen(true);
        }}
        placeholder={placeholder}
        style={{ color: currentTheme.primaryText }}
        className="w-full text-sm font-semibold bg-transparent focus:outline-none"
      />

      {isOpen && filtered.length > 0 && (
        <div
          style={{
            backgroundColor: currentTheme.bgCard,
            borderColor: currentTheme.secondary,
          }}
          className="absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-2xl max-h-40 overflow-y-auto z-50 divide-y divide-white/5"
        >
          {filtered.map((item) => (
            <button
              key={item}
              type="button"
              // onMouseDown dispara antes do onBlur do input
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(item);
                setIsOpen(false);
              }}
              style={{ color: currentTheme.primaryText }}
              className="w-full text-left px-3.5 py-2.5 text-xs font-bold hover:opacity-80 cursor-pointer flex items-center justify-between"
            >
              <span>{item}</span>
              <span style={{ color: currentTheme.secondaryText }} className="text-[10px]">
                existente
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LocationsCrudView({ onBack }: LocationsCrudViewProps) {
  const { currentTheme } = useTheme();
  const {
    locations,
    isLoadingCatalogs,
    ensureCatalogsLoaded,
    addLocation,
    editLocation,
    removeLocation,
  } = useData();

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<LocationItem | 'new' | null>(null);

  // Campos do formulário
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureCatalogsLoaded();
  }, [ensureCatalogsLoaded]);

  // Listas únicas de cidades e estados já existentes no banco
  const existingCities = useMemo(() => {
    const set = new Set<string>();
    locations.forEach((l) => {
      if (l.city?.trim()) set.add(l.city.trim());
    });
    return Array.from(set).sort();
  }, [locations]);

  const existingStates = useMemo(() => {
    const set = new Set<string>();
    locations.forEach((l) => {
      if (l.state?.trim()) set.add(l.state.trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [locations]);

  const openCreate = () => {
    setEditing('new');
    setName('');
    setCity('');
    setState('');
    setError(null);
  };

  const openEdit = (loc: LocationItem) => {
    setEditing(loc);
    setName(loc.name);
    setCity(loc.city || '');
    setState(loc.state || '');
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('O nome do local precisa ter pelo menos 2 caracteres.');
      return;
    }

    const cleanState = state.trim().toUpperCase();
    if (cleanState && cleanState.length !== 2) {
      setError('O estado (UF) deve ter exatamente 2 letras (ex: SP).');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        city: city.trim() || null,
        state: cleanState || null,
      };

      if (editing === 'new') {
        await addLocation(payload);
      } else if (editing) {
        await editLocation(editing.id, payload);
      }
      setEditing(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar local.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing || editing === 'new') return;
    if (!window.confirm(`Excluir o local "${editing.name}"?`)) return;

    setIsSaving(true);
    setError(null);
    try {
      await removeLocation(editing.id);
      setEditing(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir local.');
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // SUB-TELA: CRIAR / EDITAR LOCAL
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
              Locais / Lugares
            </span>
            <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
              {isNew ? 'Novo Local' : 'Editar Local'}
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
              Nome do Estabelecimento *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Padaria Central, Posto Shell..."
              style={{ color: currentTheme.primaryText }}
              className="w-full text-sm font-semibold bg-transparent focus:outline-none"
              required
            />
          </div>

          {/* Cidade e Estado com Autocomplete */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <SuggestionInput
                label="Cidade"
                placeholder="Ex: Jacareí"
                value={city}
                onChange={setCity}
                suggestions={existingCities}
              />
            </div>

            <div className="col-span-1">
              <SuggestionInput
                label="Estado (UF)"
                placeholder="SP"
                value={state}
                onChange={setState}
                suggestions={existingStates}
                maxLength={2}
                uppercase
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            style={{ backgroundColor: currentTheme.primary, color: currentTheme.primaryText }}
            className="py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-50 mt-2"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
            {isNew ? 'Criar Local' : 'Salvar Alterações'}
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <Trash2 size={16} />
              Excluir Local
            </button>
          )}
        </form>
      </div>
    );
  }

  // ==========================================
  // TELA PRINCIPAL: LISTA DE LOCAIS
  // ==========================================
  const query = normalize(search.trim());
  const filteredList = locations.filter((loc) => {
    if (!query) return true;
    const searchable = normalize(`${loc.name} ${loc.city || ''} ${loc.state || ''}`);
    return searchable.includes(query);
  });

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
              Locais / Lugares
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

      {/* Barra de Pesquisa Unificada (Nome, Cidade ou Estado) */}
      <div
        style={{ backgroundColor: currentTheme.bgCard }}
        className="px-3.5 py-2.5 rounded-xl flex items-center gap-2.5"
      >
        <Search size={16} style={{ color: currentTheme.secondaryText }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, cidade ou estado..."
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
          Nenhum local encontrado.
        </p>
      ) : (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="rounded-2xl overflow-hidden divide-y divide-white/5"
        >
          {filteredList.map((loc) => {
            const locationMeta = [loc.city, loc.state].filter(Boolean).join(' • ');
            return (
              <button
                key={loc.id}
                onClick={() => openEdit(loc)}
                className="w-full px-4 py-3.5 flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity"
              >
                <div className="text-left">
                  <span
                    style={{ color: currentTheme.primaryText }}
                    className="text-sm font-bold block"
                  >
                    {loc.name}
                  </span>
                  {locationMeta && (
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[11px] font-medium"
                    >
                      {locationMeta}
                    </span>
                  )}
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