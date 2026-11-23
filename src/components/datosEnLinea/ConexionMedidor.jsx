/**
 * ConexionMedidor.jsx
 * ---------------------------------------------------------------------------
 * Tarjeta "Conexión con el medidor" de la pestaña Coms, con dos operaciones:
 * - "Conectar": el backend intenta la conexión con el medidor por el puerto
 *   serial y responde si se logró.
 * - "Sincronizar": el backend conecta y envía al medidor la trama de
 *   sincronización (Sincronizar de la DLL con el punto configurado en el
 *   servidor) para poder solicitarle datos.
 *
 * Rol en el sistema:
 * - Se muestra en TabComunicaciones arriba de la configuración de
 *   comunicaciones, solo para SuperAdministrador y Administrador (el backend
 *   también rechaza a los demás con 403).
 * - No depende de `soloLectura`: ninguna operación modifica la configuración.
 * - Solo se envía el idMedidor: el backend toma dirRed y dirRF de la base de
 *   datos, los parámetros del puerto de sus archivos JSON y el punto de
 *   sincronización de su configuración.
 * - Las dos operaciones usan el mismo puerto, así que mientras una está en
 *   curso ambos botones se deshabilitan.
 */
import { useEffect, useRef, useState } from 'react'
import { conectarMedidor, sincronizarMedidor } from '../../services/conexionMedidorService'
import { Cable, Plug, RefreshCw } from 'lucide-react'
import TituloSeccion from '../common/TituloSeccion'

// Estilos del mensaje de resultado según el estado de la operación.
const CLASES_ESTADO = {
import { formatoDirRed } from '../../utils/direccionRed'
  enCurso: 'border-azul-200 bg-azul-50 text-azul-800',
  exito: 'border-verde-200 bg-verde-50 text-verde-700',
  error: 'border-red-200 bg-red-50 text-red-700',
}

const CLASES_BOTON =
  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-6 py-2 font-semibold text-white transition-colors hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'

// Props:
// - medidor: medidor seleccionado (se usan su id y su dirRed).
export default function ConexionMedidor({ medidor }) {
  // estado: null (sin intento) | { tipo: 'enCurso' | 'exito' | 'error', operacion, texto }
  const [estado, setEstado] = useState(null)
  const controladorRef = useRef(null)

  // Si el usuario sale de la pestaña con una operación en curso, se cancela.
  useEffect(() => () => controladorRef.current?.abort(), [])

  const enCurso = estado?.tipo === 'enCurso'

  // Ejecuta una operación contra el backend y refleja su resultado.
  // - operacion: 'conectar' | 'sincronizar' (para el texto del botón activo).
  // - llamada: función del servicio (conectarMedidor o sincronizarMedidor).
  // - textoEnCurso: mensaje mientras espera la respuesta.
  const ejecutar = async (operacion, llamada, textoEnCurso) => {
    controladorRef.current?.abort()
    const controlador = new AbortController()
    controladorRef.current = controlador

    setEstado({ tipo: 'enCurso', operacion, texto: textoEnCurso })
    try {
      const mensaje = await llamada(medidor.id, { signal: controlador.signal })
      setEstado({ tipo: 'exito', operacion, texto: mensaje })
    } catch (err) {
      if (err.name === 'AbortError') return
      setEstado({ tipo: 'error', operacion, texto: err.message })
    }
  }

  const conectar = () =>
    ejecutar('conectar', conectarMedidor, `Conectando con el medidor ${formatoDirRed(medidor.dirRed)} por puerto serial…`)

  const sincronizar = () =>
    ejecutar('sincronizar', sincronizarMedidor, `Enviando trama de sincronización al medidor ${formatoDirRed(medidor.dirRed)}…`)

  return (
    <section className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 border-b border-gray-200 pb-4">
        <TituloSeccion Icono={Cable} titulo="Conexión con el medidor" />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={conectar}
          disabled={enCurso}
          className={`${CLASES_BOTON} bg-azul-700 hover:bg-azul-800`}
        >
          <Plug className="h-4 w-4" aria-hidden="true" />
          {enCurso && estado.operacion === 'conectar' ? 'Conectando…' : 'Conectar'}
        </button>

        <button
          type="button"
          onClick={sincronizar}
          disabled={enCurso}
          className={`${CLASES_BOTON} bg-azul-700 hover:bg-azul-800`}
        >
          <RefreshCw className={`h-4 w-4 ${enCurso && estado.operacion === 'sincronizar' ? 'animate-spin' : ''}`} aria-hidden="true" />
          {enCurso && estado.operacion === 'sincronizar' ? 'Sincronizando…' : 'Sincronizar'}
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        La conexión es por puerto serial. El puerto COM, la velocidad y el timeout los toma el servidor de su
        configuración. "Sincronizar" conecta y envía al medidor la trama de sincronización para poder solicitarle datos.
      </p>

      {estado && (
        <div role="status" className={`mt-4 rounded-md border p-3 text-sm ${CLASES_ESTADO[estado.tipo]}`}>
          {estado.texto}
        </div>
      )}
    </section>
  )
}
