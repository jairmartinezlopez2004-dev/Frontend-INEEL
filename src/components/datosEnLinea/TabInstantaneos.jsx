/**
 * TabInstantaneos.jsx
 * ---------------------------------------------------------------------------
 * Vista de "Valores instantáneos" del medidor: al pulsar "Solicitar" pide al
 * backend la lectura en línea y muestra, agrupadas por fase (A, B, C,
 * Promedios y Línea/Frecuencia), las mediciones eléctricas recibidas.
 *
 * Rol en el sistema:
 * - Pestaña de MainForm (Datos en línea). Recibe el medidor seleccionado.
 * - La lectura usa POST /ConexionMedidor/instantaneos mediante
 *   useLecturaMedidor; solo la pueden pedir el SuperAdministrador y el
 *   Administrador (a los demás se les muestra el aviso en lugar del botón).
 * - El backend lee siempre todos los puntos activos del grupo funcional 1
 *   (IdGF = 1) y no recibe una selección, por eso las tarjetas no tienen casilla.
 * - Cada tarjeta se llena con el punto cuyo `tag` coincide con su `tag`
 *   (sin distinguir mayúsculas). Si el backend devuelve puntos que no están
 *   en el catálogo FASES, se muestran en una sección "Otros puntos".
 */
import MonitorMedidaTile from '../common/MonitorMedidaTile'
import EncabezadoLectura, { OtrosPuntos } from './EncabezadoLectura'
import { useLecturaMedidor } from '../../hooks/useLecturaMedidor'
import { Zap } from 'lucide-react'

// Catálogo de variables eléctricas instantáneas, agrupadas por fase.
// `tag` es el Tag del punto en PuntosIO (grupo funcional 1). Los `null`
// representan espacios vacíos en la grilla (para mantener alineadas las columnas).
const FASES = [
  {
    id: 'faseA',
    etiqueta: 'Fase A',
    medidas: [
      { tag: 'VA', titulo: 'VA (Fase A - RMS)', unidad: 'V' },
      { tag: 'IA', titulo: 'IA (Fase A - RMS)', unidad: 'A' },
      { tag: 'PA', titulo: 'Potencia activa A', unidad: 'kW' },
      { tag: 'PRA', titulo: 'Potencia reactiva A', unidad: 'kVAR' },
      { tag: 'PAA', titulo: 'Potencia aparente A', unidad: 'kVA' },
      { tag: 'FPA', titulo: 'Factor de potencia A', unidad: '(-)' },
    ],
  },
  {
    id: 'faseB',
    etiqueta: 'Fase B',
    medidas: [
      { tag: 'VB', titulo: 'VB (Fase B - RMS)', unidad: 'V' },
      { tag: 'IB', titulo: 'IB (Fase B - RMS)', unidad: 'A' },
      { tag: 'PB', titulo: 'Potencia activa B', unidad: 'kW' },
      { tag: 'PRB', titulo: 'Potencia reactiva B', unidad: 'kVAR' },
      { tag: 'PAB', titulo: 'Potencia aparente B', unidad: 'kVA' },
      { tag: 'FPB', titulo: 'Factor de potencia B', unidad: '(-)' },
    ],
  },
  {
    id: 'faseC',
    etiqueta: 'Fase C',
    medidas: [
      { tag: 'VC', titulo: 'VC (Fase C - RMS)', unidad: 'V' },
      { tag: 'IC', titulo: 'IC (Fase C - RMS)', unidad: 'A' },
      { tag: 'PC', titulo: 'Potencia activa C', unidad: 'kW' },
      { tag: 'PRC', titulo: 'Potencia reactiva C', unidad: 'kVAR' },
      { tag: 'PAC', titulo: 'Potencia aparente C', unidad: 'kVA' },
      { tag: 'FPC', titulo: 'Factor de potencia C', unidad: '(-)' },
    ],
  },
  {
    id: 'promedios',
    etiqueta: 'Promedios',
    medidas: [
      { tag: 'Vprom', titulo: 'V Promedio', unidad: 'V' },
      { tag: 'Iprom', titulo: 'I Promedio', unidad: 'A' },
      { tag: 'Pprom', titulo: 'Potencia activa prom.', unidad: 'kW' },
      { tag: 'PRprom', titulo: 'Potencia reactiva prom.', unidad: 'kVAR' },
      { tag: 'PAprom', titulo: 'Potencia aparente prom.', unidad: 'kVA' },
      { tag: 'FP3F', titulo: 'Factor de potencia 3F', unidad: '(-)' },
    ],
  },
  {
    id: 'linea',
    etiqueta: 'Línea y frecuencia',
    medidas: [
      { tag: 'Vab', titulo: 'Vab (Línea)', unidad: 'V' },
      { tag: 'Vbc', titulo: 'Vbc (Línea)', unidad: 'V' },
      { tag: 'Vca', titulo: 'Vca (Línea)', unidad: 'V' },
      { tag: 'Frec', titulo: 'Frecuencia', unidad: 'Hz' },
      null,
      null,
    ],
  },
]

const TAGS = FASES.flatMap((fase) => fase.medidas.filter(Boolean).map((medida) => medida.tag))

// Props:
// - medidor: medidor seleccionado (se usan su id y su dirRed).
// - usuarioLogueado: usuario autenticado (solo administradores pueden leer).
// Color de cada grupo (mismos de las gráficas: A azul, B naranja, C verde):
// franja izquierda de la tarjeta y punto junto al título.
const COLOR_GRUPO = {
  faseA: { borde: 'border-l-blue-500', punto: 'bg-blue-500' },
  faseB: { borde: 'border-l-orange-500', punto: 'bg-orange-500' },
  faseC: { borde: 'border-l-emerald-500', punto: 'bg-emerald-500' },
}
const COLOR_NEUTRO = { borde: 'border-l-slate-400', punto: 'bg-slate-400' }

function TabInstantaneos({ medidor, usuarioLogueado }) {
  const lectura = useLecturaMedidor({ medidor, usuarioLogueado, grupo: 'instantaneos', tagsCatalogo: TAGS })

  return (
    // Contenedor con scroll propio para acomodar todas las secciones de fases.
    <div className="flex-1 overflow-auto pt-4">
      <div className="flex flex-col gap-4">
        <EncabezadoLectura Icono={Zap} titulo="Valores instantáneos" lectura={lectura} medidor={medidor} />

        {/* Una sección (tarjeta) por cada fase/grupo de medidas. */}
        {FASES.map((fase) => (
          <section
            key={fase.id}
            className={`rounded-xl border border-l-4 border-gray-200 bg-white p-6 shadow-sm ${(COLOR_GRUPO[fase.id] ?? COLOR_NEUTRO).borde}`}
          >
            <h3 className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-700">
              <span className={`h-2.5 w-2.5 rounded-full ${(COLOR_GRUPO[fase.id] ?? COLOR_NEUTRO).punto}`} aria-hidden="true" />
              {fase.etiqueta}
            </h3>
            {/* Grilla responsiva de tarjetas de medida (2 a 6 columnas según el ancho de pantalla). */}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {fase.medidas.map((medida, index) =>
                medida ? (
                  <MonitorMedidaTile
                    key={medida.tag}
                    titulo={medida.titulo}
                    valor={lectura.valor(medida.tag)}
                    unidad={medida.unidad}
                    seleccionable={false}
                  />
                ) : (
                  // Espacio invisible para mantener la alineación de la grilla
                  // cuando un grupo tiene menos medidas que columnas.
                  <div key={`${fase.id}-vacio-${index}`} className="invisible" />
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

export default TabInstantaneos
