import MonitorMedidaTile from '../common/MonitorMedidaTile'

const FILAS = [
  {
    id: 'energia',
    etiqueta: 'Energía',
    medidas: [
      { id: 'whe', titulo: 'Whe', valor: '152340.500', unidad: 'kWh' },
      { id: 'whr', titulo: 'Whr', valor: '128.400', unidad: 'kWh' },
      { id: 'var1', titulo: 'VAR I', valor: '42310.200', unidad: 'kVARh' },
      { id: 'var2', titulo: 'VAR II', valor: '310.500', unidad: 'kVARh' },
      { id: 'var3', titulo: 'VAR III', valor: '512.700', unidad: 'kVARh' },
      { id: 'var4', titulo: 'VAR IV', valor: '98.300', unidad: 'kVARh' },
    ],
  },
  {
    id: 'potencia',
    etiqueta: 'Potencia',
    medidas: [
      { id: 'wa', titulo: 'WA', valor: '0.510', unidad: 'kW' },
      { id: 'wb', titulo: 'WB', valor: '0.501', unidad: 'kW' },
      { id: 'wc', titulo: 'WC', valor: '0.517', unidad: 'kW' },
      { id: 'vara', titulo: 'VARA', valor: '0.120', unidad: 'kVAR' },
      { id: 'varb', titulo: 'VARB', valor: '0.115', unidad: 'kVAR' },
      { id: 'varc', titulo: 'VARC', valor: '0.122', unidad: 'kVAR' },
    ],
  },
  {
    id: 'tension-corriente',
    etiqueta: 'Tensión y corriente',
    medidas: [
      { id: 'va', titulo: 'VA', valor: '120.5', unidad: 'V' },
      { id: 'vb', titulo: 'VB', valor: '119.8', unidad: 'V' },
      { id: 'vc', titulo: 'VC', valor: '121.1', unidad: 'V' },
      { id: 'ia', titulo: 'IA', valor: '4.230', unidad: 'A' },
      { id: 'ib', titulo: 'IB', valor: '4.185', unidad: 'A' },
      { id: 'ic', titulo: 'IC', valor: '4.267', unidad: 'A' },
    ],
  },
  {
    id: 'factor-potencia',
    etiqueta: 'Factor de potencia',
    medidas: [
      { id: 'fpa', titulo: 'FPA', valor: '0.973', unidad: '—' },
      { id: 'fpb', titulo: 'FPB', valor: '0.975', unidad: '—' },
      { id: 'fpc', titulo: 'FPC', valor: '0.972', unidad: '—' },
      null,
      null,
      null,
    ],
  },
  {
    id: 'thd',
    etiqueta: 'Distorsión armónica (THD)',
    medidas: [
      { id: 'thd-va', titulo: 'THD VA', valor: '2.4', unidad: '%' },
      { id: 'thd-vb', titulo: 'THD VB', valor: '2.1', unidad: '%' },
      { id: 'thd-vc', titulo: 'THD VC', valor: '2.6', unidad: '%' },
      { id: 'thd-ia', titulo: 'THD IA', valor: '3.8', unidad: '%' },
      { id: 'thd-ib', titulo: 'THD IB', valor: '3.5', unidad: '%' },
      { id: 'thd-ic', titulo: 'THD IC', valor: '4.0', unidad: '%' },
    ],
  },
]

function TabValores5M() {
  return (
    <div className="h-full overflow-auto bg-gray-50 p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold uppercase tracking-wide text-slate-800">
            Últimos valores 5 minutales
          </h2>
        </div>

        {FILAS.map((fila) => (
          <section
            key={fila.id}
            className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5"
          >
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-widest text-gray-400">
              {fila.etiqueta}
            </h3>
            <div className="grid grid-cols-6 gap-6">
              {fila.medidas.map((medida, index) =>
                medida ? (
                  <MonitorMedidaTile
                    key={medida.id}
                    titulo={medida.titulo}
                    valor={medida.valor}
                    unidad={medida.unidad}
                  />
                ) : (
                  <div key={`${fila.id}-vacio-${index}`} className="invisible" />
                ),
              )}
            </div>
          </section>
        ))}

        <div className="flex justify-center pt-2">
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Solicitar
          </button>
        </div>
      </div>
    </div>
  )
}

export default TabValores5M
