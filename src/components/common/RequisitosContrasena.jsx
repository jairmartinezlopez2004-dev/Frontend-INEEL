/**
 * RequisitosContrasena.jsx
 * ---------------------------------------------------------------------------
 * Lista de requisitos de una contraseña nueva (ver REQUISITOS_CONTRASENA en
 * utils/validaciones.js). Cada requisito se marca en verde en cuanto se
 * cumple, mientras el usuario escribe. Se usa en el alta y el
 * restablecimiento de Usuarios y en el registro.
 */
import { REQUISITOS_CONTRASENA } from '../../utils/validaciones'

// Props:
// - valor: contraseña que se está escribiendo.
export default function RequisitosContrasena({ valor }) {
  return (
    <ul className="flex flex-col gap-0.5 text-xs">
      {REQUISITOS_CONTRASENA.map((r) => {
        const cumple = valor !== '' && r.cumple(valor)
        return (
          <li key={r.texto} className={`flex items-center gap-1.5 ${cumple ? 'text-green-700' : 'text-slate-500'}`}>
            <span aria-hidden="true" className="w-3 text-center font-bold">
              {cumple ? '✓' : '•'}
            </span>
            {r.texto}
            <span className="sr-only">{cumple ? '(cumplido)' : '(pendiente)'}</span>
          </li>
        )
      })}
    </ul>
  )
}
