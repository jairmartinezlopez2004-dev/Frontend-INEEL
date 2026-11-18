/**
 * TabValores5M.jsx
 * ---------------------------------------------------------------------------
 * Vista de "Últimos valores 5 minutales" del medidor: al pulsar "Solicitar"
 * pide al backend la lectura en línea y muestra las medidas del último
 * intervalo de 5 minutos, agrupadas por categoría (Energía, Potencia,
 * Tensión y corriente, Factor de potencia, Distorsión armónica).
 *
 * Rol en el sistema:
 * - Pestaña de MainForm (Datos en línea). Recibe el medidor seleccionado.
 * - La lectura usa POST /ConexionMedidor/variables5min (grupo funcional 2,
 *   SolUV5M de la DLL) mediante useLecturaMedidor; solo la pueden pedir el
 *   SuperAdministrador y el Administrador.
 * - Cada tarjeta se llena con el punto de PuntosIO cuyo Tag coincide con su
 *   `tag` (UV5M_*). Los puntos que no estén en FILAS salen en "Otros puntos".
 */
import MonitorMedidaTile from '../common/MonitorMedidaTile'
import EncabezadoLectura, { OtrosPuntos } from './EncabezadoLectura'
import { useLecturaMedidor } from '../../hooks/useLecturaMedidor'

// Catálogo de variables de 5 minutos, agrupadas por categoría. `tag` es el
// Tag del punto en PuntosIO (grupo funcional 2). Los `null` son espacios
// vacíos para mantener alineada la grilla.
const FILAS = [
  {
    id: 'energia',
    etiqueta: 'Energía',
    medidas: [
      { tag: 'UV5M_WHTE', titulo: 'Whe', unidad: 'kWh' },
      { tag: 'UV5M_WHTR', titulo: 'Whr', unidad: 'kWh' },
      { tag: 'UV5M_VARTI', titulo: 'VAR I', unidad: 'kVARh' },
      { tag: 'UV5M_VARTII', titulo: 'VAR II', unidad: 'kVARh' },
      { tag: 'UV5M_VARTIII', titulo: 'VAR III', unidad: 'kVARh' },
      { tag: 'UV5M_VARTIV', titulo: 'VAR IV', unidad: 'kVARh' },
    ],
  },
  {
    id: 'potencia',
    etiqueta: 'Potencia',
    medidas: [
      { tag: 'UV5M_WA', titulo: 'WA', unidad: 'kW' },
      { tag: 'UV5M_WB', titulo: 'WB', unidad: 'kW' },
      { tag: 'UV5M_WC', titulo: 'WC', unidad: 'kW' },
      { tag: 'UV5M_VARA', titulo: 'VARA', unidad: 'kVAR' },
      { tag: 'UV5M_VARB', titulo: 'VARB', unidad: 'kVAR' },
      { tag: 'UV5M_VARC', titulo: 'VARC', unidad: 'kVAR' },
    ],
  },
  {
    id: 'tension-corriente',
    etiqueta: 'Tensión y corriente',
    medidas: [
      { tag: 'UV5M_VA', titulo: 'VA', unidad: 'V' },
      { tag: 'UV5M_VB', titulo: 'VB', unidad: 'V' },
      { tag: 'UV5M_VC', titulo: 'VC', unidad: 'V' },
      { tag: 'UV5M_IA', titulo: 'IA', unidad: 'A' },
      { tag: 'UV5M_IB', titulo: 'IB', unidad: 'A' },
      { tag: 'UV5M_IC', titulo: 'IC', unidad: 'A' },
    ],
  },
  {
    id: 'factor-potencia',
    etiqueta: 'Factor de potencia',
    medidas: [
      { tag: 'UV5M_FPA', titulo: 'FPA', unidad: '(-)' },
      { tag: 'UV5M_FPB', titulo: 'FPB', unidad: '(-)' },
      { tag: 'UV5M_FPC', titulo: 'FPC', unidad: '(-)' },
      null,
      null,
      null,
    ],
  },
  {
    id: 'thd',
    etiqueta: 'Distorsión armónica (THD)',
    medidas: [
      { tag: 'UV5M_THD_VA', titulo: 'THD VA', unidad: '%' },
      { tag: 'UV5M_THD_VB', titulo: 'THD VB', unidad: '%' },
      { tag: 'UV5M_THD_VC', titulo: 'THD VC', unidad: '%' },
      { tag: 'UV5M_THD_IA', titulo: 'THD IA', unidad: '%' },
      { tag: 'UV5M_THD_IB', titulo: 'THD IB', unidad: '%' },
      { tag: 'UV5M_THD_IC', titulo: 'THD IC', unidad: '%' },
    ],
  },
]

const TAGS = FILAS.flatMap((fila) => fila.medidas.filter(Boolean).map((medida) => medida.tag))

// Props:
// - medidor: medidor seleccionado (se usan su id y su dirRed).
// - usuarioLogueado: usuario autenticado (solo administradores pueden leer).
function TabValores5M({ medidor, usuarioLogueado }) {
  const lectura = useLecturaMedidor({ medidor, usuarioLogueado, grupo: 'variables5min', tagsCatalogo: TAGS })

  return (
    // Contenedor con scroll propio para acomodar todas las categorías de medidas.
    <div className="h-full overflow-auto bg-gray-50 p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <EncabezadoLectura titulo="Últimos valores 5 minutales" lectura={lectura} medidor={medidor} />

        {/* Una sección (tarjeta) por cada categoría de medidas. */}
        {FILAS.map((fila) => (
          <section key={fila.id} className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5">
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-widest text-gray-900">
              {fila.etiqueta}
            </h3>
            {/* Grilla responsiva de tarjetas de medida (2 a 6 columnas según el ancho de pantalla). */}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {fila.medidas.map((medida, index) =>
                medida ? (
                  <MonitorMedidaTile
                    key={medida.tag}
                    titulo={medida.titulo}
                    valor={lectura.valor(medida.tag)}
                    unidad={medida.unidad}
                    seleccionable={false}
                  />
                ) : (
                  // Espacio invisible para mantener la alineación de la grilla.
                  <div key={`${fila.id}-vacio-${index}`} className="invisible" />
                ),
              )}
            </div>
          </section>
        ))}

        <OtrosPuntos puntos={lectura.otrosPuntos} />
      </div>
    </div>
  )
}

export default TabValores5M
