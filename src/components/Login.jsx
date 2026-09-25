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

export default function Login({ onLoginSuccess }) {
  // Estados para capturar cuenta y contraseña del formulario
  const [cuenta, setCuenta] = useState('');
  const [clave, setClave] = useState('');
  // Estado para manejar mensajes de error
  const [error, setError] = useState('');
  // Estado para indicar si la aplicación está esperando
  const [cargando, setCargando] = useState(false);

  // Envía las credenciales al WebService (POST /Auth/login). Si son válidas,
  // entrega a App.jsx el usuario ya armado por authService; si no, muestra
  // el mensaje del backend (p. ej. "Correo o Contraseña incorrectos").
  const handleSubmit = async (e) => {
    e.preventDefault();
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
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label htmlFor="cuenta" className="block text-sm font-medium text-gray-700 mb-1">
              Cuenta de correo o usuario
            </label>
            <input
              id="cuenta"
              type="text"
              maxLength={50} // Restricción del WebService[cite: 9]
              value={cuenta}
              onChange={(e) => setCuenta(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors"
              placeholder="usuario@dominio"
              required
            />
          </div>

          <div>
            <label htmlFor="clave" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="clave"
              type="password"
              maxLength={16} // Restricción del WebService[cite: 9]
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors"
              placeholder="••••••••"
              required
            />
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