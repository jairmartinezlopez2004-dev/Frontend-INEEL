const STATUS_ITEMS = [
  'MedidorQP: 0000',
  'RF: 00:00:00',
  'Protocolo: ComsCEC',
  'Transporte: SERIAL-COM3',
]

function StatusBar() {
  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-slate-700/60 bg-slate-900 px-6 text-[11px] font-medium tracking-wide text-slate-400">
      {STATUS_ITEMS.map((item, index) => (
        <span key={item} className="flex items-center gap-4">
          {index > 0 && <span className="text-slate-600">•</span>}
          {item}
        </span>
      ))}
    </footer>
  )
}

export default StatusBar
