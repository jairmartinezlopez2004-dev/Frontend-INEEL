/**
 * Login.jsx
 * ---------------------------------------------------------------------------
 * Pantalla de inicio de sesión del Visor SISMEDIA-RT.
 *
 * Rol en el sistema:
 * Gestiona las credenciales de acceso del usuario y las valida contra el
 * WebService (POST /Auth/login) mediante services/authService.js.
 */
import React, { useState } from 'react';
import { iniciarSesion } from '../services/authService';
import { useValidacion } from '../hooks/useValidacion';
import { validarTexto } from '../utils/validaciones';
import { MensajeCampo } from './common/CampoFormulario';

// Reglas de cada campo. En el login solo se pide que no estén vacíos: las
// credenciales las valida el WebService.
const VALIDADORES = {
  cuenta: (v) => validarTexto(v, { nombre: 'La cuenta', femenino: true }),
  clave: (v) => validarTexto(v, { nombre: 'La contraseña', femenino: true, recortar: false }),
};

// Clases de los inputs del login (normal / con error).
const CLASE_INPUT =
  'w-full px-4 py-2 border rounded-md focus:ring-2 outline-none transition-colors';
const CLASE_INPUT_OK = 'border-gray-300 focus:ring-blue-600 focus:border-blue-600';
const CLASE_INPUT_ERROR = 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500';

export default function Login({ onLoginSuccess }) {
  // Estados para capturar cuenta y contraseña del formulario
  const [cuenta, setCuenta] = useState('');
  const [clave, setClave] = useState('');
  // Estado para manejar mensajes de error
  const [error, setError] = useState('');
  // Estado para indicar si la aplicación está esperando
  const [cargando, setCargando] = useState(false);
  // El id de cada input es `login-<campo>` (lo arma ariaDe).
  const { errorDe, ariaDe, validarAlEnviar } = useValidacion({ cuenta, clave }, VALIDADORES, 'login');

  const claseDe = (campo) => `${CLASE_INPUT} ${errorDe(campo) ? CLASE_INPUT_ERROR : CLASE_INPUT_OK}`;

  // Envía las credenciales al WebService (POST /Auth/login). Si son válidas,
  // entrega a App.jsx el usuario ya armado por authService; si no, muestra
  // el mensaje del backend (p. ej. "Correo o Contraseña incorrectos").
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Si falta algún campo se muestra el mensaje debajo y no se llama al WebService.
    if (!validarAlEnviar()) return;
    setError('');
    setCargando(true);

    try {
      const usuario = await iniciarSesion(cuenta.trim(), clave);
      onLoginSuccess(usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        
        {/* Logotipo Institucional */}
        <div className="text-center mb-8">
          <img
            src="/logo-ineel-texto.png"
            alt="Instituto Nacional de Electricidad y Energías Limpias"
            className="h-16 mx-auto object-contain"
          />
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md text-center">
            {error}
          </div>
        )}

        {/* Formulario de Acceso */}
        {/* noValidate desactiva los globos del navegador: se valida con VALIDADORES. */}
        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label htmlFor="login-cuenta" className="block text-sm font-medium text-gray-700 mb-1">
              Cuenta de correo o usuario
            </label>
            <input
              {...ariaDe('cuenta')}
              type="text"
              maxLength={50} // Restricción del WebService[cite: 9]
              autoComplete="username"
              value={cuenta}
              onChange={(e) => setCuenta(e.target.value)}
              className={claseDe('cuenta')}
              placeholder="usuario@dominio"
            />
            <div className="mt-1">
              <MensajeCampo id="login-cuenta" error={errorDe('cuenta')} />
            </div>
          </div>

          <div>
            <label htmlFor="login-clave" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              {...ariaDe('clave')}
              type="password"
              maxLength={16} // Restricción del WebService[cite: 9]
              autoComplete="current-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className={claseDe('clave')}
              placeholder="••••••••"
            />
            <div className="mt-1">
              <MensajeCampo id="login-clave" error={errorDe('clave')} />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition-colors shadow-sm disabled:opacity-50"
          >
            {cargando ? 'Ingresando al sistema...' : 'Iniciar Sesión'}
          </button>
          
        </form>

        {/* Pie de página corporativo */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Sistema de Submedición de Energía Eléctrica (SISMEDIA-RT)
        </div>
        
      </div>
    </div>
  );
}