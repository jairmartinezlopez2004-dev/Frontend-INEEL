/**
 * Sidebar.jsx
 * ---------------------------------------------------------------------------
 * Menú de navegación lateral y colapsable de la aplicación.
 *
 * Rol en el sistema:
 * Permite al usuario cambiar entre los módulos principales del sistema
 * (Medidores, Controladores RF y, solo para el Administrador, Usuarios). No maneja su propio estado de
 * navegación: recibe cuál es el ítem activo y una función para notificar
 * cambios, siguiendo el patrón de elevación de estado (el estado real vive
 * en App.jsx).
 *
 * No tiene relación directa con el WebService; es puramente de navegación/UI.
 */

// Catálogo estático de opciones del menú lateral (id interno + etiqueta visible).
const NAV_ITEMS = [
  { id: 'medidores', label: 'Medidores' },
  { id: 'controladoresRF', label: 'Controladores RF' },
  // Solo visible para el Administrador (ver prop esAdmin).
  { id: 'usuarios', label: 'Usuarios', soloAdmin: true },
];

// Props:
// - activeItem: id del módulo actualmente seleccionado (controlado por App.jsx).
// - onSelectItem: callback que App.jsx usa para cambiar el módulo activo.
// - isOpen: booleano que indica si el menú está expandido (ancho completo) o colapsado (ancho 0).
// - esAdmin: booleano; si es false se ocultan las opciones marcadas como soloAdmin.
export default function Sidebar({ activeItem, onSelectItem, isOpen, esAdmin }) {
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
          {NAV_ITEMS.filter((item) => !item.soloAdmin || esAdmin).map((item) => {
            // Determina si este botón corresponde a la sección actualmente activa,
            // para resaltarlo visualmente.
            const isActive = item.id === activeItem;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectItem(item.id)}
                className={`w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Pie del Menú (Versión) */}
        <div className="border-t border-slate-800 px-6 py-4 text-xs text-slate-500 text-center">
          v0.1.0 (SISMEDIA-RT)
        </div>
      </div>
    </aside>
  );
}
