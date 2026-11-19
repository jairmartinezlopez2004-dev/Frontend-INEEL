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
import { ArrowLeft, Gauge, Radio } from 'lucide-react'
import TituloSeccion from '../../common/TituloSeccion'
import {
  CLASE_DATOS_AZUL, CLASE_ENCABEZADO_AZUL, CLASE_ETIQUETA_DATO_AZUL, CLASE_TARJETA_AZUL, CLASE_VALOR_DATO_AZUL,
  CLASE_VOLVER_AZUL,
} from '../../common/clasesEncabezado'
import { BotonEditar, BotonPrimario, BotonVer } from '../../common/Botones'

// Encabezados de la tabla de medidores. La última columna (acciones) no tiene título.
const COLUMNAS = ['Dir. Red', 'Dir. RF', 'Descripción', 'Estado', 'Dirección IP', '']

// Dato de solo lectura para el encabezado del controlador (etiqueta + valor).
function DatoControlador({ etiqueta, valor }) {
  return (
    <div>
      <dt className={CLASE_ETIQUETA_DATO_AZUL}>{etiqueta}</dt>
      <dd className={CLASE_VALOR_DATO_AZUL}>{valor}</dd>
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
      {/* ── Encabezado: regreso a la lista + datos del controlador ── */}
      <div className={CLASE_TARJETA_AZUL}>
        {/* Parte superior azul: regreso + nombre del controlador. */}
        <div className={CLASE_ENCABEZADO_AZUL}>
          <button type="button" onClick={onVolver} className={CLASE_VOLVER_AZUL}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a Controladores
          </button>

          {!controlador && cargando && <p className="text-sm text-azul-100">Cargando controlador…</p>}

          {controlador && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TituloSeccion Icono={Radio} etiqueta="Controlador" titulo={controlador.nombre} mayusculas={false} invertido />
              {esAdmin && !formularioAbierto && (
                <BotonEditar
                  sobreColor
                  onClick={() => {
                    setAviso(null)
                    setEditandoControlador(true)
                  }}
                >
                  Editar controlador
                </BotonEditar>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="m-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 md:m-6">{error}</div>
        )}

        {controlador && (
          <dl className={CLASE_DATOS_AZUL}>
            <DatoControlador etiqueta="Número de serie" valor={controlador.numSerie} />
            <DatoControlador etiqueta="Dirección IP" valor={controlador.dirIP} />
            <DatoControlador etiqueta="Estado" valor={<EstadoBadge edo={controlador.edo} />} />
            <DatoControlador etiqueta="Medidores" valor={controlador.medidores.length} />
          </dl>
        )}

        {esAdmin && editandoControlador && controlador && (
          <FormularioControlador
            controlador={controlador}
            onGuardado={alGuardar}
            onCancelar={() => setEditandoControlador(false)}
            claseFondo="border-t border-white/20 bg-slate-50 text-slate-800"
          />
        )}
      </div>

      {/* ── Medidores agrupados en este controlador ── */}
      {controlador && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
            <TituloSeccion Icono={Gauge} titulo="Medidores de este controlador" />
            {esAdmin && !formularioAbierto && (
              <BotonPrimario onClick={() => abrirFormularioMedidor(null)}>Nuevo medidor</BotonPrimario>
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
              claseFondo="border-gray-200 bg-slate-50"
            />
          )}

          {aviso && (
            <div className="mx-6 mt-4 rounded-md border border-verde-200 bg-verde-50 p-3 text-sm text-verde-700">
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
              />
              {/* Contenedor con scroll horizontal para que la tabla no rompa el layout en pantallas angostas. */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-azul-700">
                    <tr>
                      {COLUMNAS.map((col) => (
                        <th
                          key={col}
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtro.filtradas.map((medidor) => (
                      <tr key={medidor.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-slate-700">{medidor.dirRed}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{medidor.dirRF}</td>
                        <td className="px-4 py-3 text-slate-900">{medidor.descripcion}</td>
                        <td className="px-4 py-3">
                          <EstadoBadge edo={medidor.edo} />
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">{medidor.dirIP}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {esAdmin && (
                            <BotonEditar className="mr-2" onClick={() => abrirFormularioMedidor(medidor)} />
                          )}
                          {onVerMedidor && <BotonVer onClick={() => onVerMedidor(medidor)}>Detalles</BotonVer>}
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
