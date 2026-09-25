/**
 * TabCalidad.jsx
 * ---------------------------------------------------------------------------
 * Vista de "Calidad de la potencia" del medidor: muestra indicadores de
 * calidad eléctrica agrupados por categoría (THD de Tensión, THD de
 * Corriente, Factor de potencia y Desbalance).
 *
 * Rol en el sistema:
 * A diferencia de TabInstantaneos/TabValores5M/TabConsumos, esta vista es
 * de solo lectura: no incluye casillas de selección por medida ni el
 * checkbox "Seleccionar todos" (así se definió explícitamente para este
 * apartado); únicamente presenta los valores y un botón "Solicitar" para
 * refrescarlos.
 *
 * Integración con el WebService (calidad de la potencia):
 * CATEGORIAS contiene datos de ejemplo (todos en "0.00"). En producción,
 * estos valores deberán poblarse con la respuesta del método del WebService
 * que calcula/lee los indicadores de calidad de la potencia del medidor
 * (por ejemplo, LeerCalidadPotencia), disparado al presionar "Solicitar".
 */

// Catálogo de indicadores de calidad de la potencia, agrupados por categoría.
const CATEGORIAS = [
  {
    id: 'thd-tension',
    etiqueta: 'THD Tensión',
    medidas: [
      { id: 'thd-va', titulo: 'THD VA (%)', valor: '0.00' },
      { id: 'thd-vb', titulo: 'THD VB (%)', valor: '0.00' },
      { id: 'thd-vc', titulo: 'THD VC (%)', valor: '0.00' },
    ],
  },
  {
    id: 'thd-corriente',
    etiqueta: 'THD Corriente',
    medidas: [
      { id: 'thd-ia', titulo: 'THD IA (%)', valor: '0.00' },
      { id: 'thd-ib', titulo: 'THD IB (%)', valor: '0.00' },
      { id: 'thd-ic', titulo: 'THD IC (%)', valor: '0.00' },
    ],
  },
  {
    id: 'factor-potencia',
    etiqueta: 'Factor de potencia',
    medidas: [
      { id: 'fpa', titulo: 'FPA', valor: '0.00' },
      { id: 'fpb', titulo: 'FPB', valor: '0.00' },
      { id: 'fpc', titulo: 'FPC', valor: '0.00' },
    ],
  },
  {
    id: 'desbalance',
    etiqueta: 'Desbalance',
    medidas: [
      { id: 'desb-v', titulo: 'Desbalance V (%)', valor: '0.00' },
      { id: 'desb-i', titulo: 'Desbalance I (%)', valor: '0.00' },
    ],
  },
]

// Tarjeta de solo lectura para un indicador de calidad: título y valor,
// ambos centrados horizontalmente para mantener la consistencia visual
// entre todas las tarjetas de esta vista.
function DataTile({ titulo, valor }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="truncate text-center text-[11px] font-semibold uppercase tracking-wide text-gray-900">
        {titulo}
      </p>
      <p className="mt-2 text-center font-mono text-2xl font-semibold tracking-tight text-green-500 tabular-nums">
        {valor}
      </p>
    </div>
  )
}

// Columna que agrupa las tarjetas (DataTile) de una misma categoría
// (ej. todas las medidas de "THD Tensión") bajo un título común.
function CategoriaColumna({ titulo, medidas }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-900">{titulo}</h3>
      <div className="flex flex-col gap-4">
        {medidas.map((medida) => (
          <DataTile key={medida.id} titulo={medida.titulo} valor={medida.valor} />
        ))}
      </div>
    </div>
  )
}

function TabCalidad() {
  return (
    // Contenedor con scroll propio para acomodar todas las categorías de calidad.
    <div className="h-full overflow-auto bg-gray-50 p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Encabezado de la vista (título centrado; sin checkbox de selección
            masiva, a diferencia de Instantáneos/Valores 5M/Consumos). */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-center text-lg font-bold uppercase tracking-wide text-slate-900">
            Calidad de la potencia
          </h2>
        </div>

        {/* Grilla de columnas por categoría (THD Tensión, THD Corriente,
            Factor de potencia, Desbalance), responsiva de 1 a 4 columnas. */}
        <section className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {CATEGORIAS.map((categoria) => (
              <CategoriaColumna
                key={categoria.id}
                titulo={categoria.etiqueta}
                medidas={categoria.medidas}
              />
            ))}
          </div>
        </section>

        {/* Botón "Solicitar": estilo unificado con el resto de la aplicación.
            Pendiente de conectar con el WebService para refrescar los
            indicadores de calidad de la potencia mostrados arriba. */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            className="cursor-pointer rounded-lg bg-blue-600 px-8 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95"
          >
            Solicitar
          </button>
        </div>
      </div>
    </div>
  )
}

export default TabCalidad
