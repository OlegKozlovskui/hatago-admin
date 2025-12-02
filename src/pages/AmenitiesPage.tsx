// pages/AdminAmenitiesPage.tsx
import React, { useMemo, useState } from 'react';
import {
  useAmenitiesList,
  useCreateAmenity,
  useUpdateAmenity,
  useDeleteAmenity, type Amenity,
} from '../hooks/amenities';

type FormMode = 'create' | 'edit';

type AmenityFormState = {
  id?: string;
  code: string;
  label: string;
  propsJson: string;
};

const emptyForm: AmenityFormState = {
  code: '',
  label: '',
  propsJson: '',
};

export default function AdminAmenitiesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [form, setForm] = useState<AmenityFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError } = useAmenitiesList({
    search: debouncedSearch,
    page,
    pageSize,
  });

  const createMutation = useCreateAmenity();
  const updateMutation = useUpdateAmenity();
  const deleteMutation = useDeleteAmenity();

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  // simple debounce by button (можна потім винести в хук)
  function applySearch() {
    setPage(1);
    setDebouncedSearch(search.trim());
  }

  function openCreate() {
    setFormMode('create');
    setForm(emptyForm);
    setFormError(null);
    setIsPanelOpen(true);
  }

  function openEdit(a: Amenity) {
    setFormMode('edit');
    setForm({
      id: a.id,
      code: a.code,
      label: a.label,
      propsJson: a.props ? JSON.stringify(a.props, null, 2) : '',
    });
    setFormError(null);
    setIsPanelOpen(true);
  }

  async function handleDelete(id: string) {
    const ok = window.confirm('Ви впевнені, що хочете видалити цю зручність?');
    if (!ok) return;
    await deleteMutation.mutateAsync(id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    let propsObj: Record<string, never> | undefined | null = undefined;
    if (form.propsJson.trim()) {
      try {
        propsObj = JSON.parse(form.propsJson);
      } catch {
        setFormError('props мають бути валідним JSON');
        return;
      }
    } else {
      propsObj = null;
    }

    try {
      if (formMode === 'create') {
        await createMutation.mutateAsync({
          code: form.code.trim(),
          label: form.label.trim(),
          props: propsObj ?? undefined,
        });
      } else if (formMode === 'edit' && form.id) {
        await updateMutation.mutateAsync({
          id: form.id,
          data: {
            code: form.code.trim(),
            label: form.label.trim(),
            props: propsObj,
          },
        });
      }
      setIsPanelOpen(false);
      setForm(emptyForm);
    } catch (e: any) {
      setFormError(e?.message || 'Сталася помилка');
    }
  }

  function onChangeField<K extends keyof AmenityFormState>(
    key: K,
    value: AmenityFormState[K],
  ) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">
              Зручності (Amenity)
            </h1>
            <p className="text-xs text-zinc-500">
              Список стандартних зручностей, які можна підʼєднувати до обʼєктів.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
          >
            <span className="text-lg leading-none">+</span>
            Додати зручність
          </button>
        </div>

        {/* Search + meta */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Пошук по коду або назві..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 w-full rounded-full border border-zinc-300 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500"
              />
            </div>
            <button
              onClick={applySearch}
              className="h-9 rounded-full border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Знайти
            </button>
          </div>
          {data && (
            <div className="text-xs text-zinc-500">
              Всього: <span className="font-medium text-zinc-800">{data.total}</span>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="min-h-[240px] overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Props</th>
                <th className="px-4 py-3 text-right">Дії</th>
              </tr>
              </thead>
              <tbody>
              {isLoading && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-zinc-500" colSpan={4}>
                    Завантаження…
                  </td>
                </tr>
              )}
              {isError && !isLoading && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-rose-600" colSpan={4}>
                    Помилка при завантаженні зручностей
                  </td>
                </tr>
              )}
              {!isLoading && !isError && data?.items?.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-zinc-500" colSpan={4}>
                    Поки що немає жодної зручності. Додайте першу 🙂
                  </td>
                </tr>
              )}
              {data?.items?.map(amenity => (
                <tr
                  key={amenity.id}
                  className="border-t border-zinc-100 hover:bg-zinc-50/60"
                >
                  <td className="px-4 py-2 text-xs font-mono text-zinc-700">
                    {amenity.code}
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-900">
                    {amenity.label}
                  </td>
                  <td className="px-4 py-2 text-xs text-zinc-500">
                    {amenity.props
                      ? `JSON (${Object.keys(amenity.props).length} полів)`
                      : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-2 text-right text-xs">
                    <button
                      onClick={() => openEdit(amenity)}
                      className="mr-2 rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Редагувати
                    </button>
                    <button
                      onClick={() => handleDelete(amenity.id)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                    >
                      Видалити
                    </button>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs text-zinc-600">
              <div>
                Сторінка{' '}
                <span className="font-semibold text-zinc-900">{data.page}</span> з{' '}
                <span className="font-semibold text-zinc-900">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs disabled:opacity-50"
                >
                  Назад
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs disabled:opacity-50"
                >
                  Вперед
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Slide-over / panel */}
        {isPanelOpen && (
          <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
            <div className="h-full w-full max-w-md bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {formMode === 'create' ? 'Нова зручність' : 'Редагування зручності'}
                  </div>
                  <div className="text-sm font-semibold text-zinc-900">
                    {formMode === 'create' ? 'Створити Amenity' : form.code || form.label}
                  </div>
                </div>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200"
                >
                  Закрити
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
                {formError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {formError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Code (унікальний)
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => onChangeField('code', e.target.value)}
                    required
                    className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500"
                    placeholder="wifi, sauna, hot_tub..."
                  />
                  <p className="text-[11px] text-zinc-500">
                    Використовується у фільтрах і при пошуку. Наприклад: <code>wifi</code>.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Label (відображення)
                  </label>
                  <input
                    type="text"
                    value={form.label}
                    onChange={e => onChangeField('label', e.target.value)}
                    required
                    className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500"
                    placeholder="Wi-Fi, Сауна, Джакузі..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Props (JSON, опціонально)
                  </label>
                  <textarea
                    value={form.propsJson}
                    onChange={e => onChangeField('propsJson', e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs font-mono text-zinc-800 outline-none focus:border-zinc-500"
                    placeholder={`Наприклад:
{
  "icon": "wifi",
  "group": "connectivity"
}`}
                  />
                  <p className="text-[11px] text-zinc-500">
                    Додаткові метадані — групи, іконки, майбутні фільтри. Можна залишити порожнім.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPanelOpen(false)}
                    className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {formMode === 'create' ? 'Створити' : 'Зберегти'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
