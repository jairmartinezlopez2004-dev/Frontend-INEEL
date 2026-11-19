/**
 * SeleccionConsulta.jsx
 * ---------------------------------------------------------------------------
 * Vista principal que aparece después del inicio de sesión: fondo claro (mismo
 * estilo que el resto del sistema: barra blanca, tarjetas blancas), la pregunta "¿Consultar datos por medio
 * de?:" y cuatro tarjetas grandes para elegir el tipo de consulta.
 *
 * Rol en el sistema:
 * - "Base de Datos (configuración)" abre todo lo construido hasta ahora
 *   (Controladores RF, Eventos configurados, Unidades, Puntos IO, Grupos IO,
 *   Usuarios);
 *   App.jsx decide qué renderizar a partir de la opción elegida.
 * - "Datos en línea" abre solo el flujo de Controladores RF (controlador ->
 *   sus medidores -> detalle del medidor).
 * - "Perfiles 5 Minutales" abre la consulta de mediciones de cinco minutos
 *   de cualquier medidor (ConsultaPerfiles5M).
 * - "Eventos registrados" abre el historial de eventos ocurridos en los
 *   medidores (GestionEventosRegistrados).
 * - Incluye una barra superior con el usuario y el botón de cerrar sesión,
 *   porque en esta vista todavía no se monta el Header del sistema.
 */
import { useState } from 'react'
import ConfirmDialog from '../common/ConfirmDialog'
import { obtenerConfiguracion } from '../../config/configuracion'
import LogosInstitucionales from '../common/LogosInstitucionales'
// Íconos de la librería Lucide (mismo trazo en todo el sistema).
import { Activity, BellRing, ChartColumn, Database } from 'lucide-react'


// Opciones de consulta. `ruta` = dirección a la que lleva la tarjeta (ver App.jsx);
// `disponible: false` = aún sin vista (tarjeta deshabilitada).
const OPCIONES = [
  { id: 'baseDatos', ruta: '/configuracion', titulo: 'Base de Datos', detalle: '(Configuración)', Icono: Database, disponible: true },
  { id: 'perfiles5M', ruta: '/perfiles-5m', titulo: 'Perfiles 5 Minutales', Icono: ChartColumn, disponible: true },
  { id: 'enLinea', ruta: '/en-linea', titulo: 'Datos en línea', Icono: Activity, disponible: true },
  { id: 'eventos', ruta: '/eventos', titulo: 'Eventos registrados', Icono: BellRing, disponible: true },
]

// Props:
// - currentUser: usuario autenticado (nombre, apellido, rol, iniciales).
// - onSeleccionar: callback con la ruta de la opción elegida ('/configuracion', '/perfiles-5m', '/en-linea' o '/eventos').
// - onLogout: callback para cerrar la sesión y volver al Login.
export default function SeleccionConsulta({ currentUser, onSeleccionar, onLogout }) {
  // Pie de página (config.json); los logos los pone LogosInstitucionales.
  const { piePagina, tituloSistema } = obtenerConfiguracion()
  // true mientras se muestra la confirmación de "¿Cerrar sesión?".
  const [confirmandoSalida, setConfirmandoSalida] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-azul-50 text-slate-800">
      {/* Barra superior blanca, igual que el Header del sistema: logotipos,
          título, usuario y cerrar sesión. */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b-4 border-verde-500 bg-white px-4 shadow-sm sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <LogosInstitucionales clasePrincipal="h-14" claseAdicional="hidden h-7 md:block" />
          <div className="hidden min-w-0 border-l border-gray-200 pl-4 leading-tight lg:block">
            <p className="truncate text-sm font-bold uppercase tracking-wide text-slate-800 sm:text-base">
              {tituloSistema}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-medium text-gray-800">
              {currentUser.nombre} {currentUser.apellido}
            </p>
            <p className="text-xs text-gray-500">{currentUser.rol}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-verde-600 text-sm font-semibold text-white">
            {currentUser.iniciales}
          </div>
          <button
            type="button"
            onClick={() => setConfirmandoSalida(true)}
            className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Pregunta y tarjetas de opciones. */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <h1 className="mb-10 text-center text-2xl font-bold tracking-wide text-slate-800 sm:text-3xl">
          Datos a Consultar:
        </h1>

        <div className="grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {OPCIONES.map(({ id, ruta, titulo, detalle, Icono, disponible }) => (
            <button
              key={id}
              type="button"
              disabled={!disponible}
              onClick={() => onSeleccionar(ruta)}
              className="group relative flex min-h-56 cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl bg-white p-8 text-center shadow-md transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-azul-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {/* Ícono de la opción. Colores fijos; al pasar el
                  cursor la tarjeta solo se eleva. */}
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-verde-500 text-white">
                <Icono className="h-12 w-12" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span className="leading-snug">
                <span className="block text-lg font-semibold text-slate-800">{titulo}</span>
                {detalle && <span className="block text-sm text-slate-500">{detalle}</span>}
              </span>
              {!disponible && (
                <span className="absolute right-3 top-3 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Próximamente
                </span>
              )}
            </button>
          ))}
        </div>
      </main>

      {/* Pie oscuro, igual que el del resto del sistema (LayoutSistema). */}
      <footer className="border-t border-azul-900 bg-azul-950 py-2 text-center text-[11px] font-medium tracking-wide text-azul-200">
        {piePagina}
      </footer>

      <ConfirmDialog
        abierto={confirmandoSalida}
        titulo="¿Cerrar sesión?"
        mensaje="Tendrás que volver a ingresar tu correo y contraseña para entrar."
        textoConfirmar="Cerrar sesión"
        onConfirmar={onLogout}
        onCancelar={() => setConfirmandoSalida(false)}
      />
    </div>
  )
}
