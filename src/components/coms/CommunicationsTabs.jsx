/**
 * CommunicationsTabs.jsx
 * ---------------------------------------------------------------------------
 * Barra de pestañas horizontal usada por MainForm.jsx para navegar entre los
 * distintos Tabs del módulo Medidores (Instantáneos, Valores 5M, Calidad,
 * Consumos, Coms).
 *
 * Rol en el sistema:
 * Componente puramente de navegación/UI: no guarda su propio estado, recibe
 * la pestaña activa y notifica los cambios hacia MainForm.jsx (elevación de
 * estado). No tiene relación con el WebService.
 */

// Catálogo estático de pestañas disponibles en el módulo Medidores.
const TABS = ['Instantáneos', 'Valores 5M', 'Calidad', 'Consumos', 'Coms']

// Props:
// - activeTab: nombre de la pestaña actualmente seleccionada (controlado por MainForm.jsx).
// - onTabChange: callback que MainForm.jsx usa para cambiar la pestaña activa.
function CommunicationsTabs({ activeTab, onTabChange }) {
  return (
    // Contenedor con scroll horizontal para que las pestañas quepan en pantallas angostas.
    <div className="overflow-x-auto border-b border-gray-200 bg-gray-100 px-4 pt-2">
      <nav className="flex gap-1">
        {TABS.map((tab) => {
          // Resalta la pestaña activa con un borde inferior y fondo blanco.
          const isActive = tab === activeTab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`whitespace-nowrap rounded-t-md border-b-2 px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'border-indigo-600 bg-white text-indigo-600'
                  : 'border-transparent text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              {tab}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default CommunicationsTabs
