const TABS = ['Instantáneos', 'Valores 5M', 'Calidad', 'Coms']

function CommunicationsTabs({ activeTab, onTabChange }) {
  return (
    <div className="overflow-x-auto border-b border-gray-200 bg-gray-100 px-4 pt-2">
      <nav className="flex gap-1">
        {TABS.map((tab) => {
          const isActive = tab === activeTab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`whitespace-nowrap rounded-t-md border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-indigo-600 bg-white text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
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
