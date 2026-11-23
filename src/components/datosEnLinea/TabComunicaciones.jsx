/**
 * TabComunicaciones.jsx
 * ---------------------------------------------------------------------------
 * Vista completa de la pestaña "Coms" dentro del módulo Medidores: combina
 * la tarjeta de conexión con el medidor (ConexionMedidor, solo
 * SuperAdministrador y Administrador) y el formulario de configuración de
 * comunicaciones (ConfiguracionComunicaciones), a todo el ancho.
 *
 * El menú lateral que tenía ("Transporte Protocolo", "MedidorQP" y "Visor
 * RxTx", solo decorativo) se retiró a petición del usuario.
 *
 * Rol en el sistema:
 * Es un componente de composición/layout; no maneja estado propio. Solo
 * reenvía el medidor seleccionado y el usuario logueado al formulario, que
 * es quien consulta el WebService y aplica los permisos por rol.
 */
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
    <div className="flex-1 overflow-auto pt-4">
      {/* Conexión (solo administradores) y formulario, uno debajo del otro a
          todo el ancho; cada uno trae su propia tarjeta blanca y título. */}
      <div className="flex w-full flex-col gap-6">
        {/* key: al cambiar de medidor se pide conectar de nuevo. */}
        {esAdmin && <ConexionMedidor key={medidor.id} medidor={medidor} />}
        <ConfiguracionComunicaciones medidor={medidor} usuarioLogueado={usuarioLogueado} soloLectura={soloLectura} />
      </div>
    </div>
  )
}

export default TabComunicaciones
