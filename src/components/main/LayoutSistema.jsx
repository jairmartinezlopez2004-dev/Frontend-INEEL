/**
 * LayoutSistema.jsx
 * ---------------------------------------------------------------------------
 * Marco común de las vistas "Base de Datos (configuración)", "Perfiles 5
 * Minutales" y "Datos en línea": header, menú lateral, área de contenido,
 * barra de estado y footer.
 *
 * El módulo que se muestra en el área de contenido lo decide la URL: React
 * Router lo dibuja en el <Outlet /> según la ruta hija que coincida (ver
 * App.jsx). Así la vista siempre corresponde a la dirección del navegador,
 * también al usar Atrás / Adelante o al recargar la página.
 *
 * El menú lateral se guarda solo: con él abierto, un clic en cualquier parte
 * de la pantalla (el contenido o una opción del propio menú) lo cierra.
 */
import { useEffect } from 'react'
import { Outlet } from 'react-router'
import Header from './Header'
import Sidebar from './Sidebar'
import StatusBar from './StatusBar'

// Props:
// - rutaBase: prefijo del tipo de consulta ('/configuracion', '/en-linea' o '/perfiles-5m').
// - rutasVisibles: (opcional) módulos que se muestran en el menú lateral.
// - currentUser: usuario autenticado (para el Header).
// - esAdmin: si es true el menú muestra las opciones solo para Administrador.
// - isSidebarOpen / onToggleSidebar / onCloseSidebar: estado del menú lateral (vive en App.jsx).
// - onLogout: callback para cerrar la sesión.
export default function LayoutSistema({
  rutaBase,
  rutasVisibles,
  currentUser,
  esAdmin,
  isSidebarOpen,
  onToggleSidebar,
  onCloseSidebar,
  onLogout,
}) {
  // Con el menú abierto, cualquier clic lo cierra. Se excluye el botón
  // hamburguesa, que ya lo alterna por su cuenta.
  useEffect(() => {
    if (!isSidebarOpen) return undefined

    const alHacerClic = (evento) => {
      if (evento.target.closest?.('[data-boton-menu]')) return
      onCloseSidebar()
    }

    document.addEventListener('click', alHacerClic)
    return () => document.removeEventListener('click', alHacerClic)
    // onCloseSidebar se omite a propósito: App.jsx la crea de nuevo en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSidebarOpen])

  return (
    // Contenedor raíz: ocupa toda la pantalla y organiza el layout en columna
    // (header arriba, contenido al centro, barras de estado/footer abajo).
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50">
      {/* Encabezado corporativo: logo, título del sistema, botón de menú
          hamburguesa y el perfil del usuario autenticado (ver Header.jsx). */}
      <Header
        currentUser={currentUser}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
        onLogout={onLogout}
      />

      {/* ÁREA INFERIOR: Menú Lateral + Contenido */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar rutaBase={rutaBase} isOpen={isSidebarOpen} esAdmin={esAdmin} rutasVisibles={rutasVisibles} />

        {/* CONTENIDO PRINCIPAL: el módulo de la ruta actual. */}
        <main className="relative flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <StatusBar />

      {/* FOOTER INSTITUCIONAL */}
      <footer className="w-full shrink-0 border-t border-slate-800 bg-slate-900 py-2 text-center text-[11px] font-medium tracking-wide text-slate-400">
        © 2026 Instituto Nacional de Electricidad y Energías Limpias (INEEL). Visor de Calidad de la Potencia v1.0.1.
      </footer>
    </div>
  )
}
