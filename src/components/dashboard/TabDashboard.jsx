/**
 * TabDashboard.jsx
 * ---------------------------------------------------------------------------
 * Vista principal del módulo "Dashboard": panel de indicadores clave (KPIs),
 * espacio reservado para una gráfica de tendencia y una tabla con los
 * últimos registros/eventos del logger del sistema.
 *
 * Rol en el sistema:
 * Es la pantalla de inicio tras autenticarse (activeItem === 'dashboard' en
 * App.jsx). Da al usuario una vista rápida del estado general del sistema
 * de medición sin necesidad de entrar a un medidor específico.
 *
 * Integración con el WebService:
 * Todos los datos (KPIS y REGISTROS) son de ejemplo/estáticos. En producción,
 * estos arrays deberán poblarse con datos reales obtenidos periódicamente del
 * WebService (por ejemplo, estado de comunicación, tensión/frecuencia
 * promedio y el historial de eventos del logger), probablemente mediante
 * polling o una suscripción en tiempo real.
 */

// Tarjetas de indicadores clave (KPIs) mostradas en la parte superior del dashboard.
// `dot` es opcional y agrega un punto de color (ej. verde = "En línea").
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
    valorClase: 'text-slate-800',
  },
]

// Registros/eventos recientes del logger, mostrados en la tabla inferior del dashboard.
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

// Mapa de clases de Tailwind según el estado del registro, usado por EstadoBadge.
const ESTADO_ESTILOS = {
  Resuelto: 'bg-emerald-50 text-emerald-600',
  Atendido: 'bg-amber-50 text-amber-600',
  OK: 'bg-slate-100 text-slate-600',
}

// Tarjeta individual de KPI: título + valor destacado, con un punto de color opcional.
function KpiCard({ titulo, valor, valorClase, dot }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-800">{titulo}</p>
      <p className={`mt-2 flex items-center gap-2 text-3xl font-semibold tracking-tight ${valorClase}`}>
        {dot && <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />}
        {valor}
      </p>
    </div>
  )
}

// Etiqueta/insignia de estado para cada fila de la tabla de registros
// (colores según ESTADO_ESTILOS; usa un estilo neutro si el estado no está mapeado).
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
        {/* Fila de tarjetas KPI, responsiva: 1 columna en móvil, hasta 4 en escritorio. */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((kpi) => (
            <KpiCard key={kpi.id} {...kpi} />
          ))}
        </div>

        {/* Espacio reservado para la gráfica de tendencia de Potencia Activa.
            Pendiente de integrar una librería de gráficas (ej. Recharts o Chart.js)
            alimentada con datos históricos provenientes del WebService. */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">
            Tendencia de Potencia Activa (kW) - Última Hora
          </h3>
          <div className="mt-4 flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-800">
            [ Espacio reservado para componente de Gráfica (Recharts/Chart.js) ]
          </div>
        </section>

        {/* Tabla con los últimos registros/eventos del logger del sistema. */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">
            Últimos registros del logger
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-800">
                    Hora
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-800">
                    Tipo
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-800">
                    Descripción
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-800">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {REGISTROS.map((registro) => (
                  <tr key={registro.hora}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-slate-800">
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
