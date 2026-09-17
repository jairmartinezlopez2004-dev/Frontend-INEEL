const MENU_ITEMS = ['Transporte Protocolo', 'MedidorQP', 'Visor RxTx']
const ACTIVE_ITEM = 'Transporte Protocolo'

function ComsSidebar() {
  return (
    <nav className="flex gap-2 overflow-x-auto lg:w-1/4 lg:flex-col lg:gap-1 lg:overflow-visible">
      {MENU_ITEMS.map((item) => {
        const isActive = item === ACTIVE_ITEM
        return (
          <span
            key={item}
            className={`whitespace-nowrap rounded-md border-l-4 px-4 py-2.5 text-sm font-medium transition-colors lg:whitespace-normal ${
              isActive
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-transparent text-slate-500 hover:bg-slate-100'
            }`}
          >
            {item}
          </span>
        )
      })}
    </nav>
  )
}

export default ComsSidebar
