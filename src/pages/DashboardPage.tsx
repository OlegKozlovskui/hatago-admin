export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">
          Огляд платформи
        </h2>
        <p className="text-sm text-zinc-500">
          Тут зʼявляться метрики: кількість обʼєктів, власників, бронювань,
          ревʼю, лідів тощо.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Активні обʼєкти</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">–</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Зареєстровані власники</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">–</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Ліди за останні 7 днів</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">–</div>
        </div>
      </div>
    </div>
  );
}
