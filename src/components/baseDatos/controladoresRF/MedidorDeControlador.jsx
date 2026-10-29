/**
 * MedidorDeControlador.jsx
 * ---------------------------------------------------------------------------
 * Detalle de un medidor abierto desde la URL
 * (/…/controladores-rf/:idControlador/medidores/:idMedidor).
 *
 * El backend no tiene un GET propio de medidores: cada controlador trae su
 * lista `medidores`. Por eso se lee el controlador (GET /ControladorRF/{id}),
 * se busca el medidor por su ID y se muestra con DetalleMedidor. Así la vista
 * funciona igual al llegar desde la tabla, al recargar la página o al usar
 * Atrás / Adelante del navegador.
 */
import { useEffect, useState } from 'react'
import { obtenerControladorRF } from '../../../services/controladoresRFService'
import DetalleMedidor from '../medidores/DetalleMedidor'

// Props:
// - idControlador / idMedidor: IDs numéricos tomados de la URL.
// - usuarioLogueado: usuario autenticado (para los permisos de las pestañas).
// - soloLectura: si es true las pestañas no permiten editar ("Datos en línea").
// - onVolver: callback para regresar al controlador.
export default function MedidorDeControlador({ idControlador, idMedidor, usuarioLogueado, soloLectura, onVolver }) {
  // { controlador, medidor } una vez leídos; null mientras se cargan.
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const peticion = new AbortController()

    obtenerControladorRF(idControlador, { signal: peticion.signal })
      .then((controlador) => {
        const medidor = controlador.medidores.find((m) => m.id === idMedidor)
        if (!medidor) throw new Error('El medidor no existe o no pertenece a este controlador.')
        setDatos({ controlador, medidor })
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })

    return () => peticion.abort()
  }, [idControlador, idMedidor])

  if (!datos) {
    return (
      <div className="rounded-xl bg-white p-4 shadow-md md:p-6">
        <button
          type="button"
          onClick={onVolver}
          className="mb-3 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          ← Volver al controlador
        </button>
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : (
          <p className="text-sm text-slate-500">Cargando medidor…</p>
        )}
      </div>
    )
  }

  return (
    <DetalleMedidor
      medidor={datos.medidor}
      usuarioLogueado={usuarioLogueado}
      soloLectura={soloLectura}
      textoVolver={`Volver a ${datos.controlador.nombre}`}
      onVolver={onVolver}
    />
  )
}
