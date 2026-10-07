/**
 * Header.jsx
 * ---------------------------------------------------------------------------
 * Encabezado superior de la aplicación (estilo "Gmail"), visible solo cuando
 * el usuario ya inició sesión.
 *
 * Rol en el sistema:
 * - Muestra el logotipo institucional y el título del sistema.
 * - Contiene el botón "hamburguesa" que colapsa/expande el Sidebar.
 * - Muestra el perfil del usuario autenticado (nombre completo, rol e
 *   iniciales) y el botón de "Cerrar sesión" en la esquina superior derecha.
 *
 * Integración con el WebService / manejo de roles:
 * Este componente NO calcula ni transforma los datos del usuario; solo los
 * recibe ya procesados a través de la prop `currentUser` (objeto armado en
 * services/authService.js a partir de la respuesta de /Auth/login o
 * /Auth/perfil) y los pinta en pantalla. Es un componente puramente de
 * presentación en lo que a datos de usuario se refiere.
 */
import { useState } from 'react'
import ConfirmDialog from './common/ConfirmDialog'

const SYSTEM_TITLE = ' MEDICIÓN CALIDAD DE LA POTENCIA INEEL V1.0.1'

// Ícono de menú hamburguesa (SVG) usado en el botón de colapsar/expandir el Sidebar.
function HamburgerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-6 w-6"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

// Ícono de "salir" (SVG) usado en el botón de cerrar sesión.
function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

// Props:
// - currentUser: objeto { nombre, apellido, rolId, rol, iniciales } que llega desde App.jsx.
// - isSidebarOpen: booleano que indica si el menú lateral está expandido (afecta el aria-label del botón).
// - onToggleSidebar: callback que App.jsx usa para alternar la visibilidad del Sidebar.
// - onLogout: callback que App.jsx usa para cerrar la sesión y volver al Login.
function Header({ currentUser, isSidebarOpen, onToggleSidebar, onLogout }) {
  // true mientras se muestra la confirmación de "¿Cerrar sesión?".
  const [confirmandoSalida, setConfirmandoSalida] = useState(false)

  return (
    // Barra superior fija con logo a la izquierda y perfil de usuario a la derecha (layout tipo Gmail).
    <header className="z-20 flex h-16 w-full shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        {/* Botón que colapsa/expande el menú lateral (Sidebar) mediante onToggleSidebar. */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
          aria-pressed={isSidebarOpen}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <HamburgerIcon />
        </button>

        {/* Logotipo institucional del INEEL. El PNG trae margen blanco alrededor,
            por eso se usa h-14 (56 px) en un header de 64 px: el logo visible
            queda en ~48 px, el tamaño habitual en una barra superior. */}
        <img
          src="/logo-ineel-texto.png"
          alt="INEEL"
          className="h-14 w-auto shrink-0 object-contain"
        />

        {/* Título del sistema, oculto en pantallas muy pequeñas para no saturar el header. */}
        <div className="hidden min-w-0 border-l border-gray-200 pl-4 leading-tight sm:block">
          <h1 className="truncate text-sm font-bold uppercase tracking-wide text-slate-800 sm:text-base">
            {SYSTEM_TITLE}
          </h1>
        </div>
      </div>

      {/* Esquina superior derecha: perfil del usuario + botón de cerrar sesión. */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Bloque de perfil del usuario autenticado. */}
        <div className="flex shrink-0 select-none items-center gap-3 rounded-lg p-2 transition-colors duration-200 hover:bg-slate-100 cursor-pointer">
          <div className="text-right leading-tight">
            {/* Nombre completo dinámico: se concatena nombre + apellido que llegaron del WebService. */}
            <p className="text-sm font-medium text-gray-800">
              {currentUser.nombre} {currentUser.apellido}
            </p>
            {/* Rol en texto ("Administrador" o "Usuario"), ya traducido desde el RolID numérico. */}
            <p className="text-xs text-gray-500">{currentUser.rol}</p>
          </div>
          {/* Círculo con las iniciales del usuario (ej. "OM"), calculadas en Login.jsx. */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            {currentUser.iniciales}
          </div>
        </div>

        {/* Botón para cerrar sesión: primero pide confirmación; al aceptar,
            borra el token y regresa al Login (ver App.jsx). */}
        <button
          type="button"
          onClick={() => setConfirmandoSalida(true)}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogoutIcon />
        </button>
      </div>

      <ConfirmDialog
        abierto={confirmandoSalida}
        titulo="¿Cerrar sesión?"
        mensaje="Tendrás que volver a ingresar tu correo y contraseña para entrar."
        textoConfirmar="Cerrar sesión"
        onConfirmar={onLogout}
        onCancelar={() => setConfirmandoSalida(false)}
      />
    </header>
  )
}

export default Header
