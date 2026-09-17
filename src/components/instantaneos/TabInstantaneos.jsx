import MonitorMedidaTile from '../common/MonitorMedidaTile'

const FASES = [
  {
    id: 'faseA',
    etiqueta: 'Fase A',
    medidas: [
      { id: 'va', titulo: 'VA (Fase A - RMS)', valor: '120.5', unidad: 'V' },
      { id: 'ia', titulo: 'IA (Fase A - RMS)', valor: '4.230', unidad: 'A' },
      { id: 'pa', titulo: 'Potencia activa A', valor: '0.510', unidad: 'kW' },
      { id: 'qa', titulo: 'Potencia reactiva A', valor: '0.120', unidad: 'kVAR' },
      { id: 'sa', titulo: 'Potencia aparente A', valor: '0.524', unidad: 'kVA' },
      { id: 'fpa', titulo: 'Factor de potencia A', valor: '0.973', unidad: '—' },
    ],
  },
  {
    id: 'faseB',
    etiqueta: 'Fase B',
    medidas: [
      { id: 'vb', titulo: 'VB (Fase B - RMS)', valor: '119.8', unidad: 'V' },
      { id: 'ib', titulo: 'IB (Fase B - RMS)', valor: '4.185', unidad: 'A' },
      { id: 'pb', titulo: 'Potencia activa B', valor: '0.501', unidad: 'kW' },
      { id: 'qb', titulo: 'Potencia reactiva B', valor: '0.115', unidad: 'kVAR' },
      { id: 'sb', titulo: 'Potencia aparente B', valor: '0.514', unidad: 'kVA' },
      { id: 'fpb', titulo: 'Factor de potencia B', valor: '0.975', unidad: '—' },
    ],
  },
  {
    id: 'faseC',
    etiqueta: 'Fase C',
    medidas: [
      { id: 'vc', titulo: 'VC (Fase C - RMS)', valor: '121.1', unidad: 'V' },
      { id: 'ic', titulo: 'IC (Fase C - RMS)', valor: '4.267', unidad: 'A' },
      { id: 'pc', titulo: 'Potencia activa C', valor: '0.517', unidad: 'kW' },
      { id: 'qc', titulo: 'Potencia reactiva C', valor: '0.122', unidad: 'kVAR' },
      { id: 'sc', titulo: 'Potencia aparente C', valor: '0.531', unidad: 'kVA' },
      { id: 'fpc', titulo: 'Factor de potencia C', valor: '0.972', unidad: '—' },
    ],
  },
  {
    id: 'promedios',
    etiqueta: 'Promedios',
    medidas: [
      { id: 'vprom', titulo: 'V Promedio', valor: '120.5', unidad: 'V' },
      { id: 'iprom', titulo: 'I Promedio', valor: '4.227', unidad: 'A' },
      { id: 'pprom', titulo: 'Potencia activa prom.', valor: '0.509', unidad: 'kW' },
      { id: 'qprom', titulo: 'Potencia reactiva prom.', valor: '0.119', unidad: 'kVAR' },
      { id: 'sprom', titulo: 'Potencia aparente prom.', valor: '0.523', unidad: 'kVA' },
      { id: 'fpprom', titulo: 'Factor de potencia prom.', valor: '0.973', unidad: '—' },
    ],
  },
  {
    id: 'linea',
    etiqueta: 'Línea y frecuencia',
    medidas: [
      { id: 'vab', titulo: 'Vab (Línea)', valor: '208.3', unidad: 'V' },
      { id: 'vbc', titulo: 'Vbc (Línea)', valor: '207.9', unidad: 'V' },
      { id: 'vca', titulo: 'Vca (Línea)', valor: '208.1', unidad: 'V' },
      { id: 'frec', titulo: 'Frecuencia', valor: '60.01', unidad: 'Hz' },
      null,
      null,
    ],
  },
]

function TabInstantaneos() {
  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Valores instantáneos</h2>
          <p className="text-sm text-gray-400">
            Monitoreo en tiempo real de los parámetros eléctricos por fase
          </p>
        </div>

        {FASES.map((fase) => (
          <section
            key={fase.id}
            className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5"
          >
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-widest text-gray-400">
              {fase.etiqueta}
            </h3>
            <div className="grid grid-cols-6 gap-6">
              {fase.medidas.map((medida, index) =>
                medida ? (
                  <MonitorMedidaTile
                    key={medida.id}
                    titulo={medida.titulo}
                    valor={medida.valor}
                    unidad={medida.unidad}
                  />
                ) : (
                  <div key={`${fase.id}-vacio-${index}`} className="invisible" />
                ),
              )}
            </div>
          </section>
        ))}

        <div className="flex items-center justify-end gap-3 px-2 pt-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
            Fases
            <input
              type="number"
              defaultValue={0}
              className="w-16 rounded-md border-0 bg-gray-100 px-3 py-1.5 text-center text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          <button
            type="button"
            className="rounded-full border border-indigo-200 px-5 py-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
          >
            Solicitar
          </button>
        </div>
      </div>
    </div>
  )
}

export default TabInstantaneos
