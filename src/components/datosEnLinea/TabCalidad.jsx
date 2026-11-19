/**
 * TabCalidad.jsx
 * ---------------------------------------------------------------------------
 * Vista de "Calidad de la potencia" del medidor: al pulsar "Solicitar" pide
 * al backend la lectura en línea y muestra los indicadores agrupados por
 * categoría (THD de Tensión, THD de Corriente, Factor de potencia y
 * Desbalance).
 *
 * Rol en el sistema:
 * - Pestaña de MainForm (Datos en línea). Recibe el medidor seleccionado.
 * - La lectura usa POST /ConexionMedidor/calidadpotencia (grupo funcional 5,
 *   SolCalPot de la DLL) mediante useLecturaMedidor; solo la pueden pedir el
 *   SuperAdministrador y el Administrador.
 * - Cada tarjeta se llena con el punto de PuntosIO cuyo Tag coincide con su
 *   `tag`. Los puntos que no estén en CATEGORIAS salen en "Otros puntos".
 */
import EncabezadoLectura, { OtrosPuntos } from './EncabezadoLectura'
import { useLecturaMedidor } from '../../hooks/useLecturaMedidor'
import { Waves } from 'lucide-react'

// Indicadores de calidad de la potencia, agrupados por categoría. `tag` es
// el Tag del punto en PuntosIO (grupo funcional 5).
const CATEGORIAS = [
  {
    id: 'thd-tension',
    etiqueta: 'THD Tensión',
    medidas: [
      { tag: 'THD_VA', titulo: 'THD VA (%)' },
      { tag: 'THD_VB', titulo: 'THD VB (%)' },
      { tag: 'THD_VC', titulo: 'THD VC (%)' },
    ],
  },
  {
    id: 'thd-corriente',
    etiqueta: 'THD Corriente',
    medidas: [
      { tag: 'THD_IA', titulo: 'THD IA (%)' },
      { tag: 'THD_IB', titulo: 'THD IB (%)' },
      { tag: 'THD_IC', titulo: 'THD IC (%)' },
    ],
  },
  {
    id: 'factor-potencia',
    etiqueta: 'Factor de potencia',
    medidas: [
      { tag: 'CP_FPA', titulo: 'FPA' },
      { tag: 'CP_FPB', titulo: 'FPB' },
      { tag: 'CP_FPC', titulo: 'FPC' },
    ],
  },
  {
    id: 'desbalance',
    etiqueta: 'Desbalance',
    medidas: [
      { tag: 'DesV', titulo: 'Desbalance V (%)' },
      { tag: 'DesI', titulo: 'Desbalance I (%)' },
    ],
  },
]

const TAGS = CATEGORIAS.flatMap((categoria) => categoria.medidas.map((medida) => medida.tag))

// Tarjeta de solo lectura para un indicador de calidad: título y valor centrados.
function DataTile({ titulo, valor }) {
  return (
    <div className="rounded-xl bg-white p-5 border border-gray-200 shadow-sm">
      <p className="truncate text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600">
        {titulo}
      </p>
      <p className="mt-2 text-center font-mono text-2xl font-semibold tracking-tight text-green-500 tabular-nums">
        {valor}
      </p>
    </div>
  )
}

// Props:
// - medidor: medidor seleccionado (se usan su id y su dirRed).
// - usuarioLogueado: usuario autenticado (solo administradores pueden leer).
function TabCalidad({ medidor, usuarioLogueado }) {
  const lectura = useLecturaMedidor({ medidor, usuarioLogueado, grupo: 'calidadpotencia', tagsCatalogo: TAGS })

  return (
    // Contenedor con scroll propio para acomodar todas las categorías de calidad.
    <div className="h-full overflow-auto pt-4">
      <div className="flex flex-col gap-4">
        <EncabezadoLectura Icono={Waves} titulo="Calidad de la potencia" lectura={lectura} medidor={medidor} />

        {/* Columnas por categoría (THD Tensión, THD Corriente, Factor de
            potencia, Desbalance), responsiva de 1 a 4 columnas. */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {CATEGORIAS.map((categoria) => (
              <div key={categoria.id} className="flex flex-col gap-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-600">
                  {categoria.etiqueta}
                </h3>
                {categoria.medidas.map((medida) => (
                  <DataTile key={medida.tag} titulo={medida.titulo} valor={lectura.valor(medida.tag)} />
                ))}
              </div>
            ))}
          </div>
        </section>

        <OtrosPuntos puntos={lectura.otrosPuntos} />
      </div>
    </div>
  )
}

export default TabCalidad
