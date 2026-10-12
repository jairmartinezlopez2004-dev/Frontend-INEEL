/**
 * AvisoExpiracionSesion.jsx
 * ---------------------------------------------------------------------------
 * Vigila el tiempo de vida del token JWT y avisa al usuario (Administrador o
 * Usuario) cuando a su sesión le queda 1 minuto.
 *
 * Flujo:
 * - Cada segundo revisa cuánto le queda al token (claim `exp`). Se revisa
 *   con un intervalo en lugar de un solo setTimeout largo porque los
 *   navegadores pausan los timers de las pestañas en segundo plano; así, al
 *   volver a la pestaña el conteo siempre refleja la hora real.
 * - Con 60 segundos o menos muestra el modal "¿Deseas más tiempo?":
 *   - "Sí": pide un token nuevo al backend (POST /Auth/renew), que
 *     vuelve a dar el `tiempoSesion` del usuario (60 minutos por defecto).
 *   - "No" (o Esc / clic fuera): se cierra el aviso y la sesión termina sola
 *     al llegar a 0.
 * - Al llegar a 0 cierra la sesión automáticamente.
 *
 * No pinta nada fuera del modal; se monta una sola vez dentro del layout
 * autenticado (App.jsx).
 */
import { useEffect, useState } from 'react'
import ConfirmDialog from '../common/ConfirmDialog'
import { renovarSesion, segundosRestantesSesion } from '../../services/authService'

// Con cuántos segundos de anticipación se avisa.
const SEGUNDOS_AVISO = 60

// Props:
// - onRenovada: callback con el usuario del token nuevo (App.jsx lo guarda).
// - onExpirada: callback para cerrar la sesión cuando el tiempo llega a 0.
function AvisoExpiracionSesion({ onRenovada, onExpirada }) {
  const [restantes, setRestantes] = useState(segundosRestantesSesion)
  // true si el usuario respondió "No": ya no se vuelve a mostrar el aviso.
  const [rechazado, setRechazado] = useState(false)
  const [renovando, setRenovando] = useState(false)
  const [error, setError] = useState(null)

  // Actualiza el tiempo restante cada segundo.
  useEffect(() => {
    const id = setInterval(() => setRestantes(segundosRestantesSesion()), 1000)
    return () => clearInterval(id)
  }, [])

  // Tiempo agotado: cierre de sesión automático.
  useEffect(() => {
    if (restantes <= 0) onExpirada()
  }, [restantes, onExpirada])

  const extender = async () => {
    setRenovando(true)
    setError(null)
    try {
      const usuario = await renovarSesion()
      onRenovada(usuario)
      setRestantes(segundosRestantesSesion())
    } catch (err) {
      setError(`No se pudo extender la sesión: ${err.message}`)
    } finally {
      setRenovando(false)
    }
  }

  return (
    <ConfirmDialog
      abierto={restantes > 0 && restantes <= SEGUNDOS_AVISO && !rechazado}
      titulo="Tu sesión está por caducar"
      mensaje={
        <>
          <p>
            Tu sesión se cerrará en <strong className="text-slate-900">{restantes} s</strong>.
            ¿Deseas más tiempo?
          </p>
          {error && <p className="mt-3 text-red-600">{error}</p>}
        </>
      }
      textoCancelar="No"
      textoConfirmar={renovando ? 'Extendiendo…' : 'Sí, extender sesión'}
      tono="primario"
      ocupado={renovando}
      onConfirmar={extender}
      onCancelar={() => setRechazado(true)}
    />
  )
}

export default AvisoExpiracionSesion
