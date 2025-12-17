import React, { useMemo, useState } from 'react';
import { useAdminUsersList, useRestoreUser, useSoftDeleteUser, type AdminUser, type UserRole } from '../hooks/users';

const ROLE_OPTIONS: Array<{ value: UserRole | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Всі' },
  { value: 'USER', label: 'USER' },
  { value: 'OWNER', label: 'OWNER' },
  { value: 'ADMIN', label: 'ADMIN' },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState<UserRole | 'ALL'>('ALL');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isError } = useAdminUsersList({
    search: debouncedSearch,
    role: role === 'ALL' ? undefined : role,
    includeDeleted,
    page,
    pageSize,
  });

  const softDeleteMutation = useSoftDeleteUser();
  const restoreMutation = useRestoreUser();

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  function applySearch() {
    setPage(1);
    setDebouncedSearch(search.trim());
  }

  function badge(text: string) {
    return (
      <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
        {text}
      </span>
    );
  }

  async function handleSoftDelete(u: AdminUser) {
    const ok = window.confirm(`Soft delete юзера ${u.email}?`);
    if (!ok) return;
    await softDeleteMutation.mutateAsync(u.id);

    // якщо був останній елемент на сторінці — відкотись назад
    if (data && data.items.length === 1 && page > 1) setPage((p) => p - 1);
  }

  async function handleRestore(u: AdminUser) {
    const ok = window.confirm(`Відновити юзера ${u.email}?`);
    if (!ok) return;
    await restoreMutation.mutateAsync(u.id);
  }

  const isMutating = softDeleteMutation.isPending || restoreMutation.isPending;

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Users</h1>
            <p className="text-xs text-zinc-500">Список акаунтів, ролі, soft delete / restore.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Пошук по email або name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-full border border-zinc-300 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-zinc-500"
              />
            </div>
            <button
              onClick={applySearch}
              className="h-9 rounded-full border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Знайти
            </button>

            <select
              value={role}
              onChange={(e) => {
                setPage(1);
                setRole(e.target.value as any);
              }}
              className="h-9 rounded-full border border-zinc-300 bg-white px-3 text-xs text-zinc-800 outline-none focus:border-zinc-500"
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-2 text-xs text-zinc-700">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => {
                  setPage(1);
                  setIncludeDeleted(e.target.checked);
                }}
              />
              Показувати видалених
            </label>
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
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Props</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Дії</th>
              </tr>
              </thead>
              <tbody>
              {isLoading && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-zinc-500" colSpan={6}>
                    Завантаження…
                  </td>
                </tr>
              )}

              {isError && !isLoading && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-rose-600" colSpan={6}>
                    Помилка при завантаженні users
                  </td>
                </tr>
              )}

              {!isLoading && !isError && data?.items?.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-zinc-500" colSpan={6}>
                    Нічого не знайдено.
                  </td>
                </tr>
              )}

              {data?.items?.map((u) => {
                const isDeleted = !!u.deletedAt;

                return (
                  <tr key={u.id} className="border-t border-zinc-100 hover:bg-zinc-50/60">
                    <td className="px-4 py-2 text-sm text-zinc-900">{u.email}</td>
                    <td className="px-4 py-2 text-sm text-zinc-700">{u.name ?? <span className="text-zinc-400">—</span>}</td>
                    <td className="px-4 py-2 text-xs text-zinc-700">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <React.Fragment key={r}>{badge(r)}</React.Fragment>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs text-zinc-600">
                      <div className="flex flex-wrap gap-2">
                        {badge(`properties: ${u.propertiesCount}`)}
                        {badge(`leads: ${u.leadsCount}`)}
                        {u.isOwner ? badge('isOwner') : null}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {isDeleted ? (
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                            Deleted
                          </span>
                      ) : (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Active
                          </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-xs">
                      {!isDeleted ? (
                        <button
                          disabled={isMutating}
                          onClick={() => handleSoftDelete(u)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                        >
                          Soft delete
                        </button>
                      ) : (
                        <button
                          disabled={isMutating}
                          onClick={() => handleRestore(u)}
                          className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                        >
                          Restore
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs text-zinc-600">
              <div>
                Сторінка <span className="font-semibold text-zinc-900">{data.page}</span> з{' '}
                <span className="font-semibold text-zinc-900">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs disabled:opacity-50"
                >
                  Назад
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs disabled:opacity-50"
                >
                  Вперед
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
