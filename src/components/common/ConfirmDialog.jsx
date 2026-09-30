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
import { useEffect, useRef } from 'react'

// Props:
// - abierto: booleano que muestra u oculta el modal.
// - titulo: encabezado del modal.
// - mensaje: texto explicativo debajo del título.
// - textoConfirmar / textoCancelar: etiquetas de los botones.
// - onConfirmar: callback al aceptar.
// - onCancelar: callback al cancelar (botón, tecla Esc o clic fuera del modal).
function ConfirmDialog({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Aceptar',
  textoCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
}) {
  const dialogRef = useRef(null)

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
    onCancelar()
  }

  // Un clic sobre el fondo oscuro llega con target = el propio <dialog>.
  const manejarClicFondo = (e) => {
    if (e.target === dialogRef.current) onCancelar()
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={manejarEsc}
      onClick={manejarClicFondo}
      aria-labelledby="confirm-dialog-titulo"
      className="w-full max-w-sm rounded-xl bg-white p-0 shadow-xl backdrop:bg-slate-900/40"
    >
      <div className="p-6">
        <h2 id="confirm-dialog-titulo" className="text-base font-semibold text-slate-900">
          {titulo}
        </h2>
        {mensaje && <p className="mt-2 text-sm text-slate-600">{mensaje}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default ConfirmDialog
