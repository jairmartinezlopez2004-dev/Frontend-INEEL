/**
 * DetalleControlador.jsx
 * ---------------------------------------------------------------------------
 * Detalle de un controlador RF con los medidores agrupados en él.
 *
 * Rol en el sistema:
 * - Se monta desde GestionControladoresRF al pulsar "Ver medidores".
 * - Lee el controlador con GET /ControladorRF/{id}, que ya trae sus medidores.
 * - Encabezado con los datos del controlador; el Administrador puede editarlo.
 * - Tabla de sus medidores: el Administrador puede dar de alta un medidor en
 *   este controlador (queda preseleccionado en el formulario) o editar uno
 *   existente, incluso para moverlo a otro controlador. "Detalles" abre el
 *   medidor (sus pestañas) solo en "Datos en línea"; en "Base de Datos
 *   (configuración)" no se muestra.
 * - Colores: la sección del controlador va en azul y la de sus medidores en
 *   verde (incluidos sus formularios), para que al editar se distinga a qué
 *   parte pertenece cada formulario.
 */
import { useEffect, useState } from 'react'
import { obtenerControladorRF } from '../../../services/controladoresRFService'
import FormularioControlador from './FormularioControlador'
import FormularioMedidor from '../medidores/FormularioMedidor'
import EstadoBadge from '../medidores/EstadoBadge'
import { textoEstadoEquipo } from '../../../services/medidoresService'
import { useFiltroTabla } from '../../../hooks/useFiltroTabla'
import BuscadorTabla from '../../common/BuscadorTabla'

// Encabezados de la tabla de medidores. La última columna (acciones) no tiene título.
const COLUMNAS = ['Dir. Red', 'Dir. RF', 'Descripción', 'Estado', 'Dirección IP', '']

// Dato de solo lectura para el encabezado del controlador (etiqueta + valor).
function DatoControlador({ etiqueta, valor }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-blue-700">{etiqueta}</dt>
      <dd className="mt-0.5 font-mono text-sm text-blue-950">{valor}</dd>
    </div>
  )
}

// Props:
// - idControlador: idCtrlRF del controlador a mostrar.
// - controladores: lista de controladores (para el selector del formulario de medidor).
// - esAdmin: si es true se muestran el alta y la edición.
// - onVolver: callback para regresar a la lista de controladores.
// - onVerMedidor: callback con el medidor elegido con "Detalles"; si no se
//   pasa, el botón no se muestra.
// - onCargado: callback con el controlador cada vez que se lee del WebService.
export default function DetalleControlador({
  idControlador,
  controladores,
  esAdmin,
  onVolver,
  onVerMedidor,
  onCargado,
}) {
  const [controlador, setControlador] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null) // Mensaje de éxito tras guardar.
  // true mientras se edita el propio controlador.
  const [editandoControlador, setEditandoControlador] = useState(false)
  // Formulario de medidor abierto: undefined = cerrado, null = alta, objeto = edición.
  const [medidorEnEdicion, setMedidorEnEdicion] = useState(undefined)
  // Se incrementa para volver a pedir el controlador después de guardar.
  const [recarga, setRecarga] = useState(0)
  // Buscador de la tabla de medidores: filtra por las columnas visibles.
  const medidores = controlador?.medidores ?? []
  const filtro = useFiltroTabla(medidores, (m) => [
    m.dirRed,
    m.dirRF,
    m.descripcion,
    textoEstadoEquipo(m.edo),
    m.dirIP,
  ])

  // Carga (y recarga) del controlador con sus medidores. El AbortController
  // cancela la petición si el usuario sale de la vista antes de que responda.
  useEffect(() => {
    const peticion = new AbortController()

    obtenerControladorRF(idControlador, { signal: peticion.signal })
      .then((datos) => {
        setControlador(datos)
        onCargado?.(datos)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!peticion.signal.aborted) setCargando(false)
      })

    return () => peticion.abort()
    // onCargado se omite a propósito: solo se recarga al cambiar de controlador o al guardar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idControlador, recarga])

  const alGuardar = (mensaje) => {
    setEditandoControlador(false)
    setMedidorEnEdicion(undefined)
    setAviso(mensaje)
    setCargando(true)
    setError(null)
    setRecarga((n) => n + 1)
  }

  const abrirFormularioMedidor = (medidor) => {
    setAviso(null)
    setEditandoControlador(false)
    setMedidorEnEdicion(medidor)
  }

  const formularioAbierto = editandoControlador || medidorEnEdicion !== undefined

  return (
    <div className="flex flex-col gap-4">
      {/* ── Encabezado: regreso a la lista + datos del controlador (azul) ── */}
      <div className="overflow-hidden rounded-xl bg-blue-50 shadow-md ring-1 ring-blue-200">
        <div className="p-4 md:p-6">
          <button
            type="button"
            onClick={onVolver}
            className="mb-3 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Volver a Controladores
          </button>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {!controlador && cargando && (
            <p className="text-sm text-slate-500">Cargando controlador…</p>
          )}

          {controlador && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Controlador
                  </p>
                  <h2 className="text-lg font-bold text-blue-950">{controlador.nombre}</h2>
                </div>
                {esAdmin && !formularioAbierto && (
                  <button
                    type="button"
                    onClick={() => {
                      setAviso(null)
                      setEditandoControlador(true)
                    }}
                    className="cursor-pointer rounded-md border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100"
                  >
                    Editar controlador
                  </button>
                )}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-blue-200 pt-4 sm:grid-cols-4">
                <DatoControlador etiqueta="Número de serie" valor={controlador.numSerie} />
                <DatoControlador etiqueta="Dirección IP" valor={controlador.dirIP} />
                <DatoControlador etiqueta="Estado" valor={<EstadoBadge edo={controlador.edo} />} />
                <DatoControlador etiqueta="Medidores" valor={controlador.medidores.length} />
              </dl>
            </>
          )}
        </div>

        {esAdmin && editandoControlador && controlador && (
          <FormularioControlador
            controlador={controlador}
            onGuardado={alGuardar}
            onCancelar={() => setEditandoControlador(false)}
            claseFondo="border-t border-blue-200 bg-blue-100/70"
          />
        )}
      </div>

      {/* ── Medidores agrupados en este controlador (verde) ── */}
      {controlador && (
        <div className="overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-emerald-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200 bg-emerald-50 px-6 py-4">
            <h3 className="text-base font-bold uppercase tracking-wide text-emerald-900">
              Medidores de este controlador
            </h3>
            {esAdmin && !formularioAbierto && (
              <button
                type="button"
                onClick={() => abrirFormularioMedidor(null)}
                className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:scale-95"
              >
                + Nuevo medidor
              </button>
            )}
          </div>

          {/* `key` reinicia el formulario al cambiar entre alta y distintos medidores. */}
          {esAdmin && medidorEnEdicion !== undefined && (
            <FormularioMedidor
              key={medidorEnEdicion?.id ?? 'nuevo'}
              medidor={medidorEnEdicion}
              controladores={controladores}
              idCtrlRFInicial={controlador.id}
              onGuardado={alGuardar}
              onCancelar={() => setMedidorEnEdicion(undefined)}
              claseFondo="border-emerald-200 bg-emerald-50/70"
            />
          )}

          {aviso && (
            <div className="mx-6 mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {aviso}
            </div>
          )}
          {cargando && <p className="px-6 py-4 text-sm text-slate-500">Actualizando…</p>}

          {controlador.medidores.length === 0 ? (
            <p className="px-6 py-4 text-sm text-slate-500">
              Este controlador todavía no tiene medidores.
            </p>
          ) : (
            <>
              <BuscadorTabla
                valor={filtro.texto}
                onCambio={filtro.setTexto}
                total={medidores.length}
                visibles={filtro.filtradas.length}
                placeholder="Buscar por dirección, descripción, estado o IP…"
                claseFoco="focus:ring-emerald-500"
              />
              {/* Contenedor con scroll horizontal para que la tabla no rompa el layout en pantallas angostas. */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-emerald-50/60">
                    <tr>
                      {COLUMNAS.map((col) => (
                        <th
                          key={col}
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-800"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    {filtro.filtradas.map((medidor) => (
                      <tr key={medidor.id} className="hover:bg-emerald-50/40">
                        <td className="px-4 py-3 font-mono text-slate-700">{medidor.dirRed}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{medidor.dirRF}</td>
                        <td className="px-4 py-3 text-slate-900">{medidor.descripcion}</td>
                        <td className="px-4 py-3">
                          <EstadoBadge edo={medidor.edo} />
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">{medidor.dirIP}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {esAdmin && (
                            <button
                              type="button"
                              onClick={() => abrirFormularioMedidor(medidor)}
                              className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                            >
                              Editar
                            </button>
                          )}
                          {onVerMedidor && (
                            <button
                              type="button"
                              onClick={() => onVerMedidor(medidor)}
                              className="cursor-pointer rounded-md border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                            >
                              Detalles
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtro.filtradas.length === 0 && (
                  <p className="px-6 py-4 text-sm text-slate-500">
                    Ningún medidor coincide con “{filtro.texto.trim()}”.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
