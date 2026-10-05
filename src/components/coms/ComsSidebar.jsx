/**
 * ComsSidebar.jsx
 * ---------------------------------------------------------------------------
 * Menú lateral secundario dentro de la pestaña "Coms" (Comunicaciones), que
 * agrupa las distintas secciones de configuración de la comunicación con el
 * medidor.
 *
 * Rol en el sistema:
 * Por ahora es un componente de solo presentación: muestra las opciones
 * disponibles y marca visualmente cuál está activa, pero no dispara ninguna
 * acción real al hacer clic (no recibe props ni maneja eventos todavía).
 * Está pensado como base para, en una siguiente iteración, controlar qué
 * sección de la configuración de comunicaciones se muestra.
 */

// Opciones del menú lateral de Comunicaciones.
const MENU_ITEMS = ['Transporte Protocolo', 'MedidorQP', 'Visor RxTx']
// Ítem marcado como activo por defecto (valor fijo mientras no haya navegación real).
const ACTIVE_ITEM = 'Transporte Protocolo'

function ComsSidebar() {
  return (
    // En pantallas pequeñas se acomoda en fila (scroll horizontal);
    // en pantallas grandes (lg+) se acomoda en columna, como un menú lateral clásico.
    <div className="w-full lg:w-1/4 xl:w-1/5 flex flex-row lg:flex-col gap-2 overflow-x-auto">
      {MENU_ITEMS.map((item) => {
        // Compara contra ACTIVE_ITEM para resaltar la opción "seleccionada".
        const isActive = item === ACTIVE_ITEM
        return (
          <span
            key={item}
            className={`whitespace-nowrap rounded-md border-l-4 px-4 py-2.5 text-sm font-medium transition-colors lg:whitespace-normal ${
              isActive
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-transparent text-slate-900 hover:bg-slate-100'
            }`}
          >
            {item}
          </span>
        )
      })}
    </div>
  )
}

export default ComsSidebar
