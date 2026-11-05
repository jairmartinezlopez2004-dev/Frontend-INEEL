/**
 * TabComunicaciones.jsx
 * ---------------------------------------------------------------------------
 * Vista completa de la pestaña "Coms" dentro del módulo Medidores: combina
 * el menú lateral de secciones (ComsSidebar), la tarjeta de conexión con el
 * medidor (ConexionMedidor, solo SuperAdministrador y Administrador) y el
 * formulario de configuración de comunicaciones (ConfiguracionComunicaciones).
 *
 * Rol en el sistema:
 * Es un componente de composición/layout; no maneja estado propio. Solo
 * reenvía el medidor seleccionado y el usuario logueado al formulario, que
 * es quien consulta el WebService y aplica los permisos por rol.
 */
import ComsSidebar from './ComsSidebar'
import ConfiguracionComunicaciones from '../baseDatos/medidores/ConfiguracionComunicaciones'
import ConexionMedidor from './ConexionMedidor'

// rolId del SuperAdministrador y del Administrador en la UI (authService.js).
const ROLES_ADMINISTRADOR = [1, 2]

// Props:
// - medidor: medidor seleccionado en el catálogo.
// - usuarioLogueado: usuario autenticado (para permisos por rol).
// - soloLectura: si es true la configuración no se puede editar, ni el Administrador.
function TabComunicaciones({ medidor, usuarioLogueado, soloLectura = false }) {
  const esAdmin = ROLES_ADMINISTRADOR.includes(usuarioLogueado?.rolId)

  return (
    // Contenedor con scroll propio, para pantallas donde el formulario sea más alto que el viewport.
    <div className="flex-1 overflow-auto p-6">
      {/* En pantallas grandes (lg+), sidebar y formulario se muestran lado a lado;
          en pantallas pequeñas, se apilan en columna. */}
      <div className="flex flex-col lg:flex-row gap-6 lg:items-start w-full">
        <ComsSidebar />

        {/* Conexión (solo administradores) y formulario; cada uno trae su propia tarjeta blanca y título. */}
        <div className="flex w-full flex-col gap-6 lg:w-3/4 xl:w-4/5">
          {esAdmin && <ConexionMedidor medidor={medidor} />}
          <ConfiguracionComunicaciones medidor={medidor} usuarioLogueado={usuarioLogueado} soloLectura={soloLectura} />
        </div>
      </div>
    </div>
  )
}

export default TabComunicaciones
