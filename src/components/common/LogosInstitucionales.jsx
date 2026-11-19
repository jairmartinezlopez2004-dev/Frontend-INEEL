/**
 * LogosInstitucionales.jsx
 * ---------------------------------------------------------------------------
 * Logo de la empresa seguido de los logos adicionales (p. ej. SECIHTI), todos
 * leídos de config.json (empresa.logo y empresa.logosAdicionales).
 *
 * Cada logo se dimensiona solo por su ALTURA y con `w-auto`, así el navegador
 * calcula el ancho y se conserva la proporción original de cada imagen (el
 * del INEEL es casi cuadrado y con margen blanco; el de la SECIHTI es
 * horizontal, unas 8 veces más ancho que alto). Por eso cada pantalla pasa
 * dos alturas: una para el logo principal y otra, menor, para los adicionales,
 * de modo que ambos se vean con un peso visual parecido.
 *
 * Con `vertical`, los logos se apilan centrados: primero el de la empresa
 * (arriba) y debajo los adicionales. Lo usan las pantallas de acceso
 * (inicio de sesión, registro y restablecer contraseña).
 */
import { obtenerConfiguracion } from '../../config/configuracion'

// Props:
// - clasePrincipal: clases de altura del logo de la empresa (ej. "h-14").
// - claseAdicional: clases de altura de los logos adicionales (ej. "h-7").
// - className: clases del contenedor (alineación, ocultar en móvil, etc.).
// - vertical: true apila los logos centrados, con el de la empresa arriba.
export default function LogosInstitucionales({ clasePrincipal, claseAdicional, className = '', vertical = false }) {
  const { empresa } = obtenerConfiguracion()

  const principal = (
    <img src={empresa.logo} alt={empresa.nombre} className={`${clasePrincipal} w-auto shrink-0 object-contain`} />
  )
  const adicionales = empresa.logosAdicionales.map((logo) => (
    <img
      key={logo.ruta}
      src={logo.ruta}
      alt={logo.nombre}
      className={`${claseAdicional} w-auto min-w-0 max-w-full object-contain`}
    />
  ))

  if (vertical) {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        {principal}
        {adicionales}
      </div>
    )
  }

  return (
    <div className={`flex min-w-0 items-center gap-4 ${className}`}>
      {principal}
      {adicionales}
    </div>
  )
}
