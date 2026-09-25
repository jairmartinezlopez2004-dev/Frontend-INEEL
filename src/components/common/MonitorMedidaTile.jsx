/**
 * MonitorMedidaTile.jsx
 * ---------------------------------------------------------------------------
 * Tarjeta reutilizable que muestra una sola medida del medidor (título,
 * valor numérico, unidad) junto con una casilla para incluirla o no en una
 * solicitud al medidor/WebService.
 *
 * Rol en el sistema:
 * Es el "bloque de construcción" visual usado por todas las pestañas de
 * lectura de datos (Instantáneos, Valores 5M, Consumos) para pintar cada
 * variable eléctrica de forma consistente en toda la aplicación.
 *
 * Modo controlado vs. no controlado (checkbox):
 * Este componente soporta dos formas de uso para mantener compatibilidad
 * entre distintas pantallas:
 * - Modo NO controlado (no se pasan `checked`/`onChange`): la casilla maneja
 *   su propio estado interno con `defaultChecked`. Se usa en pantallas que
 *   todavía no necesitan saber, desde el componente padre, cuáles casillas
 *   están marcadas (ej. Calidad).
 * - Modo CONTROLADO (se pasan `checked` y `onChange`): el padre (por ejemplo
 *   TabInstantaneos, TabValores5M o TabConsumos) decide el estado de la
 *   casilla y reacciona a los cambios, lo cual permite implementar
 *   funcionalidades como "Seleccionar todos".
 *
 * Integración con el WebService:
 * La casilla representa qué medidas se incluirán en la próxima solicitud de
 * lectura hacia el medidor (botón "Solicitar" en cada Tab). El valor mostrado
 * (`valor`) hoy es un dato de ejemplo; en producción provendrá de la lectura
 * real del WebService (Instantáneos, Valores 5M, etc.).
 */
// Props:
// - titulo: nombre de la variable eléctrica (ej. "VA (Fase A - RMS)").
// - valor: valor numérico/textual a mostrar (dato simulado o leído del WebService).
// - unidad: unidad de medida (V, A, kW, %, etc.).
// - checked / onChange: opcionales; si se proveen, la casilla pasa a modo controlado.
function MonitorMedidaTile({ titulo, valor, unidad, checked, onChange }) {
  // Se considera "controlado" solo si el padre pasó explícitamente la prop `checked`.
  const esControlado = checked !== undefined

  return (
    // Tarjeta blanca con sombra suave; se resalta un poco más al pasar el mouse.
    <div className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md">
      {/* Nombre de la medida (se trunca si es muy largo para no romper el layout). */}
      <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-900">
        {titulo}
      </span>

      <div className="flex items-center justify-between gap-3">
        {/* Recuadro con el valor numérico de la medida, en fuente monoespaciada. */}
        <div className="min-w-0 flex-1 rounded-md bg-gray-50 px-3 py-2.5">
          <span className="block truncate font-mono text-2xl font-semibold tracking-tight text-green-500 tabular-nums">
            {valor}
          </span>
        </div>

        {/* Casilla para incluir/excluir esta medida de la próxima solicitud.
            Según `esControlado`, se le pasan las props de checkbox controlado
            (checked + onChange) o simplemente un valor inicial (defaultChecked). */}
        <input
          type="checkbox"
          {...(esControlado ? { checked, onChange } : { defaultChecked: false })}
          aria-label={`Incluir ${titulo}`}
          className="h-3.5 w-3.5 cursor-pointer rounded-sm border-gray-300 accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      {/* Unidad de medida, alineada a la derecha en la parte inferior de la tarjeta. */}
      <div className="flex justify-end">
        <span className="text-[11px] font-medium text-gray-900">{unidad}</span>
      </div>
    </div>
  )
}

export default MonitorMedidaTile
