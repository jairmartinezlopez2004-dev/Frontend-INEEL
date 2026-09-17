import { useState } from 'react'
import CommunicationsTabs from './coms/CommunicationsTabs'
import TabComunicaciones from './coms/TabComunicaciones'
import TabInstantaneos from './instantaneos/TabInstantaneos'
import TabValores5M from './valores5m/TabValores5M'

const TABS_MAQUETADAS = ['Coms', 'Instantáneos', 'Valores 5M']

function MainForm() {
  const [activeTab, setActiveTab] = useState('Coms')

  return (
    <div className="flex h-full flex-col">
      <CommunicationsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'Coms' && <TabComunicaciones />}
      {activeTab === 'Instantáneos' && <TabInstantaneos />}
      {activeTab === 'Valores 5M' && <TabValores5M />}
      {!TABS_MAQUETADAS.includes(activeTab) && (
        <div className="flex flex-1 items-center justify-center p-6 text-gray-400">
          Módulo {activeTab} en construcción
        </div>
      )}
    </div>
  )
}

export default MainForm
