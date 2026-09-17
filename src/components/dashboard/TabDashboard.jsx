const KPIS = [
  {
    id: 'estado',
    titulo: 'Estado de comunicación',
    valor: 'En línea',
    valorClase: 'text-emerald-500',
    dot: 'bg-emerald-500',
  },
  {
    id: 'tension',
    titulo: 'Tensión promedio',
    valor: '120.4 V',
    valorClase: 'text-slate-800',
  },
  {
    id: 'frecuencia',
    titulo: 'Frecuencia',
    valor: '60.01 Hz',
    valorClase: 'text-slate-800',
  },
  {
    id: 'alertas',
    titulo: 'Alertas activas',
    valor: '0',
    valorClase: 'text-slate-500',
  },
]

const REGISTROS = [
  {
    hora: '14:32:05',
    tipo: 'Evento',
    descripcion: 'Reconexión de comunicación SERIAL-COM3',
    estado: 'Resuelto',
  },
  {
    hora: '14:10:47',
    tipo: 'Alarma',
    descripcion: 'Caída de tensión en Fase B por debajo del umbral',
    estado: 'Atendido',
  },
  {
    hora: '13:58:12',
    tipo: 'Info',
    descripcion: 'Sincronización de reloj RTC completada',
    estado: 'OK',
  },
]

const ESTADO_ESTILOS = {
  Resuelto: 'bg-emerald-50 text-emerald-600',
  Atendido: 'bg-amber-50 text-amber-600',
  OK: 'bg-slate-100 text-slate-600',
}

function KpiCard({ titulo, valor, valorClase, dot }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className={`mt-2 flex items-center gap-2 text-3xl font-semibold tracking-tight ${valorClase}`}>
        {dot && <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />}
        {valor}
      </p>
    </div>
  )
}

function EstadoBadge({ estado }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ESTADO_ESTILOS[estado] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      {estado}
    </span>
  )
}

function TabDashboard() {
  return (
    <div className="h-full overflow-auto bg-slate-50 p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((kpi) => (
            <KpiCard key={kpi.id} {...kpi} />
          ))}
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">
            Tendencia de Potencia Activa (kW) - Última Hora
          </h3>
          <div className="mt-4 flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
            [ Espacio reservado para componente de Gráfica (Recharts/Chart.js) ]
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">
            Últimos registros del logger
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Hora
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tipo
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Descripción
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {REGISTROS.map((registro) => (
                  <tr key={registro.hora}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-slate-500">
                      {registro.hora}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                      {registro.tipo}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{registro.descripcion}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <EstadoBadge estado={registro.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default TabDashboard
