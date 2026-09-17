import { useState } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import StatusBar from './components/StatusBar'
import MainForm from './components/MainForm'
import TabDashboard from './components/dashboard/TabDashboard'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  medidores: 'Medidores',
  configuracion: 'Configuración',
}

function App() {
  const [activeItem, setActiveItem] = useState('dashboard')

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeItem={activeItem} onSelectItem={setActiveItem} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header title={PAGE_TITLES[activeItem]} />

          <main className="flex-1 overflow-hidden bg-gray-100">
            {activeItem === 'dashboard' && <TabDashboard />}
            {activeItem === 'medidores' && <MainForm />}
            {activeItem === 'configuracion' && (
              <div className="flex h-full items-center justify-center text-gray-400">
                Módulo Configuración en construcción
              </div>
            )}
          </main>
        </div>
      </div>

      <StatusBar />
    </div>
  )
}

export default App
