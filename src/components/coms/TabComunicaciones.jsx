import ComsSidebar from './ComsSidebar'
import ComsForm from './ComsForm'

function TabComunicaciones() {
  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-6 lg:flex-row">
      <ComsSidebar />

      <div className="flex-1 rounded-xl bg-white p-6 shadow-md">
        <h2 className="border-b border-slate-200 pb-4 text-lg font-bold uppercase tracking-wide text-slate-800">
          Configuración de comunicaciones
        </h2>
        <div className="pt-6">
          <ComsForm />
        </div>
      </div>
    </div>
  )
}

export default TabComunicaciones
