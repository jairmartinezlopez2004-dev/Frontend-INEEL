/**
 * MainForm.jsx
 * ---------------------------------------------------------------------------
 * Contenedor del módulo "Medidores": agrupa las pestañas de configuración y
 * lectura de un medidor (Comunicaciones, Instantáneos, Valores 5M, Calidad, Fasores,
 * Consumos).
 *
 * Rol en el sistema:
 * Mantiene internamente cuál es la pestaña activa y, según ese valor,
 * renderiza el componente de contenido correspondiente. Es el componente
 * "orquestador" de las distintas vistas relacionadas con un medidor.
 *
 * Se monta dentro de DetalleMedidor.jsx, es decir, siempre trabaja sobre el
 * medidor seleccionado en el Catálogo de Medidores.
 *
 * No se comunica directamente con el WebService; delega esa responsabilidad
 * a cada Tab hijo (por ejemplo, TabInstantaneos, TabValores5M, etc.).
 */
import { useState } from 'react'
import CommunicationsTabs from './CommunicationsTabs'
import TabComunicaciones from './TabComunicaciones'
import TabInstantaneos from './TabInstantaneos'
import TabValores5M from './TabValores5M'
import TabCalidad from './TabCalidad'
import TabConsumos from './TabConsumos'
import TabFasores from './TabFasores'
import TabArmonicos from './TabArmonicos'
import TabEventosMedidor from './TabEventosMedidor'
import TabPuntosAjuste from './TabPuntosAjuste'

// Lista de pestañas que ya cuentan con una vista maquetada/funcional.
// Se usa para mostrar el mensaje de "en construcción" en cualquier pestaña
// futura que aún no tenga un componente asociado.
const TABS_MAQUETADAS = ['Coms', 'Instantáneos', 'Valores 5M', 'Calidad', 'Fasores', 'Consumos', 'Eventos', 'Armónicos', 'Puntos de ajuste']

// rolId del SuperAdministrador y del Administrador: los únicos que ven Puntos de ajuste.
const ROLES_ADMINISTRADOR = [1, 2]

// Props:
// - medidor: medidor seleccionado en el catálogo (se reenvía a las pestañas).
// - usuarioLogueado: usuario autenticado (para permisos por rol).
// - soloLectura: si es true las pestañas no permiten editar, ni al Administrador.
function MainForm({ medidor, usuarioLogueado, soloLectura = false }) {
  // Nombre de la pestaña actualmente seleccionada dentro del módulo Medidores.
  const [activeTab, setActiveTab] = useState('Coms')
  const esAdmin = ROLES_ADMINISTRADOR.includes(usuarioLogueado?.rolId)

  return (
    <div className="flex h-full flex-col">
      {/* Barra de pestañas (Coms, Instantáneos, Valores 5M, Calidad, Fasores, Consumos, Eventos, Armónicos, Puntos de ajuste). */}
      <CommunicationsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pestanasOcultas={esAdmin ? [] : ['Puntos de ajuste']}
      />

      {/* Renderizado condicional de vistas: solo se monta el Tab que coincide
          con la pestaña activa, para no mantener en memoria/DOM los demás. */}
      {activeTab === 'Coms' && (
        <TabComunicaciones medidor={medidor} usuarioLogueado={usuarioLogueado} soloLectura={soloLectura} />
      )}
      {activeTab === 'Instantáneos' && <TabInstantaneos />}
      {activeTab === 'Valores 5M' && <TabValores5M />}
      {activeTab === 'Calidad' && <TabCalidad />}
      {activeTab === 'Fasores' && <TabFasores />}
      {activeTab === 'Consumos' && <TabConsumos />}
      {activeTab === 'Eventos' && <TabEventosMedidor medidor={medidor} />}
      {activeTab === 'Armónicos' && <TabArmonicos />}
      {/* Puntos de ajuste: solo administradores, e ignora `soloLectura` porque siempre modifican. */}
      {activeTab === 'Puntos de ajuste' && esAdmin && <TabPuntosAjuste usuarioLogueado={usuarioLogueado} />}
      {!TABS_MAQUETADAS.includes(activeTab) && (
        <div className="flex flex-1 items-center justify-center p-6 text-gray-400">
          Módulo {activeTab} en construcción
        </div>
      )}
    </div>
  )
}

export default MainForm
