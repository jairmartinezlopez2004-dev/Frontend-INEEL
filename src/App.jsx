/**
 * App.jsx
 * ---------------------------------------------------------------------------
 * Componente raíz del Visor SISMEDIA-RT.
 *
 * Rol en el sistema:
 * - Controla el flujo de autenticación: mientras no haya un usuario logueado
 *   (currentUser === null) muestra únicamente <Login />, sin importar la URL;
 *   al iniciar sesión se muestra la vista que pide esa URL.
 * - Define las rutas de la aplicación (React Router). La URL es la que decide
 *   qué vista se ve, de modo que los botones Atrás / Adelante del navegador,
 *   recargar la página o abrir un enlace guardado muestran siempre la vista
 *   que corresponde a la dirección:
 *
 *     /                                      Vista principal (tipo de consulta)
 *     /configuracion/<módulo>                Base de Datos (configuración)
 *     /configuracion/controladores-rf/3      Controlador 3 con sus medidores
 *     /configuracion/controladores-rf/3/medidores/12   Detalle del medidor 12
 *     /en-linea/controladores-rf[/…]         Datos en línea (solo lectura)
 *     /perfiles-5m/mediciones                Perfiles 5 Minutales
 *
 *   Los módulos de configuración son: controladores-rf, eventos,
 *   eventos-registrados, unidades, puntos-io, grupos-funcionales-io,
 *   grupos-electricos-io y usuarios (solo Administrador).
 * - Guarda el estado global de la UI: usuario autenticado y visibilidad del
 *   menú lateral, que se pasan como props a los componentes que los usan.
 */
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router'
import Login from './components/auth/Login'
import LayoutSistema from './components/main/LayoutSistema'
import SeleccionConsulta from './components/inicio/SeleccionConsulta'
import AvisoExpiracionSesion from './components/auth/AvisoExpiracionSesion'
import GestionUsuarios from './components/usuarios/GestionUsuarios'
import GestionControladoresRF from './components/controladoresRF/GestionControladoresRF'
import GestionEventos from './components/eventos/GestionEventos'
import GestionEventosRegistrados from './components/eventosReg/GestionEventosRegistrados'
import GestionUnidades from './components/unidades/GestionUnidades'
import GestionPuntosIO from './components/puntosIO/GestionPuntosIO'
import GestionGruposIO from './components/gruposIO/GestionGruposIO'
import ConsultaPerfiles5M from './components/perfiles5m/ConsultaPerfiles5M'
import { restaurarSesion, cerrarSesion } from './services/authService'

// rolId del Administrador en la UI (ver ROL_IDS en services/authService.js).
const ROL_ADMINISTRADOR = 2

// Rutas de las tres pantallas del flujo de Controladores RF (relativas al
// tipo de consulta). Las tres montan GestionControladoresRF, que decide qué
// nivel mostrar según los parámetros de la URL.
const RUTAS_CONTROLADORES = [
  'controladores-rf',
  'controladores-rf/:idControlador',
  'controladores-rf/:idControlador/medidores/:idMedidor',
]

function App() {
  const navigate = useNavigate()
  // Usuario autenticado actual. null = nadie ha iniciado sesión todavía.
  // Se llena con el objeto que arma authService.js a partir de la respuesta
  // de /Auth/login o /Auth/perfil (nombre, apellido, rol, iniciales, etc.).
  const [currentUser, setCurrentUser] = useState(null)
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

  // Cierra la sesión: borra el token, colapsa el menú y vuelve a la vista
  // principal, para que el siguiente inicio de sesión empiece desde ahí.
  const handleLogout = () => {
    cerrarSesion()
    setCurrentUser(null)
    setIsSidebarOpen(false)
    navigate('/', { replace: true })
  }

  if (verificandoSesion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Verificando sesión…
      </div>
    )
  }

  // Sin sesión solo se muestra el Login. `setCurrentUser` se pasa directo como
  // `onLoginSuccess`, de modo que el usuario que arma Login.jsx queda aquí.
  if (!currentUser) {
    return <Login onLoginSuccess={setCurrentUser} />
  }

  const esAdmin = currentUser.rolId === ROL_ADMINISTRADOR

  // Props comunes del marco (header + menú lateral) de ambos tipos de consulta.
  const propsLayout = {
    currentUser,
    esAdmin,
    isSidebarOpen,
    onToggleSidebar: () => setIsSidebarOpen((prev) => !prev),
    onLogout: handleLogout,
  }

  // Rutas del flujo de Controladores RF (lista -> controlador -> medidor).
  // `soloLectura` = true en "Datos en línea": nadie da de alta ni edita.
  const rutasControladores = (rutaBase, soloLectura) =>
    RUTAS_CONTROLADORES.map((ruta) => (
      <Route
        key={ruta}
        path={ruta}
        element={
          <GestionControladoresRF
            esAdmin={esAdmin}
            usuarioLogueado={currentUser}
            soloLectura={soloLectura}
            rutaBase={`${rutaBase}/controladores-rf`}
          />
        }
      />
    ))

  return (
    <>
      {/* Aviso "tu sesión caduca en 1 minuto" y cierre automático al expirar
          el token (ver AvisoExpiracionSesion.jsx). */}
      <AvisoExpiracionSesion onRenovada={setCurrentUser} onExpirada={handleLogout} />

      <Routes>
        {/* Vista principal: "¿Consultar datos por medio de?:". Cada tarjeta
            navega a la ruta de su tipo de consulta. */}
        <Route
          path="/"
          element={
            <SeleccionConsulta
              currentUser={currentUser}
              onSeleccionar={(ruta) => navigate(ruta)}
              onLogout={handleLogout}
            />
          }
        />

        {/* Opción "Base de Datos (configuración)": todos los módulos.
            (Espacio reservado: aquí se ajustará esta vista en los siguientes pasos.) */}
        <Route path="/configuracion" element={<LayoutSistema rutaBase="/configuracion" {...propsLayout} />}>
          <Route index element={<Navigate to="controladores-rf" replace />} />
          {/* Controladores RF: lista -> controlador con sus medidores -> medidor.
              Todos consultan; solo el Administrador da de alta y edita. */}
          {rutasControladores('/configuracion', false)}
          {/* Eventos configurados: todos consultan; solo el Administrador da de
              alta y edita (la baja es marcarlo inactivo). */}
          <Route path="eventos" element={<GestionEventos esAdmin={esAdmin} />} />
          {/* Eventos registrados: historial de solo consulta. */}
          <Route path="eventos-registrados" element={<GestionEventosRegistrados />} />
          {/* Unidades: todos consultan; solo el Administrador da de alta y edita. */}
          <Route path="unidades" element={<GestionUnidades esAdmin={esAdmin} />} />
          {/* Puntos IO: todos consultan; solo el Administrador edita, y cada
              edición se confirma con su contraseña. */}
          <Route path="puntos-io" element={<GestionPuntosIO esAdmin={esAdmin} />} />
          {/* Grupos funcionales / eléctricos IO: catálogos con los que se
              clasifican los puntos IO. `key` separa el estado de cada catálogo. */}
          <Route
            path="grupos-funcionales-io"
            element={<GestionGruposIO key="funcional" tipo="funcional" esAdmin={esAdmin} />}
          />
          <Route
            path="grupos-electricos-io"
            element={<GestionGruposIO key="electrico" tipo="electrico" esAdmin={esAdmin} />}
          />
          {/* Usuarios: solo Administrador; para otro rol la ruta no existe y
              cae en la redirección de abajo. */}
          {esAdmin && <Route path="usuarios" element={<GestionUsuarios />} />}
          {/* Módulo desconocido (o sin permiso): se regresa a Controladores RF. */}
          <Route path="*" element={<Navigate to="controladores-rf" replace />} />
        </Route>

        {/* Opción "Datos en línea": el mismo marco, con el menú limitado al
            flujo de Controladores RF y en modo solo lectura. */}
        <Route
          path="/en-linea"
          element={<LayoutSistema rutaBase="/en-linea" rutasVisibles={['controladores-rf']} {...propsLayout} />}
        >
          <Route index element={<Navigate to="controladores-rf" replace />} />
          {rutasControladores('/en-linea', true)}
          <Route path="*" element={<Navigate to="controladores-rf" replace />} />
        </Route>

        {/* Opción "Perfiles 5 Minutales": consulta de solo lectura de las
            mediciones de cinco minutos de cualquier medidor. */}
        <Route
          path="/perfiles-5m"
          element={<LayoutSistema rutaBase="/perfiles-5m" rutasVisibles={['mediciones']} {...propsLayout} />}
        >
          <Route index element={<Navigate to="mediciones" replace />} />
          <Route path="mediciones" element={<ConsultaPerfiles5M />} />
          <Route path="*" element={<Navigate to="mediciones" replace />} />
        </Route>

        {/* Cualquier otra dirección vuelve a la vista principal. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
