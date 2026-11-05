/**
 * ConexionMedidor.jsx
 * ---------------------------------------------------------------------------
 * Tarjeta "Conexión con el medidor" de la pestaña Coms: el usuario elige el
 * tipo de transporte (Serial o Ethernet) y pulsa "Conectar"; el backend
 * intenta la conexión con el medidor y responde si se logró.
 *
 * Rol en el sistema:
 * - Se muestra en TabComunicaciones arriba de la configuración de
 *   comunicaciones, solo para SuperAdministrador y Administrador (el backend
 *   también rechaza a los demás con 403).
 * - No depende de `soloLectura`: conectar no modifica la configuración.
 * - Los parámetros de cada transporte los toma el backend de su archivo
 *   TransporteConfig.json; aquí solo se elige cuál usar.
 */
import { useEffect, useRef, useState } from 'react'
import { conectarMedidor, TIPOS_TRANSPORTE } from '../../services/conexionMedidorService'

// Estilos del mensaje de resultado según el estado de la conexión.
const CLASES_ESTADO = {
  conectando: 'border-blue-200 bg-blue-50 text-blue-700',
  conectado: 'border-green-200 bg-green-50 text-green-700',
  error: 'border-red-200 bg-red-50 text-red-700',
}

// Props:
// - medidor: medidor seleccionado (se usa su dirRed).
export default function ConexionMedidor({ medidor }) {
  const [tipoTransporte, setTipoTransporte] = useState(TIPOS_TRANSPORTE[0].valor)
  // estado: null (sin intento) | { tipo: 'conectando' | 'conectado' | 'error', texto }
  const [estado, setEstado] = useState(null)
  const controladorRef = useRef(null)

  // Si el usuario sale de la pestaña con una conexión en curso, se cancela.
  useEffect(() => () => controladorRef.current?.abort(), [])

  const conectando = estado?.tipo === 'conectando'
  const textoTransporte = TIPOS_TRANSPORTE.find((t) => t.valor === tipoTransporte)?.texto

  const elegirTransporte = (valor) => {
    setTipoTransporte(valor)
    setEstado(null) // El resultado anterior ya no corresponde al transporte elegido.
  }

  const conectar = async () => {
    controladorRef.current?.abort()
    const controlador = new AbortController()
    controladorRef.current = controlador

    setEstado({ tipo: 'conectando', texto: `Conectando con el medidor ${medidor.dirRed} por ${textoTransporte}…` })
    try {
      const mensaje = await conectarMedidor(medidor.dirRed, tipoTransporte, { signal: controlador.signal })
      setEstado({ tipo: 'conectado', texto: `${mensaje} (${textoTransporte})` })
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

      <div className="flex flex-wrap items-end gap-4">
        <fieldset disabled={conectando}>
          <legend className="mb-1.5 text-sm font-semibold text-slate-900">Tipo de transporte</legend>
          {/* Botones tipo interruptor: uno de los dos queda marcado. */}
          <div role="radiogroup" aria-label="Tipo de transporte" className="inline-flex overflow-hidden rounded-lg border border-slate-300">
            {TIPOS_TRANSPORTE.map((t) => {
              const activo = t.valor === tipoTransporte
              return (
                <button
                  key={t.valor}
                  type="button"
                  role="radio"
                  aria-checked={activo}
                  onClick={() => elegirTransporte(t.valor)}
                  className={`px-5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                    activo ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {t.texto}
                </button>
              )
            })}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={conectar}
          disabled={conectando}
          className="cursor-pointer rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {conectando ? 'Conectando…' : 'Conectar'}
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Los parámetros de cada transporte (puerto COM, IP, puerto, timeout) los toma el servidor de su configuración.
      </p>

      {estado && (
        <div role="status" className={`mt-4 rounded-md border p-3 text-sm ${CLASES_ESTADO[estado.tipo]}`}>
          {estado.texto}
        </div>
      )}
    </section>
  )
}
