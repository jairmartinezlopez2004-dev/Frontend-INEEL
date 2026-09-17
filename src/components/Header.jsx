const CURRENT_USER = {
  name: 'Juan Pérez',
  role: 'Administrador',
  initials: 'JP',
}

const SYSTEM_TITLE = 'VISOR MEDICIÓN CALIDAD DE LA POTENCIA INEEL V1.0.1'

function EnergyLogo() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 shadow-sm">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
    </div>
  )
}

function Header({ title }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex min-w-0 items-center gap-3">
        <EnergyLogo />
        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-sm font-bold tracking-wide text-slate-800 sm:text-base">
            {SYSTEM_TITLE}
          </h1>
          {title && <p className="truncate text-xs text-gray-400">{title}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-gray-800">{CURRENT_USER.name}</p>
          <p className="text-xs text-gray-500">{CURRENT_USER.role}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
          {CURRENT_USER.initials}
        </div>
      </div>
    </header>
  )
}

export default Header
