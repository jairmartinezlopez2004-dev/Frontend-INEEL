/**
 * TabInstantaneos.jsx
 * ---------------------------------------------------------------------------
 * Vista de "Valores instantáneos" del medidor: al pulsar "Solicitar" pide al
 * backend la lectura en línea y muestra, agrupadas por fase (A, B, C,
 * Promedios y Línea/Frecuencia), las mediciones eléctricas recibidas.
 *
 * Rol en el sistema:
 * - Pestaña de MainForm (Datos en línea). Recibe el medidor seleccionado.
 * - La lectura usa POST /ConexionMedidor/instantaneos (conexionMedidorService),
 *   que solo admite SuperAdministrador y Administrador; a los demás roles se
 *   les muestra el aviso en lugar del botón.
 * - El backend lee siempre todos los puntos de PuntosIO del grupo funcional 1
 *   (IdGF = 1) y no recibe una selección, por eso las tarjetas no tienen casilla.
 * - Cada tarjeta se llena con el punto cuyo `tag` coincide con su `tag`
 *   (sin distinguir mayúsculas). Si el backend devuelve puntos que no están
 *   en el catálogo FASES, se muestran en una sección "Otros puntos".
 */
import { useEffect, useRef, useState } from 'react'
import MonitorMedidaTile from '../common/MonitorMedidaTile'
import { solicitarInstantaneos } from '../../services/conexionMedidorService'

// rolId del SuperAdministrador y del Administrador en la UI (authService.js).
const ROLES_ADMINISTRADOR = [1, 2]

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
      { tag: 'FPA', titulo: 'Factor de potencia A', unidad: '—' },
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
      { tag: 'FPB', titulo: 'Factor de potencia B', unidad: '—' },
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
      { tag: 'FPC', titulo: 'Factor de potencia C', unidad: '—' },
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
      { tag: 'FP3F', titulo: 'Factor de potencia 3F', unidad: '—' },
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

// Tags del catálogo en minúsculas, para detectar puntos que no están en FASES.
const TAGS_CATALOGO = new Set(
  FASES.flatMap((fase) => fase.medidas.filter(Boolean).map((medida) => medida.tag.toLowerCase())),
)

// Estilos del mensaje de resultado según el estado de la lectura.
const CLASES_ESTADO = {
  enCurso: 'border-blue-200 bg-blue-50 text-blue-700',
  exito: 'border-green-200 bg-green-50 text-green-700',
  error: 'border-red-200 bg-red-50 text-red-700',
}

// Da formato al valor recibido: números con hasta 3 decimales; sin valor -> "—".
function formatearValor(valor) {
  if (valor === null || valor === undefined || valor === '') return '—'
  const numero = Number(valor)
  if (Number.isNaN(numero)) return String(valor)
  return numero.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
}

// Props:
// - medidor: medidor seleccionado (se usan su id y su dirRed).
// - usuarioLogueado: usuario autenticado (solo administradores pueden leer).
function TabInstantaneos({ medidor, usuarioLogueado }) {
  const esAdmin = ROLES_ADMINISTRADOR.includes(usuarioLogueado?.rolId)

  // Puntos de la última lectura exitosa, indexados por tag en minúsculas.
  const [valoresPorTag, setValoresPorTag] = useState(() => new Map())
  // Puntos devueltos que no aparecen en el catálogo FASES.
  const [otrosPuntos, setOtrosPuntos] = useState([])
  // Hora de la última lectura exitosa.
  const [ultimaLectura, setUltimaLectura] = useState(null)
  // estado: null | { tipo: 'enCurso' | 'exito' | 'error', texto }
  const [estado, setEstado] = useState(null)
  const controladorRef = useRef(null)

  // Si el usuario sale de la pestaña con una lectura en curso, se cancela.
  useEffect(() => () => controladorRef.current?.abort(), [])

  const leyendo = estado?.tipo === 'enCurso'

  const solicitar = async () => {
    controladorRef.current?.abort()
    const controlador = new AbortController()
    controladorRef.current = controlador

    setEstado({ tipo: 'enCurso', texto: `Solicitando valores instantáneos al medidor ${medidor.dirRed}…` })
    try {
      const { mensaje, puntos } = await solicitarInstantaneos(medidor.id, { signal: controlador.signal })
      setValoresPorTag(new Map(puntos.map((punto) => [String(punto.tag).toLowerCase(), punto.valor])))
      setOtrosPuntos(puntos.filter((punto) => !TAGS_CATALOGO.has(String(punto.tag).toLowerCase())))
      setUltimaLectura(new Date())
      setEstado({ tipo: 'exito', texto: mensaje })
    } catch (err) {
      if (err.name === 'AbortError') return
      setEstado({ tipo: 'error', texto: err.message })
    }
  }

  return (
    // Contenedor con scroll propio para acomodar todas las secciones de fases.
    <div className="flex-1 overflow-auto bg-gray-50 p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Encabezado: título y hora de la última lectura a la izquierda, botón a la derecha. */}
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wide text-slate-800">
                Valores instantáneos
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {ultimaLectura
                  ? `Última lectura: ${ultimaLectura.toLocaleString('es-MX')}`
                  : 'Sin lectura. Pulse «Solicitar» para leer los valores del medidor.'}
              </p>
            </div>

            {esAdmin ? (
              <button
                type="button"
                onClick={solicitar}
                disabled={leyendo || !medidor}
                className="transform cursor-pointer rounded-lg bg-blue-600 px-8 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {leyendo ? 'Solicitando…' : 'Solicitar'}
              </button>
            ) : (
              <p className="text-sm text-slate-500">
                Solo el Administrador puede solicitar lecturas al medidor.
              </p>
            )}
          </div>

          {estado && (
            <div role="status" className={`rounded-md border p-3 text-sm ${CLASES_ESTADO[estado.tipo]}`}>
              {estado.texto}
            </div>
          )}
        </div>

        {/* Una sección (tarjeta) por cada fase/grupo de medidas. */}
        {FASES.map((fase) => (
          <section
            key={fase.id}
            className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5"
          >
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-widest text-gray-900">
              {fase.etiqueta}
            </h3>
            {/* Grilla responsiva de tarjetas de medida (2 a 6 columnas según el ancho de pantalla). */}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {fase.medidas.map((medida, index) =>
                medida ? (
                  <MonitorMedidaTile
                    key={medida.tag}
                    titulo={medida.titulo}
                    valor={formatearValor(valoresPorTag.get(medida.tag.toLowerCase()))}
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

        {/* Puntos del grupo funcional 1 que el catálogo todavía no contempla. */}
        {otrosPuntos.length > 0 && (
          <section className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5">
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-widest text-gray-900">
              Otros puntos
            </h3>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {otrosPuntos.map((punto) => (
                <MonitorMedidaTile
                  key={punto.idPunto}
                  titulo={punto.tag}
                  valor={formatearValor(punto.valor)}
                  unidad=""
                  seleccionable={false}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default TabInstantaneos
