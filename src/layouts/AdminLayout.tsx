import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

type Props = {
  children: ReactNode;
};

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/users', label: 'Users' },
  { to: '/properties', label: 'Properties' },
  { to: '/owners', label: 'Owners' },
];

export default function AdminLayout({ children }: Props) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-zinc-100">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-zinc-200 bg-white/90">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white">
            HG
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-900">
              HataGo Admin
            </div>
            <div className="text-xs text-zinc-500">internal panel</div>
          </div>
        </div>
        <nav className="mt-2 flex-1 space-y-1 px-2">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  'flex items-center rounded-xl px-3 py-2 text-sm transition',
                  active
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-700 hover:bg-zinc-100',
                ].join(' ')}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-200 p-3 text-xs text-zinc-500">
          © {new Date().getFullYear()} HataGo
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white/70 px-4 py-3 backdrop-blur">
          <h1 className="text-sm font-semibold text-zinc-900">
            Admin dashboard
          </h1>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-zinc-500 sm:inline">
              {/** тут потім підставимо email adminʼа */}
              admin@hatago.app
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-4">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
