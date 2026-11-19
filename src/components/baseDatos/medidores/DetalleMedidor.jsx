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
import MainForm from '../../datosEnLinea/MainForm'
import { ArrowLeft, Gauge } from 'lucide-react'
import TituloSeccion from '../../common/TituloSeccion'
import {
  CLASE_DATOS_AZUL, CLASE_ENCABEZADO_AZUL, CLASE_ETIQUETA_DATO_AZUL, CLASE_TARJETA_AZUL, CLASE_VALOR_DATO_AZUL,
  CLASE_VOLVER_AZUL,
} from '../../common/clasesEncabezado'

// Dato de solo lectura para el encabezado del medidor (etiqueta + valor).
function DatoMedidor({ etiqueta, valor }) {
  return (
    <div>
      <dt className={CLASE_ETIQUETA_DATO_AZUL}>{etiqueta}</dt>
      <dd className={CLASE_VALOR_DATO_AZUL}>{valor}</dd>
    </div>
  )
}

// Props:
// - medidor: objeto { id, idCtrlRF, nombreControlador, dirRed, dirRF, descripcion, edo, dirIP }
//   elegido en el catálogo (ver medidoresService.js).
// - usuarioLogueado: usuario autenticado (se reenvía a las pestañas para los permisos por rol).
// - soloLectura: si es true las pestañas no permiten editar, ni al Administrador.
// - onVolver: callback para regresar a la vista anterior.
// - textoVolver: texto del enlace de regreso (p. ej. "Volver a RF PRUEBA").
export default function DetalleMedidor({
  medidor,
  usuarioLogueado,
  soloLectura = false,
  onVolver,
  textoVolver = 'Volver',
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* ── Encabezado: regreso al catálogo + datos generales del medidor ── */}
      <div className={CLASE_TARJETA_AZUL}>
        {/* Parte superior: regreso + nombre y estado del medidor. */}
        <div className={CLASE_ENCABEZADO_AZUL}>
          <button type="button" onClick={onVolver} className={CLASE_VOLVER_AZUL}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {textoVolver}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <TituloSeccion Icono={Gauge} etiqueta="Medidor" titulo={medidor.descripcion} mayusculas={false} invertido />
            <EstadoBadge edo={medidor.edo} />
          </div>
        </div>

        <dl className={CLASE_DATOS_AZUL}>
          <DatoMedidor etiqueta="Controlador RF" valor={medidor.nombreControlador} />
          <DatoMedidor etiqueta="Dir. Red" valor={medidor.dirRed} />
          <DatoMedidor etiqueta="Dir. RF" valor={medidor.dirRF} />
          <DatoMedidor etiqueta="Dirección IP" valor={medidor.dirIP} />
        </dl>
      </div>

      {/* ── Pestañas del medidor (Instantáneos, Valores 5M, Calidad, Consumos, Coms) ── */}
      {/* Sin tarjeta envolvente: cada pestaña ya dibuja sus propias tarjetas. */}
      <MainForm medidor={medidor} usuarioLogueado={usuarioLogueado} soloLectura={soloLectura} />
    </div>
  )
}
