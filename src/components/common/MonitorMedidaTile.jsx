function MonitorMedidaTile({ titulo, valor, unidad }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md">
      <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {titulo}
      </span>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 rounded-md bg-gray-50 px-3 py-2.5">
          <span className="block truncate font-mono text-2xl font-semibold tracking-tight text-green-500 tabular-nums">
            {valor}
          </span>
        </div>

        <input
          type="checkbox"
          defaultChecked={false}
          aria-label={`Incluir ${titulo}`}
          className="h-3.5 w-3.5 cursor-pointer rounded-sm border-gray-300 accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      <div className="flex justify-end">
        <span className="text-[11px] font-medium text-gray-400">{unidad}</span>
      </div>
    </div>
  )
}

export default MonitorMedidaTile
