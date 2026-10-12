/**
 * MainForm.jsx
 * ---------------------------------------------------------------------------
 * Contenedor del módulo "Medidores": agrupa las pestañas de configuración y
 * lectura de un medidor (Comunicaciones, Instantáneos, Valores 5M, Calidad,
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
import CommunicationsTabs from '../coms/CommunicationsTabs'
import TabComunicaciones from '../coms/TabComunicaciones'
import TabInstantaneos from '../instantaneos/TabInstantaneos'
import TabValores5M from '../valores5m/TabValores5M'
import TabCalidad from '../calidad/TabCalidad'
import TabConsumos from '../consumos/TabConsumos'

// Lista de pestañas que ya cuentan con una vista maquetada/funcional.
// Se usa para mostrar el mensaje de "en construcción" en cualquier pestaña
// futura que aún no tenga un componente asociado.
const TABS_MAQUETADAS = ['Coms', 'Instantáneos', 'Valores 5M', 'Calidad', 'Consumos']

// Props:
// - medidor: medidor seleccionado en el catálogo (se reenvía a las pestañas).
// - usuarioLogueado: usuario autenticado (para permisos por rol).
// - soloLectura: si es true las pestañas no permiten editar, ni al Administrador.
function MainForm({ medidor, usuarioLogueado, soloLectura = false }) {
  // Nombre de la pestaña actualmente seleccionada dentro del módulo Medidores.
  const [activeTab, setActiveTab] = useState('Coms')

  return (
    <div className="flex h-full flex-col">
      {/* Barra de pestañas (Coms, Instantáneos, Valores 5M, Calidad, Consumos). */}
      <CommunicationsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Renderizado condicional de vistas: solo se monta el Tab que coincide
          con la pestaña activa, para no mantener en memoria/DOM los demás. */}
      {activeTab === 'Coms' && (
        <TabComunicaciones medidor={medidor} usuarioLogueado={usuarioLogueado} soloLectura={soloLectura} />
      )}
      {activeTab === 'Instantáneos' && <TabInstantaneos />}
      {activeTab === 'Valores 5M' && <TabValores5M />}
      {activeTab === 'Calidad' && <TabCalidad />}
      {activeTab === 'Consumos' && <TabConsumos />}
      {!TABS_MAQUETADAS.includes(activeTab) && (
        <div className="flex flex-1 items-center justify-center p-6 text-gray-400">
          Módulo {activeTab} en construcción
        </div>
      )}
    </div>
  )
}

export default MainForm
