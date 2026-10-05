/**
 * App.jsx
 * ---------------------------------------------------------------------------
 * Componente raíz del Visor SISMEDIA-RT.
 *
 * Rol en el sistema:
 * - Controla el flujo de autenticación: mientras no haya un usuario logueado
 *   (currentUser === null) muestra únicamente <Login />; en cuanto el login
 *   es exitoso, renderiza el layout completo de la aplicación (header,
 *   sidebar, contenido y barras de estado/footer).
 * - Es el "dueño" del estado global de la UI a nivel de aplicación:
 *   usuario autenticado, sección activa del menú y visibilidad del sidebar.
 *   Estos estados se pasan hacia abajo como props (elevación de estado /
 *   lifting state up) a los componentes hijos que los necesitan.
 * - Actúa como enrutador simple entre los módulos principales (Controladores
 *   RF y Usuarios) según el ítem seleccionado en el Sidebar. Los medidores se
 *   consultan dentro de su controlador (ver GestionControladoresRF.jsx).
 */
import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import StatusBar from './components/StatusBar'
import Login from './components/Login'
import GestionUsuarios from './components/usuarios/GestionUsuarios'
import GestionControladoresRF from './components/controladoresRF/GestionControladoresRF'
import Header from './components/Header'
import AvisoExpiracionSesion from './components/AvisoExpiracionSesion'
import { restaurarSesion, cerrarSesion } from './services/authService'

// Diccionario de títulos "amigables" para cada sección del menú (uso futuro,
// por ejemplo para mostrarlos en un breadcrumb o en el <title> del documento).
const PAGE_TITLES = {
  controladoresRF: 'Controladores RF',
  usuarios: 'Usuarios',
}

// rolId del Administrador en la UI (ver ROL_IDS en services/authService.js).
const ROL_ADMINISTRADOR = 2

function App() {
  // Usuario autenticado actual. null = nadie ha iniciado sesión todavía.
  // Se llena con el objeto que arma authService.js a partir de la respuesta
  // de /Auth/login o /Auth/perfil (nombre, apellido, rol, iniciales, etc.).
  const [currentUser, setCurrentUser] = useState(null)
  // Identificador del módulo/sección actualmente seleccionado en el Sidebar.
  const [activeItem, setActiveItem] = useState('controladoresRF')
  // Controla si el menú lateral (Sidebar) está expandido o colapsado.
  // Empieza colapsado al cargar la página y vuelve a colapsarse al cerrar sesión.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  // true mientras se valida el token guardado (evita que parpadee el Login al recargar).
  const [verificandoSesion, setVerificandoSesion] = useState(true)

  // Al cargar la app, si hay un token de una sesión previa se valida con
  // GET /Auth/perfil; si sigue vigente se entra directo sin pedir login.
  useEffect(() => {
    restaurarSesion()
      .then(setCurrentUser)
      .finally(() => setVerificandoSesion(false))
  }, [])

  // Cierra la sesión: borra el token y regresa a la pantalla de Login.
  // También deja la navegación en su estado inicial (Controladores RF, menú colapsado)
  // para que el siguiente inicio de sesión no herede cómo quedó la pantalla.
  const handleLogout = () => {
    cerrarSesion()
    setCurrentUser(null)
    setActiveItem('controladoresRF')
    setIsSidebarOpen(false)
  }

  // Renderizado condicional de vistas: si todavía no hay sesión iniciada,
  // se muestra solamente la pantalla de Login y no se monta el resto del layout.
  // `setCurrentUser` se pasa directo como `onLoginSuccess`, de modo que el
  // objeto de usuario que arma Login.jsx queda guardado aquí en App.jsx.
  if (verificandoSesion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Verificando sesión…
      </div>
    )
  }

  if (!currentUser) {
    return <Login onLoginSuccess={setCurrentUser} />
  }

  const esAdmin = currentUser.rolId === ROL_ADMINISTRADOR

  return (
    // Contenedor raíz de la aplicación autenticada: ocupa toda la pantalla
    // y organiza el layout en columna (header arriba, contenido al centro,
    // barras de estado/footer abajo).
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50">
      {/* Encabezado corporativo: logo, título del sistema, botón de menú
          hamburguesa y el perfil del usuario autenticado (ver Header.jsx). */}
      <Header
        currentUser={currentUser}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onLogout={handleLogout}
      />

      {/* Aviso "tu sesión caduca en 1 minuto" y cierre automático al expirar
          el token (ver AvisoExpiracionSesion.jsx). */}
      <AvisoExpiracionSesion onRenovada={setCurrentUser} onExpirada={handleLogout} />

      {/* ÁREA INFERIOR: Menú Lateral + Contenido */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR COLAPSABLE */}
        <Sidebar
          activeItem={activeItem}
          onSelectItem={setActiveItem}
          isOpen={isSidebarOpen}
          esAdmin={esAdmin}
        />

        {/* CONTENIDO PRINCIPAL DINÁMICO */}
        {/* Renderizado condicional de vistas: según el ítem activo del Sidebar
            se monta el módulo correspondiente (Controladores RF o Usuarios). */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 relative">
          {/* Módulo Controladores RF: lista -> controlador con sus medidores -> medidor.
              Todos consultan; solo el Administrador da de alta y edita. */}
          {activeItem === 'controladoresRF' && (
            <GestionControladoresRF esAdmin={esAdmin} usuarioLogueado={currentUser} />
          )}
          {/* Módulo Usuarios: solo Administrador (el Sidebar ya oculta la opción). */}
          {activeItem === 'usuarios' && esAdmin && <GestionUsuarios />}
        </main>
      </div>

      {/* STATUS BAR (Conservado de tu código) */}
      <StatusBar />

      {/* FOOTER INSTITUCIONAL (Conservado de tu código) */}
      <footer className="w-full py-2 text-center text-[11px] font-medium tracking-wide text-slate-400 border-t border-slate-800 bg-slate-900 shrink-0">
        © 2026 Instituto Nacional de Electricidad y Energías Limpias (INEEL). Visor de Calidad de la Potencia v1.0.1.
      </footer>
    </div>
  )
}

export default App
