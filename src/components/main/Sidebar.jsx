/**
 * Sidebar.jsx
 * ---------------------------------------------------------------------------
 * Menú de navegación lateral y colapsable de la aplicación.
 *
 * Rol en el sistema:
 * Permite al usuario cambiar entre los módulos principales del sistema
 * (Controladores RF, que incluye los medidores, Eventos configurados,
 * Unidades, Puntos IO, Grupos funcionales y eléctricos IO y, solo
 * para el Administrador, Usuarios). Cada opción es un enlace (NavLink de React
 * Router) a la ruta del módulo, así que la opción resaltada sale de la URL y
 * los botones Atrás / Adelante del navegador funcionan entre módulos.
 *
 * No tiene relación directa con el WebService; es puramente de navegación/UI.
 */
import { Link, NavLink } from 'react-router'

// Catálogo estático de opciones del menú lateral (segmento de ruta + etiqueta visible).
// La ruta completa es `${rutaBase}/${ruta}` (p. ej. /configuracion/unidades).
const NAV_ITEMS = [
  { ruta: 'controladores-rf', label: 'Controladores' },
  { ruta: 'eventos', label: 'Eventos configurados' },
  { ruta: 'unidades', label: 'Unidades' },
  { ruta: 'puntos-io', label: 'Puntos IO' },
  { ruta: 'grupos-funcionales-io', label: 'Grupos funcionales IO' },
  { ruta: 'grupos-electricos-io', label: 'Grupos eléctricos IO' },
  // Solo visible para el Administrador (ver prop esAdmin).
  { ruta: 'usuarios', label: 'Usuarios', soloAdmin: true },
  // Solo aparece donde `rutasVisibles` la incluye (opción Perfiles 5 Minutales).
  { ruta: 'mediciones', label: 'Mediciones 5 minutales', soloSiVisible: true },
  // Solo aparece en la opción Eventos registrados.
  { ruta: 'eventos-registrados', label: 'Eventos registrados', soloSiVisible: true },
];

// Props:
// - rutaBase: prefijo del tipo de consulta ('/configuracion', '/en-linea', '/perfiles-5m' o '/eventos').
// - isOpen: booleano que indica si el menú está expandido (ancho completo) o colapsado (ancho 0).
// - esAdmin: booleano; si es false se ocultan las opciones marcadas como soloAdmin.
// - rutasVisibles: (opcional) segmentos de NAV_ITEMS a mostrar; sin él se muestran todos.
//   "Datos en línea" lo usa para dejar solo Controladores RF.
export default function Sidebar({ rutaBase, isOpen, esAdmin, rutasVisibles }) {
  return (
    // Menú colapsable: la clase de ancho ("w-64" o "w-0") se anima con transition-[width]
    // para lograr el efecto de expandir/contraer el Sidebar.
    <aside
      className={`flex shrink-0 overflow-hidden bg-slate-900 text-slate-200 transition-[width] duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-0'
      }`}
    >
      {/* Ancho fijo interno para que el contenido no se reacomode durante la animación */}
      <div className="flex h-full w-64 flex-col">

        {/* Menú de Navegación */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {/* Regresa a la vista principal "¿Consultar datos por medio de?:". */}
          <Link
            to="/"
            className="mb-3 block w-full rounded-md border border-slate-700 px-3 py-2 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            ← Tipo de consulta
          </Link>
          {NAV_ITEMS.filter(
            (item) =>
              (!item.soloAdmin || esAdmin) &&
              (rutasVisibles ? rutasVisibles.includes(item.ruta) : !item.soloSiVisible)
          ).map((item) => (
            // NavLink marca la opción como activa cuando la URL está en esa ruta
            // o debajo de ella (p. ej. un controlador o un medidor dentro de
            // Controladores RF), para resaltarla visualmente.
            <NavLink
              key={item.ruta}
              to={`${rutaBase}/${item.ruta}`}
              className={({ isActive }) =>
                `block w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Pie del Menú (Versión) */}
        <div className="border-t border-slate-800 px-6 py-4 text-xs text-slate-500 text-center">
          v0.1.0 (SISMEDIA-RT)
        </div>
      </div>
    </aside>
  );
}
