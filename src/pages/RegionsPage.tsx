// src/pages/RegionsPage.tsx
import React, { useMemo, useState } from 'react';
import {
  useRegionsList,
  useCreateRegion,
  useUpdateRegion,
  useDeleteRegion,
  useUploadCoverImage,
  useUploadHeroImage,
  type Region,
  type RegionWhatToExpectItem,
  type RegionFaqItem,
  type RegionCtaStat,
} from '../hooks/regions';

type FormMode = 'create' | 'edit';

type RegionFormState = {
  id?: string;
  name: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;

  tagsText: string;

  coverImagePath: string | null;
  heroImagePath: string | null;
  coverFile?: File | null;
  heroFile?: File | null;
  coverPreviewUrl?: string | null;
  heroPreviewUrl?: string | null;

  whatToExpectTitle: string;
  whatToExpectIntro: string;
  whatToExpectItems: RegionWhatToExpectItem[];

  faqItems: RegionFaqItem[];

  quickLinksTipTitle: string;
  quickLinksTipText: string;

  ctaTitle: string;
  ctaText: string;
  ctaButtonLabel: string;
  ctaButtonUrl: string;
  ctaStats: RegionCtaStat[];
};

const emptyForm: RegionFormState = {
  name: '',
  slug: '',
  title: '',
  subtitle: '',
  description: '',
  tagsText: '',

  coverImagePath: null,
  heroImagePath: null,
  coverFile: null,
  heroFile: null,
  coverPreviewUrl: null,
  heroPreviewUrl: null,

  whatToExpectTitle: 'Що очікувати',
  whatToExpectIntro: '',
  whatToExpectItems: [],

  faqItems: [],

  quickLinksTipTitle: '',
  quickLinksTipText: '',

  ctaTitle: '',
  ctaText: '',
  ctaButtonLabel: '',
  ctaButtonUrl: '',
  ctaStats: [],
};

const API_URL = import.meta.env.VITE_API_URL;
const IMAGE_BASE_URL = `${API_URL}/static`; // підкоригуєш під себе

export default function RegionsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [form, setForm] = useState<RegionFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError } = useRegionsList({
    search: debouncedSearch,
    page,
    pageSize,
  });

  const createMutation = useCreateRegion();
  const updateMutation = useUpdateRegion();
  const deleteMutation = useDeleteRegion();
  const uploadCoverMutation = useUploadCoverImage();
  const uploadHeroMutation = useUploadHeroImage();

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

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

  function openEdit(region: Region) {
    setFormMode('edit');
    setForm({
      id: region.id,
      name: region.name,
      slug: region.slug,
      title: region.title,
      subtitle: region.subtitle,
      description: region.description,
      tagsText: region.tags.join(', '),

      coverImagePath: region.coverImagePath,
      heroImagePath: region.heroImagePath,
      coverFile: null,
      heroFile: null,
      coverPreviewUrl: null,
      heroPreviewUrl: null,

      whatToExpectTitle: region.whatToExpectTitle,
      whatToExpectIntro: region.whatToExpectIntro,
      whatToExpectItems: region.whatToExpectItems ?? [],

      faqItems: region.faq ?? [],

      quickLinksTipTitle: region.quickLinksTipTitle ?? '',
      quickLinksTipText: region.quickLinksTipText ?? '',

      ctaTitle: region.ctaTitle ?? '',
      ctaText: region.ctaText ?? '',
      ctaButtonLabel: region.ctaButtonLabel ?? '',
      ctaButtonUrl: region.ctaButtonUrl ?? '',
      ctaStats: region.ctaStats ?? [],
    });
    setFormError(null);
    setIsPanelOpen(true);
  }

  async function handleDelete(id: string) {
    const ok = window.confirm('Ви впевнені, що хочете видалити цей регіон?');
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (e: any) {
      alert(e?.message || 'Помилка при видаленні');
    }
  }

  function onChangeField<K extends keyof RegionFormState>(
    key: K,
    value: RegionFormState[K],
  ) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function setCoverFile(file: File | null) {
    if (!file) {
      setForm(prev => ({
        ...prev,
        coverFile: null,
        coverPreviewUrl: null,
      }));
      return;
    }
    const url = URL.createObjectURL(file);
    setForm(prev => ({
      ...prev,
      coverFile: file,
      coverPreviewUrl: url,
    }));
  }

  function setHeroFile(file: File | null) {
    if (!file) {
      setForm(prev => ({
        ...prev,
        heroFile: null,
        heroPreviewUrl: null,
      }));
      return;
    }
    const url = URL.createObjectURL(file);
    setForm(prev => ({
      ...prev,
      heroFile: file,
      heroPreviewUrl: url,
    }));
  }

  async function uploadImagesIfNeeded(regionId: string) {
    let coverPath = form.coverImagePath;
    let heroPath = form.heroImagePath;

    if (form.coverFile) {
      const { path } = await uploadCoverMutation.mutateAsync({
        id: regionId,
        file: form.coverFile,
      });
      coverPath = path;
      await updateMutation.mutateAsync({
        id: regionId,
        data: { /* тільки path, інше вже оновлене */ },
      });
    }

    if (form.heroFile) {
      const { path } = await uploadHeroMutation.mutateAsync({
        id: regionId,
        file: form.heroFile,
      });
      heroPath = path;
      await updateMutation.mutateAsync({
        id: regionId,
        data: { /* тільки path, інше вже оновлене */ },
      });
    }

    return { coverPath, heroPath };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const tags =
      form.tagsText
        .split(',')
        .map(t => t.trim())
        .filter(Boolean) || [];

    try {
      if (formMode === 'create') {
        // 1) створюємо регіон без картинок
        const created = await createMutation.mutateAsync({
          name: form.name.trim(),
          slug: form.slug.trim(),
          title: (form.title || form.name).trim(),
          subtitle: form.subtitle.trim(),
          description: form.description.trim(),
          tags,
          whatToExpectTitle:
            form.whatToExpectTitle.trim() || 'Що очікувати',
          whatToExpectIntro: form.whatToExpectIntro.trim(),
          whatToExpectItems: form.whatToExpectItems,
          faq: form.faqItems,
          quickLinksTipTitle: form.quickLinksTipTitle.trim() || null,
          quickLinksTipText: form.quickLinksTipText.trim() || null,
          ctaTitle: form.ctaTitle.trim() || null,
          ctaText: form.ctaText.trim() || null,
          ctaButtonLabel: form.ctaButtonLabel.trim() || null,
          ctaButtonUrl: form.ctaButtonUrl.trim() || null,
          ctaStats: form.ctaStats,
        });

        const regionId = created.id;

        // 2) якщо є файли — вантажимо
        if (form.coverFile || form.heroFile) {
          await uploadImagesIfNeeded(regionId);
        }
      } else if (formMode === 'edit' && form.id) {
        // 1) оновлюємо текстові поля
        await updateMutation.mutateAsync({
          id: form.id,
          data: {
            name: form.name.trim(),
            slug: form.slug.trim(),
            title: (form.title || form.name).trim(),
            subtitle: form.subtitle.trim(),
            description: form.description.trim(),
            tags,
            whatToExpectTitle:
              form.whatToExpectTitle.trim() || 'Що очікувати',
            whatToExpectIntro: form.whatToExpectIntro.trim(),
            whatToExpectItems: form.whatToExpectItems,
            faq: form.faqItems,
            quickLinksTipTitle: form.quickLinksTipTitle.trim() || null,
            quickLinksTipText: form.quickLinksTipText.trim() || null,
            ctaTitle: form.ctaTitle.trim() || null,
            ctaText: form.ctaText.trim() || null,
            ctaButtonLabel: form.ctaButtonLabel.trim() || null,
            ctaButtonUrl: form.ctaButtonUrl.trim() || null,
            ctaStats: form.ctaStats,
          },
        });

        // 2) аплоадимо картинки
        await uploadImagesIfNeeded(form.id);
      }

      setIsPanelOpen(false);
      setForm(emptyForm);
    } catch (e: any) {
      setFormError(e?.message || 'Сталася помилка при збереженні');
    }
  }

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadCoverMutation.isPending ||
    uploadHeroMutation.isPending;

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">
              Регіони Карпат
            </h1>
            <p className="text-xs text-zinc-500">
              Керування регіонами для публічної сторінки /regions та сторінок
              регіону.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
          >
            <span className="text-lg leading-none">+</span>
            Додати регіон
          </button>
        </div>

        {/* Search + meta */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Пошук по назві або slug..."
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
              Всього:{' '}
              <span className="font-medium text-zinc-800">{data.total}</span>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="min-h-[240px] overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Subtitle</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3 text-right">Дії</th>
              </tr>
              </thead>
              <tbody>
              {isLoading && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-zinc-500"
                    colSpan={5}
                  >
                    Завантаження…
                  </td>
                </tr>
              )}
              {isError && !isLoading && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-rose-600"
                    colSpan={5}
                  >
                    Помилка при завантаженні регіонів
                  </td>
                </tr>
              )}
              {!isLoading && !isError && data?.items?.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-zinc-500"
                    colSpan={5}
                  >
                    Поки що немає жодного регіону. Додайте перший 🙂
                  </td>
                </tr>
              )}
              {data?.items?.map(region => (
                <tr
                  key={region.id}
                  className="border-t border-zinc-100 hover:bg-zinc-50/60"
                >
                  <td className="px-4 py-2 text-sm font-medium text-zinc-900">
                    {region.name}
                  </td>
                  <td className="px-4 py-2 text-xs font-mono text-zinc-700">
                    {region.slug}
                  </td>
                  <td className="px-4 py-2 text-xs text-zinc-600">
                    {region.subtitle}
                  </td>
                  <td className="px-4 py-2 text-xs text-zinc-500">
                    {region.tags.length ? (
                      region.tags.join(', ')
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-xs">
                    <button
                      onClick={() => openEdit(region)}
                      className="mr-2 rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Редагувати
                    </button>
                    <button
                      onClick={() => handleDelete(region.id)}
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
                <span className="font-semibold text-zinc-900">{data.page}</span>{' '}
                з{' '}
                <span className="font-semibold text-zinc-900">
                  {totalPages}
                </span>
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
            <div className="h-full w-full max-w-5xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {formMode === 'create'
                      ? 'Новий регіон'
                      : 'Редагування регіону'}
                  </div>
                  <div className="text-sm font-semibold text-zinc-900">
                    {formMode === 'create'
                      ? 'Створити Region'
                      : form.name || form.slug}
                  </div>
                </div>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200"
                >
                  Закрити
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid h-[calc(100%-48px)] grid-cols-1 gap-6 overflow-y-auto px-4 py-4 lg:grid-cols-2"
              >
                {formError && (
                  <div className="col-span-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {formError}
                  </div>
                )}

                {/* Основна інформація */}
                <section className="space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Основна інформація
                  </h2>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">
                      Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => onChangeField('name', e.target.value)}
                      required
                      className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500"
                      placeholder="Славське"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={e => onChangeField('slug', e.target.value)}
                      required
                      className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500"
                      placeholder="slavske"
                    />
                    <p className="text-[11px] text-zinc-500">
                      Використовується в URL: <code>/regions/slavske</code>.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">
                      Title (hero)
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => onChangeField('title', e.target.value)}
                      className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500"
                      placeholder="Регіон для катання та SPA"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={form.subtitle}
                      onChange={e =>
                        onChangeField('subtitle', e.target.value)
                      }
                      className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500"
                      placeholder="Короткий опис у hero та картці"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">
                      Description (tab "Опис")
                    </label>
                    <textarea
                      value={form.description}
                      onChange={e =>
                        onChangeField('description', e.target.value)
                      }
                      rows={6}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-800 outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={form.tagsText}
                      onChange={e =>
                        onChangeField('tagsText', e.target.value)
                      }
                      className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500"
                      placeholder="ski, spa, river, family..."
                    />
                    <p className="text-[11px] text-zinc-500">
                      Теги для фільтрів на сторінці /regions.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ImageUploadField
                      label="Cover image"
                      description="Верхній фон на сторінці /regions та картках."
                      imageUrl={
                        form.coverPreviewUrl ??
                        (form.coverImagePath
                          ? `${IMAGE_BASE_URL}/${form.coverImagePath}`
                          : undefined)
                      }
                      onFileSelected={setCoverFile}
                    />
                    <ImageUploadField
                      label="Hero image"
                      description="Широка картинка на сторінці регіону."
                      imageUrl={
                        form.heroPreviewUrl ??
                        (form.heroImagePath
                          ? `${IMAGE_BASE_URL}/${form.heroImagePath}`
                          : undefined)
                      }
                      onFileSelected={setHeroFile}
                    />
                  </div>
                </section>

                {/* Контент сторінки */}
                <section className="space-y-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Контент сторінки
                  </h2>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">
                      "Що очікувати" — заголовок
                    </label>
                    <input
                      type="text"
                      value={form.whatToExpectTitle}
                      onChange={e =>
                        onChangeField('whatToExpectTitle', e.target.value)
                      }
                      className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">
                      "Що очікувати" — інтро
                    </label>
                    <textarea
                      value={form.whatToExpectIntro}
                      onChange={e =>
                        onChangeField('whatToExpectIntro', e.target.value)
                      }
                      rows={3}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-800 outline-none focus:border-zinc-500"
                    />
                  </div>

                  <WhatToExpectEditor
                    items={form.whatToExpectItems}
                    onChange={items =>
                      onChangeField('whatToExpectItems', items)
                    }
                  />

                  <FaqEditor
                    items={form.faqItems}
                    onChange={items => onChangeField('faqItems', items)}
                  />

                  <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3">
                    <h3 className="text-xs font-semibold text-zinc-700">
                      Порада (правий блок)
                    </h3>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700">
                        Заголовок
                      </label>
                      <input
                        type="text"
                        value={form.quickLinksTipTitle}
                        onChange={e =>
                          onChangeField(
                            'quickLinksTipTitle',
                            e.target.value,
                          )
                        }
                        className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500"
                        placeholder="Порада"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700">
                        Текст
                      </label>
                      <textarea
                        value={form.quickLinksTipText}
                        onChange={e =>
                          onChangeField(
                            'quickLinksTipText',
                            e.target.value,
                          )
                        }
                        rows={3}
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-800 outline-none focus:border-zinc-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
                    <h3 className="text-xs font-semibold text-zinc-700">
                      CTA блок (низ сторінки)
                    </h3>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700">
                        Заголовок
                      </label>
                      <input
                        type="text"
                        value={form.ctaTitle}
                        onChange={e =>
                          onChangeField('ctaTitle', e.target.value)
                        }
                        className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500"
                        placeholder="Готові обрати хатинку у Славське?"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700">
                        Текст
                      </label>
                      <textarea
                        value={form.ctaText}
                        onChange={e =>
                          onChangeField('ctaText', e.target.value)
                        }
                        rows={3}
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-800 outline-none focus:border-zinc-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700">
                        Текст кнопки
                      </label>
                      <input
                        type="text"
                        value={form.ctaButtonLabel}
                        onChange={e =>
                          onChangeField(
                            'ctaButtonLabel',
                            e.target.value,
                          )
                        }
                        className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500"
                        placeholder="Дивитись пропозиції"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700">
                        URL кнопки
                      </label>
                      <input
                        type="text"
                        value={form.ctaButtonUrl}
                        onChange={e =>
                          onChangeField('ctaButtonUrl', e.target.value)
                        }
                        className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500"
                        placeholder="/search?region=slavske"
                      />
                    </div>

                    <CtaStatsEditor
                      stats={form.ctaStats}
                      onChange={stats => onChangeField('ctaStats', stats)}
                    />
                  </div>
                </section>

                <div className="col-span-2 flex justify-end gap-2 border-t border-zinc-200 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsPanelOpen(false)}
                    className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
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

/* ---------------------------------- */
/*  Допоміжні компоненти              */
/* ---------------------------------- */

type ImageUploadFieldProps = {
  label: string;
  description?: string;
  imageUrl?: string;
  onFileSelected: (file: File | null) => void;
};

function ImageUploadField({
                            label,
                            description,
                            imageUrl,
                            onFileSelected,
                          }: ImageUploadFieldProps) {
  const [hovered, setHovered] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-zinc-700">{label}</label>
      <div
        className={`relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border text-xs ${
          hovered ? 'border-zinc-400' : 'border-dashed border-zinc-300'
        } bg-zinc-50`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
          onChange={handleChange}
        />
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={label}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-zinc-500">
            <span className="text-lg">📷</span>
            <span>Натисніть, щоб вибрати зображення</span>
          </div>
        )}
      </div>
      {description && (
        <p className="text-[11px] text-zinc-500">{description}</p>
      )}
    </div>
  );
}

type WhatToExpectEditorProps = {
  items: RegionWhatToExpectItem[];
  onChange: (items: RegionWhatToExpectItem[]) => void;
};

function WhatToExpectEditor({
                              items,
                              onChange,
                            }: WhatToExpectEditorProps) {
  function updateItem(idx: number, patch: Partial<RegionWhatToExpectItem>) {
    const next = items.map((it, i) =>
      i === idx ? { ...it, ...patch } : it,
    );
    onChange(next);
  }

  function addItem() {
    onChange([
      ...items,
      { title: 'Новий блок', body: '' },
    ]);
  }

  function removeItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-700">
          Блоки "Що очікувати"
        </h3>
        <button
          type="button"
          onClick={addItem}
          className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Додати блок
        </button>
      </div>
      {items.length === 0 && (
        <p className="text-[11px] text-zinc-500">
          Додайте 3–4 блоки: Сезонність, Як дістатися, Для кого, Прокат /
          школи…
        </p>
      )}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="space-y-2 rounded-xl border border-zinc-200 bg-white p-2"
          >
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={item.title}
                onChange={e =>
                  updateItem(idx, { title: e.target.value })
                }
                className="h-8 flex-1 rounded-lg border border-zinc-300 px-2 text-xs text-zinc-800 outline-none focus:border-zinc-500"
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] text-zinc-500 hover:bg-zinc-100"
              >
                Видалити
              </button>
            </div>
            <textarea
              value={item.body}
              onChange={e =>
                updateItem(idx, { body: e.target.value })
              }
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-800 outline-none focus:border-zinc-500"
              placeholder="Короткий текст для цього блоку…"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type FaqEditorProps = {
  items: RegionFaqItem[];
  onChange: (items: RegionFaqItem[]) => void;
};

function FaqEditor({ items, onChange }: FaqEditorProps) {
  function updateItem(idx: number, patch: Partial<RegionFaqItem>) {
    const next = items.map((it, i) =>
      i === idx ? { ...it, ...patch } : it,
    );
    onChange(next);
  }

  function addItem() {
    onChange([
      ...items,
      { question: 'Нове запитання', answer: '' },
    ]);
  }

  function removeItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-700">FAQ</h3>
        <button
          type="button"
          onClick={addItem}
          className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Додати FAQ
        </button>
      </div>
      {items.length === 0 && (
        <p className="text-[11px] text-zinc-500">
          Додайте 3–6 запитань, які часто задають по регіону.
        </p>
      )}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="space-y-2 rounded-xl border border-zinc-200 bg-white p-2"
          >
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={item.question}
                onChange={e =>
                  updateItem(idx, { question: e.target.value })
                }
                className="h-8 flex-1 rounded-lg border border-zinc-300 px-2 text-xs text-zinc-800 outline-none focus:border-zinc-500"
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] text-zinc-500 hover:bg-zinc-100"
              >
                Видалити
              </button>
            </div>
            <textarea
              value={item.answer}
              onChange={e =>
                updateItem(idx, { answer: e.target.value })
              }
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-800 outline-none focus:border-zinc-500"
              placeholder="Відповідь…"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type CtaStatsEditorProps = {
  stats: RegionCtaStat[];
  onChange: (stats: RegionCtaStat[]) => void;
};

function CtaStatsEditor({ stats, onChange }: CtaStatsEditorProps) {
  function updateStat(idx: number, patch: Partial<RegionCtaStat>) {
    const next = stats.map((s, i) =>
      i === idx ? { ...s, ...patch } : s,
    );
    onChange(next);
  }

  function addStat() {
    onChange([...stats, { label: '+100', caption: 'Хатинок' }]);
  }

  function removeStat(idx: number) {
    onChange(stats.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-zinc-700">
          CTA статистика
        </h4>
        <button
          type="button"
          onClick={addStat}
          className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
        >
          Додати показник
        </button>
      </div>
      {stats.length === 0 && (
        <p className="text-[11px] text-zinc-600">
          Наприклад: <code>+130</code> — Хатинок, <code>+70</code> —
          Готелів.
        </p>
      )}
      <div className="space-y-2">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-2 py-2"
          >
            <input
              type="text"
              value={stat.label}
              onChange={e =>
                updateStat(idx, { label: e.target.value })
              }
              className="h-8 w-20 rounded-lg border border-emerald-200 px-2 text-xs text-zinc-800 outline-none focus:border-emerald-400"
            />
            <input
              type="text"
              value={stat.caption}
              onChange={e =>
                updateStat(idx, { caption: e.target.value })
              }
              className="h-8 flex-1 rounded-lg border border-emerald-200 px-2 text-xs text-zinc-800 outline-none focus:border-emerald-400"
            />
            <button
              type="button"
              onClick={() => removeStat(idx)}
              className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] text-rose-500 hover:bg-rose-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
