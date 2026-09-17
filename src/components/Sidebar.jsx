const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'medidores', label: 'Medidores' },
  { id: 'configuracion', label: 'Configuración' },
]

function Sidebar({ activeItem, onSelectItem }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col bg-slate-900 text-slate-200">
      <div className="flex h-16 items-center border-b border-slate-800 px-6">
        <span className="text-lg font-semibold text-white">Visor</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeItem
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectItem(item.id)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-slate-800 px-6 py-4 text-xs text-slate-500">
        v0.1.0
      </div>
    </aside>
  )
}

export default Sidebar
