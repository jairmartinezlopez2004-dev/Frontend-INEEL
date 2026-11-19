/**
 * TabConsumos.jsx
 * ---------------------------------------------------------------------------
 * Vista de "Consumos de energía" del medidor: al pulsar "Solicitar" pide al
 * backend la lectura en línea y muestra, por cada parámetro de energía (Whe,
 * Whr, VARh I-IV), los acumulados de las Fases A, B, C y el Total.
 *
 * Rol en el sistema:
 * - Pestaña de MainForm (Datos en línea). Recibe el medidor seleccionado.
 * - La lectura usa POST /ConexionMedidor/consumos (grupo funcional 3,
 *   SolConsumos de la DLL) mediante useLecturaMedidor; solo la pueden pedir
 *   el SuperAdministrador y el Administrador.
 * - Los tags de PuntosIO siguen el patrón <PARÁMETRO>_A/_B/_C por fase y
 *   <PARÁMETRO>T para el total (WHE_A … WHET). Los puntos que no estén en
 *   PARAMETROS salen en "Otros puntos".
 */
import MonitorMedidaTile from '../common/MonitorMedidaTile'
import EncabezadoLectura, { OtrosPuntos } from './EncabezadoLectura'
import { useLecturaMedidor } from '../../hooks/useLecturaMedidor'
import { PlugZap } from 'lucide-react'

// Parámetros de consumo: `prefijo` es la raíz del Tag en PuntosIO (grupo
// funcional 3); cada uno tiene Fase A, B, C y Total con la misma unidad.
const PARAMETROS = [
  { prefijo: 'WHE', etiqueta: 'Whe', unidad: 'kWh' },
  { prefijo: 'WHR', etiqueta: 'Whr', unidad: 'kWh' },
  { prefijo: 'VARHI', etiqueta: 'VARh I', unidad: 'kVARh' },
  { prefijo: 'VARHII', etiqueta: 'VARh II', unidad: 'kVARh' },
  { prefijo: 'VARHIII', etiqueta: 'VARh III', unidad: 'kVARh' },
  { prefijo: 'VARHIV', etiqueta: 'VARh IV', unidad: 'kVARh' },
]

// Tarjetas de cada parámetro: sufijo del Tag y título visible.
const COLUMNAS = [
  { sufijo: '_A', titulo: 'Fase A' },
  { sufijo: '_B', titulo: 'Fase B' },
  { sufijo: '_C', titulo: 'Fase C' },
  { sufijo: 'T', titulo: 'Total' },
]

const TAGS = PARAMETROS.flatMap((p) => COLUMNAS.map((c) => p.prefijo + c.sufijo))

// Props:
// - medidor: medidor seleccionado (se usan su id y su dirRed).
// - usuarioLogueado: usuario autenticado (solo administradores pueden leer).
function TabConsumos({ medidor, usuarioLogueado }) {
  const lectura = useLecturaMedidor({ medidor, usuarioLogueado, grupo: 'consumos', tagsCatalogo: TAGS })

  return (
    // Contenedor con scroll propio para acomodar todos los parámetros de consumo.
    <div className="flex-1 overflow-auto pt-4">
      <div className="flex flex-col gap-4">
        <EncabezadoLectura Icono={PlugZap} titulo="Consumos de energía" lectura={lectura} medidor={medidor} />

        {/* Una sección (tarjeta) por cada parámetro de consumo (Whe, Whr, VARh I-IV). */}
        {PARAMETROS.map((parametro) => (
          <section key={parametro.prefijo} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-widest text-slate-600">
              {parametro.etiqueta}
            </h3>
            {/* Grilla de tarjetas de medida (Fase A, B, C y Total). */}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {COLUMNAS.map((columna) => (
                <MonitorMedidaTile
                  key={columna.sufijo}
                  titulo={columna.titulo}
                  valor={lectura.valor(parametro.prefijo + columna.sufijo)}
                  unidad={parametro.unidad}
                  seleccionable={false}
                />
              ))}
            </div>
          </section>
        ))}

        <OtrosPuntos puntos={lectura.otrosPuntos} />
      </div>
    </div>
  )
}

export default TabConsumos
