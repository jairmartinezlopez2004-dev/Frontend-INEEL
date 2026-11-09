/**
 * ConexionMedidor.jsx
 * ---------------------------------------------------------------------------
 * Tarjeta "Conexión con el medidor" de la pestaña Coms: el usuario pulsa
 * "Conectar" y el backend intenta la conexión con el medidor por el puerto
 * serial y responde si se logró.
 *
 * Rol en el sistema:
 * - Se muestra en TabComunicaciones arriba de la configuración de
 *   comunicaciones, solo para SuperAdministrador y Administrador (el backend
 *   también rechaza a los demás con 403).
 * - No depende de `soloLectura`: conectar no modifica la configuración.
 * - Solo se envía el idMedidor: el backend toma dirRed y dirRF de la base de
 *   datos y los parámetros del puerto de sus archivos JSON.
 */
import { useEffect, useRef, useState } from 'react'
import { conectarMedidor } from '../../services/conexionMedidorService'

// Estilos del mensaje de resultado según el estado de la conexión.
const CLASES_ESTADO = {
  conectando: 'border-blue-200 bg-blue-50 text-blue-700',
  conectado: 'border-green-200 bg-green-50 text-green-700',
  error: 'border-red-200 bg-red-50 text-red-700',
}

// Props:
// - medidor: medidor seleccionado (se usan su id y su dirRed).
export default function ConexionMedidor({ medidor }) {
  // estado: null (sin intento) | { tipo: 'conectando' | 'conectado' | 'error', texto }
  const [estado, setEstado] = useState(null)
  const controladorRef = useRef(null)

  // Si el usuario sale de la pestaña con una conexión en curso, se cancela.
  useEffect(() => () => controladorRef.current?.abort(), [])

  const conectando = estado?.tipo === 'conectando'

  const conectar = async () => {
    controladorRef.current?.abort()
    const controlador = new AbortController()
    controladorRef.current = controlador

    setEstado({ tipo: 'conectando', texto: `Conectando con el medidor ${medidor.dirRed} por puerto serial…` })
    try {
      const mensaje = await conectarMedidor(medidor.id, { signal: controlador.signal })
      setEstado({ tipo: 'conectado', texto: mensaje })
    } catch (err) {
      if (err.name === 'AbortError') return
      setEstado({ tipo: 'error', texto: err.message })
    }
  }

  return (
    <section className="w-full rounded-xl bg-white p-6 shadow-md">
      <h2 className="mb-4 border-b border-slate-200 pb-4 text-lg font-bold uppercase tracking-wide text-slate-900">
        Conexión con el medidor
      </h2>

      <button
        type="button"
        onClick={conectar}
        disabled={conectando}
        className="cursor-pointer rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {conectando ? 'Conectando…' : 'Conectar'}
      </button>

      <p className="mt-2 text-xs text-slate-500">
        La conexión es por puerto serial. El puerto COM, la velocidad y el timeout los toma el servidor de su configuración.
      </p>

      {estado && (
        <div role="status" className={`mt-4 rounded-md border p-3 text-sm ${CLASES_ESTADO[estado.tipo]}`}>
          {estado.texto}
        </div>
      )}
    </section>
  )
}
