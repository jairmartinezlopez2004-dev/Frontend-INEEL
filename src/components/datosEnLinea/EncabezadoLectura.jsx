/**
 * EncabezadoLectura.jsx
 * ---------------------------------------------------------------------------
 * Piezas visuales comunes de las pestañas que leen el medidor (Instantáneos,
 * Valores 5M, Consumos y Calidad), alimentadas por useLecturaMedidor:
 * - EncabezadoLectura (default): título, hora de la última lectura, botón
 *   "Solicitar" (o el aviso para quien no es administrador) y el mensaje del
 *   resultado.
 * - OtrosPuntos: tarjetas de los puntos que devolvió el backend y que el
 *   catálogo de la pestaña todavía no contempla.
 */
import MonitorMedidaTile from '../common/MonitorMedidaTile'
import { formatearValor } from '../../hooks/useLecturaMedidor'
import { Download } from 'lucide-react'
import TituloSeccion from '../common/TituloSeccion'

// Estilos del mensaje de resultado según el estado de la lectura.
const CLASES_ESTADO = {
  enCurso: 'border-blue-200 bg-blue-50 text-blue-700',
  exito: 'border-green-200 bg-green-50 text-green-700',
  error: 'border-red-200 bg-red-50 text-red-700',
}

// Props:
// - Icono: ícono (lucide-react) de la pestaña.
// - titulo: título de la pestaña.
// - lectura: objeto que devuelve useLecturaMedidor.
// - medidor: medidor seleccionado (sin medidor, el botón queda deshabilitado).
export default function EncabezadoLectura({ Icono, titulo, lectura, medidor }) {
  const { esAdmin, estado, leyendo, ultimaLectura, solicitar } = lectura

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TituloSeccion
          Icono={Icono}
          titulo={titulo}
          subtitulo={
            ultimaLectura
              ? `Última lectura: ${ultimaLectura.toLocaleString('es-MX')}`
              : 'Sin lectura. Pulse «Solicitar» para leer los valores del medidor.'
          }
        />

        {esAdmin ? (
          <button
            type="button"
            onClick={solicitar}
            disabled={leyendo || !medidor}
            className="inline-flex transform cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className={`h-4 w-4 ${leyendo ? 'animate-pulse' : ''}`} aria-hidden="true" />
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
  )
}

// Props:
// - puntos: lista `otrosPuntos` de useLecturaMedidor ({ idPunto, tag, valor }).
export function OtrosPuntos({ puntos }) {
  if (puntos.length === 0) return null
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-xs font-semibold uppercase tracking-widest text-slate-600">
        Otros puntos
      </h3>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {puntos.map((punto) => (
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
  )
}
