/**
 * InputContrasena.jsx
 * ---------------------------------------------------------------------------
 * Campo de contraseña con el botón de "mostrar / ocultar contraseña" (ícono
 * de ojo) dentro del input, a la derecha. Al pulsarlo, el input cambia entre
 * type="password" (puntos) y type="text" (texto visible).
 *
 * Recibe las mismas props que un <input> normal (value, onChange, className,
 * aria-*, maxLength, autoComplete, etc.); `type` se ignora porque lo controla
 * el propio componente. Se usa en Login, Registro, Restablecer contraseña y
 * en la confirmación con contraseña de Puntos IO.
 */
import { useState } from 'react'

// Ícono de ojo abierto (contraseña oculta: pulsar para mostrarla).
function IconoOjo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// Ícono de ojo tachado (contraseña visible: pulsar para ocultarla).
function IconoOjoTachado() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.16 3.19" />
      <path d="M6.61 6.61A17.4 17.4 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.39-1.61" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

export default function InputContrasena({ className = '', disabled, ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        disabled={disabled}
        type={visible ? 'text' : 'password'}
        // pr-10 deja espacio para el botón del ojo y evita que el texto quede debajo.
        className={`${className} w-full pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 focus:outline-none focus-visible:text-blue-600 disabled:opacity-50"
      >
        {visible ? <IconoOjoTachado /> : <IconoOjo />}
      </button>
    </div>
  )
}
