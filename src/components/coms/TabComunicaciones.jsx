/**
 * TabComunicaciones.jsx
 * ---------------------------------------------------------------------------
 * Vista completa de la pestaña "Coms" dentro del módulo Medidores: combina
 * el menú lateral de secciones (ComsSidebar) con el formulario de
 * configuración de comunicaciones (ConfiguracionComunicaciones).
 *
 * Rol en el sistema:
 * Es un componente de composición/layout; no maneja estado propio. Solo
 * reenvía el medidor seleccionado y el usuario logueado al formulario, que
 * es quien consulta el WebService y aplica los permisos por rol.
 */
import ComsSidebar from './ComsSidebar'
import ConfiguracionComunicaciones from '../medidores/ConfiguracionComunicaciones'

// Props:
// - medidor: medidor seleccionado en el catálogo.
// - usuarioLogueado: usuario autenticado (para permisos por rol).
// - soloLectura: si es true la configuración no se puede editar, ni el Administrador.
function TabComunicaciones({ medidor, usuarioLogueado, soloLectura = false }) {
  return (
    // Contenedor con scroll propio, para pantallas donde el formulario sea más alto que el viewport.
    <div className="flex-1 overflow-auto p-6">
      {/* En pantallas grandes (lg+), sidebar y formulario se muestran lado a lado;
          en pantallas pequeñas, se apilan en columna. */}
      <div className="flex flex-col lg:flex-row gap-6 lg:items-start w-full">
        <ComsSidebar />

        {/* Formulario (ya incluye su propia tarjeta blanca y título). */}
        <div className="w-full lg:w-3/4 xl:w-4/5">
          <ConfiguracionComunicaciones medidor={medidor} usuarioLogueado={usuarioLogueado} soloLectura={soloLectura} />
        </div>
      </div>
    </div>
  )
}

export default TabComunicaciones
