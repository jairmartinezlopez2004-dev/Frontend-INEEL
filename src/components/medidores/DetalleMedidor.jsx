/**
 * DetalleMedidor.jsx
 * ---------------------------------------------------------------------------
 * Vista de detalle de un medidor seleccionado en el Catálogo de Medidores.
 *
 * Rol en el sistema:
 * - Se monta desde GestionControladoresRF al pulsar "Detalles" en un medidor
 *   del detalle de su controlador (DetalleControlador).
 * - Muestra un encabezado fijo con los datos generales del medidor y el
 *   botón para regresar al catálogo.
 * - Debajo monta MainForm, que contiene las pestañas de solicitud de datos
 *   (Instantáneos, Valores 5M, Calidad, Consumos) y la pestaña "Coms" con la
 *   Configuración de Comunicaciones. El encabezado permanece visible sin
 *   importar la pestaña activa.
 */
import EstadoBadge from './EstadoBadge'
import MainForm from '../MainForm'

// Dato de solo lectura para el encabezado del medidor (etiqueta + valor).
function DatoMedidor({ etiqueta, valor }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{etiqueta}</dt>
      <dd className="mt-0.5 font-mono text-sm text-slate-900">{valor}</dd>
    </div>
  )
}

// Props:
// - medidor: objeto { id, idCtrlRF, nombreControlador, dirRed, dirRF, descripcion, edo, dirIP }
//   elegido en el catálogo (ver medidoresService.js).
// - usuarioLogueado: usuario autenticado (se reenvía a las pestañas para los permisos por rol).
// - onVolver: callback para regresar a la vista anterior.
// - textoVolver: texto del enlace de regreso (p. ej. "Volver a RF PRUEBA").
export default function DetalleMedidor({
  medidor,
  usuarioLogueado,
  onVolver,
  textoVolver = 'Volver',
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* ── Encabezado: regreso al catálogo + datos generales del medidor ── */}
      <div className="shrink-0 rounded-xl bg-white p-4 shadow-md md:p-6">
        <button
          type="button"
          onClick={onVolver}
          className="mb-3 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          ← {textoVolver}
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">{medidor.descripcion}</h2>
          <EstadoBadge edo={medidor.edo} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-4">
          <DatoMedidor etiqueta="Controlador RF" valor={medidor.nombreControlador} />
          <DatoMedidor etiqueta="Dir. Red" valor={medidor.dirRed} />
          <DatoMedidor etiqueta="Dir. RF" valor={medidor.dirRF} />
          <DatoMedidor etiqueta="Dirección IP" valor={medidor.dirIP} />
        </dl>
      </div>

      {/* ── Pestañas del medidor (Instantáneos, Valores 5M, Calidad, Consumos, Coms) ── */}
      {/* Sin tarjeta envolvente: cada pestaña ya dibuja sus propias tarjetas. */}
      <MainForm medidor={medidor} usuarioLogueado={usuarioLogueado} />
    </div>
  )
}
