export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm shadow-zinc-200">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-zinc-900">
            HataGo Admin
          </h1>
          <p className="text-xs text-zinc-500">
            Внутрішня панель. Доступ тільки для адміністраторів.
          </p>
        </div>

        <button className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-50">
          Увійти як admin (stub)
        </button>

        <p className="mt-4 text-xs text-zinc-500">
          Тут потім зробимо: або окремий admin-login, або використання того ж
          Google OAuth з перевіркою role === ADMIN.
        </p>
      </div>
    </div>
  );
}
