/**
 * ConfirmDialog.jsx
 * ---------------------------------------------------------------------------
 * Ventana modal reutilizable para pedir confirmación antes de una acción
 * (por ejemplo, cerrar sesión).
 *
 * Se apoya en el elemento nativo <dialog> abierto con showModal(), que ya
 * resuelve lo importante de un modal: lo centra, oscurece el fondo, bloquea
 * la interacción con el resto de la página, mantiene el foco dentro y se
 * cierra con la tecla Esc.
 *
 * El botón "Cancelar" va primero para que reciba el foco al abrir: si el
 * usuario presiona Enter por reflejo, no se ejecuta la acción.
 */
import { useEffect, useId, useRef } from 'react'

// Estilo del botón de confirmar según el tipo de acción.
const CLASES_TONO = {
  peligro: 'bg-red-600 hover:bg-red-700', // Acciones destructivas (cerrar sesión).
  primario: 'bg-blue-600 hover:bg-blue-700', // Acciones normales (extender sesión).
}

// Props:
// - abierto: booleano que muestra u oculta el modal.
// - titulo: encabezado del modal.
// - mensaje: texto (o JSX) explicativo debajo del título.
// - textoConfirmar / textoCancelar: etiquetas de los botones.
// - onConfirmar: callback al aceptar.
// - onCancelar: callback al cancelar (botón, tecla Esc o clic fuera del modal).
// - tono: 'peligro' (rojo, por defecto) o 'primario' (azul) para el botón de confirmar.
// - ocupado: deshabilita los botones mientras se procesa la acción.
function ConfirmDialog({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Aceptar',
  textoCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
  tono = 'peligro',
  ocupado = false,
}) {
  const dialogRef = useRef(null)
  // id único para enlazar el título (puede haber más de un modal montado).
  const idTitulo = useId()

  // Sincroniza la prop `abierto` con el estado real del <dialog>.
  useEffect(() => {
    const dialog = dialogRef.current
    if (abierto && !dialog.open) dialog.showModal()
    if (!abierto && dialog.open) dialog.close()
  }, [abierto])

  // Esc dispara el evento "cancel"; se evita que el <dialog> se cierre solo
  // para que sea el padre (vía `abierto`) quien controle el estado.
  const manejarEsc = (e) => {
    e.preventDefault()
    if (!ocupado) onCancelar()
  }

  // Un clic sobre el fondo oscuro llega con target = el propio <dialog>.
  const manejarClicFondo = (e) => {
    if (e.target === dialogRef.current && !ocupado) onCancelar()
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={manejarEsc}
      onClick={manejarClicFondo}
      aria-labelledby={idTitulo}
      className="w-full max-w-sm rounded-xl bg-white p-0 shadow-xl backdrop:bg-slate-900/40"
    >
      <div className="p-6">
        <h2 id={idTitulo} className="text-base font-semibold text-slate-900">
          {titulo}
        </h2>
        {mensaje && <div className="mt-2 text-sm text-slate-600">{mensaje}</div>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={ocupado}
            className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={ocupado}
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${CLASES_TONO[tono]}`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default ConfirmDialog
