/**
 * configuracion.js
 * ---------------------------------------------------------------------------
 * Personalización por empresa (marca) del visor.
 *
 * Rol en el sistema:
 * Al iniciar, main.jsx llama a cargarConfiguracion(), que lee /config.json
 * (public/config.json en el proyecto; en IIS queda junto a index.html) antes
 * de dibujar la aplicación. Los componentes leen los valores con
 * obtenerConfiguracion(): logo y nombre de la empresa y logos adicionales
 * (Header, Login, SeleccionConsulta), título del sistema (Header), pie de página
 * (LayoutSistema, SeleccionConsulta), leyenda de la barra de estado
 * (StatusBar), siglas e imagen de fondo de las pantallas de acceso
 * y título e ícono de la pestaña.
 *
 * Para otra empresa basta con editar config.json en la carpeta publicada y
 * copiar ahí su logo/ícono; no hay que recompilar. Si el archivo no existe o
 * tiene un error de formato, se usan los valores por defecto (INEEL) y se
 * avisa en la consola del navegador.
 */

// Valores por defecto; también documentan qué campos admite config.json.
const POR_DEFECTO = {
  empresa: {
    nombre: 'Instituto Nacional de Electricidad y Energías Limpias (INEEL)',
    logo: '/logo-ineel-texto.png',
    // Logos que se muestran junto al de la empresa: [{ ruta, nombre }].
    logosAdicionales: [
      {
        ruta: '/logo-secihti.svg',
        nombre: 'Secretaría de Ciencia, Humanidades, Tecnología e Innovación (SECIHTI)',
      },
    ],
  },
  tituloSistema: 'MEDICIÓN CALIDAD DE LA POTENCIA INEEL V1.0.1',
  // Nombre corto que se muestra bajo los logos en inicio de sesión, registro
  // y restablecer contraseña.
  siglasSistema: 'SIMECAPS',
  // Imagen de fondo de las pantallas de acceso (ruta en public/, p. ej.
  // '/fondo-acceso.jpg'). Vacía = fondo gris claro liso.
  fondoAcceso: '',
  // Crédito de la imagen de fondo (autor y licencia), en la esquina inferior
  // derecha; algunas licencias libres (CC BY, CC BY-SA) lo exigen.
  creditoFondo: '',
  // Página de la imagen (licencia completa); vuelve enlace al crédito.
  enlaceCreditoFondo: '',
  tituloPestana: 'Medición Calidad de la Potencia',
  iconoPestana: '/favicon-32.png',
  // Leyenda del lado derecho de la barra de estado.
  leyendaSistema:
    '© 2026 Instituto Nacional de Electricidad y Energías Limpias (INEEL). Visor de Calidad de la Potencia v1.0.1.',
  piePagina:
    'Software desarrollado con el apoyo de la Secretaría de Ciencia, Humanidades, Tecnología e Innovación (SECIHTI), a través del proyecto MADTEC-2025-M-538',
}

let configuracion = POR_DEFECTO

/** Texto no vacío o, si no lo es, el valor por defecto. */
function texto(valor, respaldo) {
  return typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : respaldo
}

/**
 * Logos adicionales válidos ({ ruta, nombre } con ruta no vacía). Si el campo
 * no viene en config.json se usan los de por defecto; una lista vacía quita
 * todos.
 */
function logosAdicionales(valor) {
  if (!Array.isArray(valor)) return POR_DEFECTO.empresa.logosAdicionales
  return valor
    .filter((logo) => typeof logo?.ruta === 'string' && logo.ruta.trim() !== '')
    .map((logo) => ({ ruta: logo.ruta.trim(), nombre: texto(logo.nombre, '') }))
}

/** Combina lo leído de config.json con los valores por defecto, campo por campo. */
function combinar(leido) {
  const empresa = leido?.empresa ?? {}
  return {
    empresa: {
      nombre: texto(empresa.nombre, POR_DEFECTO.empresa.nombre),
      logo: texto(empresa.logo, POR_DEFECTO.empresa.logo),
      logosAdicionales: logosAdicionales(empresa.logosAdicionales),
    },
    tituloSistema: texto(leido?.tituloSistema, POR_DEFECTO.tituloSistema),
    siglasSistema: texto(leido?.siglasSistema, POR_DEFECTO.siglasSistema),
    fondoAcceso: texto(leido?.fondoAcceso, POR_DEFECTO.fondoAcceso),
    creditoFondo: texto(leido?.creditoFondo, POR_DEFECTO.creditoFondo),
    enlaceCreditoFondo: texto(leido?.enlaceCreditoFondo, POR_DEFECTO.enlaceCreditoFondo),
    tituloPestana: texto(leido?.tituloPestana, POR_DEFECTO.tituloPestana),
    iconoPestana: texto(leido?.iconoPestana, POR_DEFECTO.iconoPestana),
    leyendaSistema: texto(leido?.leyendaSistema, POR_DEFECTO.leyendaSistema),
    piePagina: texto(leido?.piePagina, POR_DEFECTO.piePagina),
  }
}

/** Aplica el título y el ícono de la pestaña del navegador. */
function aplicarPestana({ tituloPestana, iconoPestana }) {
  document.title = tituloPestana
  // Se reemplazan los íconos de index.html por el configurado.
  document
    .querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')
    .forEach((enlace) => enlace.remove())
  const icono = document.createElement('link')
  icono.rel = 'icon'
  icono.href = iconoPestana
  document.head.appendChild(icono)
}

/**
 * Lee /config.json (sin caché, para que un cambio se vea al recargar) y
 * aplica la pestaña. Nunca falla: ante cualquier error deja los valores por
 * defecto.
 */
export async function cargarConfiguracion() {
  try {
    const respuesta = await fetch('/config.json', { cache: 'no-store' })
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)
    configuracion = combinar(await respuesta.json())
  } catch (err) {
    console.warn('No se pudo leer /config.json; se usan los valores por defecto.', err)
    configuracion = POR_DEFECTO
  }
  aplicarPestana(configuracion)
  return configuracion
}

/** Configuración vigente (la de config.json una vez cargada). */
export function obtenerConfiguracion() {
  return configuracion
}
