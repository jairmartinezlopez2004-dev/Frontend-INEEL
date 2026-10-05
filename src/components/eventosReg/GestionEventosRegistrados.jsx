/**
 * GestionEventosRegistrados.jsx
 * ---------------------------------------------------------------------------
 * Módulo "Eventos registrados": historial de los eventos configurados que
 * han ocurrido en los medidores (tabla EventosReg del backend), del más
 * reciente al más antiguo.
 *
 * Rol en el sistema:
 * - Es solo de consulta, para cualquier usuario con sesión (GET /EventosReg):
 *   los registros los genera el sistema cuando sucede un evento, no se
 *   capturan ni se editan desde la UI.
 * - Para mostrar nombres en lugar de IDs también se cargan los controladores
 *   RF con sus medidores (GET /ControladorRF) y los eventos configurados
 *   (GET /EventosConfig).
 */
import { useEffect, useState } from 'react'
import { listarRegistros, claveRegistro } from '../../services/eventosRegService'
import { listarControladoresRF } from '../../services/controladoresRFService'
import { listarEventos } from '../../services/eventosConfigService'

// Encabezados de la tabla.
const COLUMNAS = ['Fecha', 'Controlador RF', 'Medidor', 'Evento', 'Consumo']

/** "2026-10-05" -> "05/10/2026" (sin pasar por Date, para no desfasar la zona horaria). */
function formatearFecha(fechaIso) {
  return fechaIso.split('-').reverse().join('/')
}

export default function GestionEventosRegistrados() {
  const [registros, setRegistros] = useState([])
  const [controladores, setControladores] = useState([])
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Carga de registros, controladores y eventos en paralelo. El
  // AbortController cancela las peticiones si el usuario sale de la vista.
  useEffect(() => {
    const controlador = new AbortController()
    const { signal } = controlador

    Promise.all([
      listarRegistros({ signal }),
      listarControladoresRF({ signal }),
      listarEventos({ signal }),
    ])
      .then(([listaRegistros, listaControladores, listaEventos]) => {
        setRegistros(listaRegistros)
        setControladores(listaControladores)
        setEventos(listaEventos)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [])

  // Textos legibles de cada parte del registro; si un ID no se encuentra, se muestra el número.
  const controladorDe = (idCtrlRF) => controladores.find((c) => c.id === idCtrlRF)
  const textoControlador = (idCtrlRF) => controladorDe(idCtrlRF)?.nombre ?? `ID ${idCtrlRF}`
  const textoMedidor = (idCtrlRF, idMedidor) => {
    const medidor = controladorDe(idCtrlRF)?.medidores.find((m) => m.id === idMedidor)
    return medidor ? `Dir. ${medidor.dirRed} – ${medidor.descripcion}` : `ID ${idMedidor}`
  }
  const textoEvento = (idEvento) => {
    const evento = eventos.find((e) => e.id === idEvento)
    return evento ? `${evento.numEvento} – ${evento.descripcion}` : `ID ${idEvento}`
  }

  return (
    <div className="rounded-xl bg-white shadow-md">
      {/* Encabezado de la tarjeta. */}
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">
          Eventos registrados
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Historial de los eventos configurados que han ocurrido en los medidores.
        </p>
      </div>

      {/* Mensajes de estado. */}
      {cargando && <p className="px-6 py-4 text-sm text-slate-500">Cargando registros…</p>}
      {error && (
        <div className="m-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {!cargando && !error && registros.length === 0 && (
        <p className="px-6 py-4 text-sm text-slate-500">No hay eventos registrados.</p>
      )}

      {/* Contenedor con scroll horizontal para que la tabla no rompa el layout en pantallas angostas. */}
      {!error && registros.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {COLUMNAS.map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registros.map((registro) => (
                <tr key={claveRegistro(registro)} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">
                    {formatearFecha(registro.fecha)}
                  </td>
                  <td className="px-4 py-3 text-slate-900">{textoControlador(registro.idCtrlRF)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {textoMedidor(registro.idCtrlRF, registro.idMedidor)}
                  </td>
                  <td className="px-4 py-3 text-slate-900">{textoEvento(registro.idEvento)}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{registro.consumo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
