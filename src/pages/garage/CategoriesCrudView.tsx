import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Search, Trash2, Check, Loader2, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DynamicIcon } from '../../components/DynamicIcon';
import { IconPicker } from '../../components/IconPicker';
import { ColorPicker } from '../../components/ColorPicker';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { getAppLocale } from '../../i18n';
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
  const { t, i18n } = useTranslation();
  const locale = getAppLocale(i18n.language);

  const {
    categories,
    isLoadingCatalogs,
    ensureCatalogsLoaded,
    addCategory,
    editCategory,
    removeCategory,
  } = useData();

  const [filterType, setFilterType] = useState<TransactionType>('EXPENSE');
  const [search, setSearch] = useState('');

  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [color, setColor] = useState('#10B981');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureCatalogsLoaded();
  }, [ensureCatalogsLoaded]);

  const openCreate = () => {
    setEditing('new');
    setConfirmDelete(false);
    setName('');
    setType(filterType);
    setColor(COLOR_PRESETS[0]);
    setMonthlyLimit('');
    setIcon('Tag');
    setError(null);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setConfirmDelete(false);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color || '#10B981');
    setMonthlyLimit(cat.monthly_limit ? String(cat.monthly_limit) : '');
    setIcon(cat.icon || 'Tag');
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError(t('common.minCharsError'));
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const parsedLimit = Number(monthlyLimit);
      const payload = {
        name: name.trim(),
        type,
        color,
        icon: icon || 'Tag',
        monthly_limit:
          type === 'EXPENSE' && monthlyLimit && parsedLimit > 0
            ? parsedLimit
            : null,
      };

      if (editing === 'new') {
        await addCategory(payload);
      } else if (editing) {
        await editCategory(editing.id, payload);
      }
      setEditing(null);
    } catch (err: any) {
      setError(err.message || t('garage.categoriesCrud.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing || editing === 'new') return;

    setIsSaving(true);
    setError(null);
    try {
      await removeCategory(editing.id);
      setEditing(null);
      setConfirmDelete(false);
    } catch (err: any) {
      setError(err.message || t('garage.categoriesCrud.deleteError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (editing !== null) {
    const isNew = editing === 'new';

    return (
      <div className="p-5 pb-10 max-w-md mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(null)}
            aria-label={t('common.back')}
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
              {t('garage.categories')}
            </span>
            <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
              {isNew ? t('garage.categoriesCrud.newTitle') : t('garage.categoriesCrud.editTitle')}
            </h2>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500 text-red-200 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
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
              {t('garage.categoriesCrud.expenseType')}
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
              {t('garage.categoriesCrud.incomeType')}
            </button>
          </div>

          <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
            <label
              style={{ color: currentTheme.secondaryText }}
              className="text-[10px] font-bold uppercase block mb-1"
            >
              {t('garage.categoriesCrud.nameLabel')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('garage.categoriesCrud.namePlaceholder')}
              style={{ color: currentTheme.primaryText }}
              className="w-full text-sm font-semibold bg-transparent focus:outline-none"
              required
            />
          </div>

          {type === 'EXPENSE' && (
            <div style={{ backgroundColor: currentTheme.bgCard }} className="p-3.5 rounded-xl">
              <label
                style={{ color: currentTheme.secondaryText }}
                className="text-[10px] font-bold uppercase block mb-1"
              >
                {t('garage.categoriesCrud.monthlyLimitLabel')}
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder={t('garage.categoriesCrud.monthlyLimitPlaceholder')}
                style={{ color: currentTheme.primaryText }}
                className="w-full text-sm font-semibold bg-transparent focus:outline-none"
              />
            </div>
          )}

          <ColorPicker value={color} onChange={setColor} presets={COLOR_PRESETS} />

          <IconPicker value={icon} color={color} onChange={setIcon} />

          <button
            type="submit"
            disabled={isSaving}
            style={{ backgroundColor: currentTheme.primary, color: currentTheme.primaryText }}
            className="py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-50 mt-2"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
            {isNew ? t('garage.categoriesCrud.createBtn') : t('common.saveChanges')}
          </button>

          {!isNew && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={isSaving}
              className="py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <Trash2 size={16} />
              {t('garage.categoriesCrud.deleteBtn')}
            </button>
          )}

          {!isNew && confirmDelete && (
            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 flex flex-col gap-3">
              <div className="text-center">
                <p className="text-xs font-black uppercase text-red-300">
                  {t('common.confirmDeleteTitle')}
                </p>
                <p className="text-xs text-red-200/80 mt-0.5">
                  {t('common.confirmDeleteMessage', { name: editing.name })}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isSaving}
                  style={{ backgroundColor: currentTheme.bgCard, color: currentTheme.primaryText }}
                  className="py-2.5 rounded-xl text-xs font-bold uppercase cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="py-2.5 rounded-xl text-xs font-black uppercase bg-red-500 text-white cursor-pointer disabled:opacity-50"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    );
  }

  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredList = categories.filter(
    (c) => c.type === filterType && normalize(c.name).includes(normalize(search))
  );

  return (
    <div className="p-5 pb-10 max-w-md mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label={t('common.back')}
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
              {t('garage.catalogsSection')}
            </span>
            <h2 style={{ color: currentTheme.primaryText }} className="text-lg font-black uppercase">
              {t('garage.categories')}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          style={{ backgroundColor: currentTheme.primary, color: currentTheme.primaryText }}
          className="px-3.5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
        >
          <Plus size={16} strokeWidth={3} />
          {t('common.newFem')}
        </button>
      </div>

      <div
        style={{ backgroundColor: currentTheme.bgCard }}
        className="grid grid-cols-2 p-1 rounded-xl"
      >
        <button
          type="button"
          onClick={() => setFilterType('EXPENSE')}
          style={{
            backgroundColor: filterType === 'EXPENSE' ? currentTheme.primary : 'transparent',
            color: filterType === 'EXPENSE' ? currentTheme.primaryText : currentTheme.secondaryText,
          }}
          className="py-2 rounded-lg font-black text-xs uppercase cursor-pointer"
        >
          {t('garage.categoriesCrud.expensesTab')}
        </button>
        <button
          type="button"
          onClick={() => setFilterType('INCOME')}
          style={{
            backgroundColor: filterType === 'INCOME' ? '#10B981' : 'transparent',
            color: filterType === 'INCOME' ? '#FFFFFF' : currentTheme.secondaryText,
          }}
          className="py-2 rounded-lg font-black text-xs uppercase cursor-pointer"
        >
          {t('garage.categoriesCrud.incomesTab')}
        </button>
      </div>

      <div
        style={{ backgroundColor: currentTheme.bgCard }}
        className="px-3.5 py-2.5 rounded-xl flex items-center gap-2.5"
      >
        <Search size={16} style={{ color: currentTheme.secondaryText }} className="shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('garage.categoriesCrud.searchPlaceholder')}
          style={{ color: currentTheme.primaryText }}
          className="w-full text-sm font-medium bg-transparent focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label={t('common.clearSearch')}
            style={{ color: currentTheme.secondaryText }}
            className="cursor-pointer p-0.5"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {isLoadingCatalogs ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="animate-spin" size={28} style={{ color: currentTheme.primary }} />
        </div>
      ) : filteredList.length === 0 ? (
        <p style={{ color: currentTheme.secondaryText }} className="text-center text-xs py-10">
          {t('garage.categoriesCrud.empty')}
        </p>
      ) : (
        <div
          style={{ backgroundColor: currentTheme.bgCard }}
          className="rounded-2xl overflow-hidden divide-y divide-white/5"
        >
          {filteredList.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => openEdit(cat)}
              className="w-full p-4 flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  style={{
                    backgroundColor: `${cat.color || '#10B981'}25`,
                    color: cat.color || '#10B981',
                  }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                >
                  <DynamicIcon name={cat.icon} size={18} />
                </div>
                <div className="text-left min-w-0">
                  <span
                    style={{ color: currentTheme.primaryText }}
                    className="text-sm font-bold block truncate"
                  >
                    {cat.name}
                  </span>
                  {cat.monthly_limit && (
                    <span
                      style={{ color: currentTheme.secondaryText }}
                      className="text-[11px] font-medium block truncate"
                    >
                      {t('garage.categoriesCrud.monthlyLimitBadge', {
                        value: Number(cat.monthly_limit).toLocaleString(locale, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }),
                      })}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight
                size={18}
                style={{ color: currentTheme.secondaryText }}
                className="shrink-0"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}