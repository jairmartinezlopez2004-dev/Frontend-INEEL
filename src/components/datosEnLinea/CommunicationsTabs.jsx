/**
 * CommunicationsTabs.jsx
 * ---------------------------------------------------------------------------
 * Barra de pestañas horizontal usada por MainForm.jsx para navegar entre los
 * distintos Tabs del módulo Medidores (Instantáneos, Valores 5M, Calidad, Fasores,
 * Consumos, Eventos, Armónicos, Puntos de ajuste, Coms).
 *
 * Rol en el sistema:
 * Componente puramente de navegación/UI: no guarda su propio estado, recibe
 * la pestaña activa y notifica los cambios hacia MainForm.jsx (elevación de
 * estado). No tiene relación con el WebService.
 */
import {
  AudioWaveform, BellRing, Compass, PlugZap, RadioTower, SlidersHorizontal, Timer, Waves, Zap,
} from 'lucide-react'

// Catálogo estático de pestañas disponibles en el módulo Medidores.
const TABS = ['Instantáneos', 'Valores 5M', 'Calidad', 'Fasores', 'Consumos', 'Eventos', 'Armónicos', 'Puntos de ajuste', 'Coms']

// Ícono (lucide-react) de cada pestaña.
const ICONOS = {
  Instantáneos: Zap,
  'Valores 5M': Timer,
  Calidad: Waves,
  Fasores: Compass,
  Consumos: PlugZap,
  Eventos: BellRing,
  Armónicos: AudioWaveform,
  'Puntos de ajuste': SlidersHorizontal,
  Coms: RadioTower,
}

// Props:
// - activeTab: nombre de la pestaña actualmente seleccionada (controlado por MainForm.jsx).
// - onTabChange: callback que MainForm.jsx usa para cambiar la pestaña activa.
// - pestanasOcultas: pestañas que no se muestran (por ejemplo, según el rol).
function CommunicationsTabs({ activeTab, onTabChange, pestanasOcultas = [] }) {
  return (
    // Contenedor con scroll horizontal para que las pestañas quepan en pantallas angostas.
    <div className="overflow-x-auto rounded-xl bg-azul-800 px-2 shadow-sm">
      <nav className="flex gap-1">
        {TABS.filter((tab) => !pestanasOcultas.includes(tab)).map((tab) => {
          // Resalta la pestaña activa con un borde inferior azul.
          const isActive = tab === activeTab
          const Icono = ICONOS[tab]
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`flex cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-verde-400 text-white'
                  : 'border-transparent text-azul-200 hover:border-azul-400 hover:text-white'
              }`}
            >
              {Icono && <Icono className="h-4 w-4" aria-hidden="true" />}
              {tab}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default CommunicationsTabs
