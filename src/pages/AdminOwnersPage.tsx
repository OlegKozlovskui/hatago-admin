import  { useMemo, useState } from 'react';
import { useAdminOwnersList, type AdminOwner } from '../hooks/owners';

const pageSize = 20;

export default function AdminOwnersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useAdminOwnersList({
    search: debouncedSearch,
    page,
    pageSize,
  });

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

  function statusPill(isDeleted: boolean) {
    return isDeleted ? (
      <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
        User deleted
      </span>
    ) : (
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        Active
      </span>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Owners</h1>
            <p className="text-xs text-zinc-500">
              Профілі власників (OwnerProfile) + кількість обʼєктів.
            </p>
          </div>
        </div>

        {/* Search + meta */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Пошук по email / name / phone..."
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
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Properties</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Дії</th>
              </tr>
              </thead>

              <tbody>
              {isLoading && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-zinc-500" colSpan={5}>
                    Завантаження…
                  </td>
                </tr>
              )}

              {isError && !isLoading && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-rose-600" colSpan={5}>
                    Помилка при завантаженні owners{error?.message ? `: ${error.message}` : ''}
                  </td>
                </tr>
              )}

              {!isLoading && !isError && data?.items?.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-zinc-500" colSpan={5}>
                    Нічого не знайдено.
                  </td>
                </tr>
              )}

              {data?.items?.map((o: AdminOwner) => {
                const userDeleted = !!o.user.deletedAt;

                return (
                  <tr key={o.id} className="border-t border-zinc-100 hover:bg-zinc-50/60">
                    <td className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-900">{o.user.email}</span>
                        <span className="text-xs text-zinc-500">
                            {o.user.name ?? <span className="text-zinc-400">—</span>}
                          </span>
                      </div>
                    </td>

                    <td className="px-4 py-2 text-sm text-zinc-700">
                      {o.phone ? (
                        <span className="font-mono text-xs text-zinc-700">{o.phone}</span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-2 text-xs text-zinc-700">
                      <div className="flex flex-wrap gap-1">
                        {badge(`properties: ${o.propertiesCount}`)}
                      </div>
                    </td>

                    <td className="px-4 py-2 text-xs">{statusPill(userDeleted)}</td>

                    <td className="px-4 py-2 text-right text-xs">
                      {/* залишаємо місце під future дії:
                            - View properties
                            - Block owner
                            - Edit phone / contacts
                        */}
                      <button
                        disabled
                        className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-500 opacity-70"
                        title="Пізніше додамо сторінку обʼєктів власника"
                      >
                        View properties
                      </button>
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
