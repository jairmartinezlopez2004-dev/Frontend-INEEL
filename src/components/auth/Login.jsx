/**
 * Login.jsx
 * ---------------------------------------------------------------------------
 * Pantalla de inicio de sesión del Visor SISMEDIA-RT.
 *
 * Rol en el sistema:
 * Gestiona las credenciales de acceso del usuario y las valida contra el
 * WebService (POST /Auth/login) mediante services/authService.js.
 * Desde aquí también se abre el formulario "Crear cuenta" (Registro.jsx);
 * al terminar el registro se regresa al Login con el correo ya escrito.
 */
import { useState } from 'react';
import { iniciarSesion } from '../../services/authService';
import { useValidacion } from '../../hooks/useValidacion';
import { validarTexto, CONTRASENA_MAX } from '../../utils/validaciones';
import { MensajeCampo } from '../common/CampoFormulario';
import Registro from './Registro';
import { CLASE_INPUT, CLASE_INPUT_OK, CLASE_INPUT_ERROR } from './clasesAuth';

// Reglas de cada campo. En el login solo se pide que no estén vacíos: las
// credenciales las valida el WebService.
const VALIDADORES = {
  cuenta: (v) => validarTexto(v, { nombre: 'La cuenta', femenino: true }),
  clave: (v) => validarTexto(v, { nombre: 'La contraseña', femenino: true, recortar: false }),
};

export default function Login({ onLoginSuccess }) {
  // Estados para capturar cuenta y contraseña del formulario
  const [cuenta, setCuenta] = useState('');
  const [clave, setClave] = useState('');
  // Estado para manejar mensajes de error
  const [error, setError] = useState('');
  // Estado para indicar si la aplicación está esperando
  const [cargando, setCargando] = useState(false);
  // true mientras se muestra el formulario "Crear cuenta" en lugar del Login.
  const [registrando, setRegistrando] = useState(false);
  // Aviso de éxito al volver del registro.
  const [aviso, setAviso] = useState('');
  // El id de cada input es `login-<campo>` (lo arma ariaDe).
  const { errorDe, ariaDe, validarAlEnviar } = useValidacion({ cuenta, clave }, VALIDADORES, 'login');

  const claseDe = (campo) => `${CLASE_INPUT} ${errorDe(campo) ? CLASE_INPUT_ERROR : CLASE_INPUT_OK}`;

  // Envía las credenciales al WebService (POST /Auth/login). Si son válidas,
  // entrega a App.jsx el usuario ya armado por authService; si no, muestra
  // el mensaje del backend (p. ej. "Correo o Contraseña incorrectos").
  // Al crear la cuenta se vuelve al Login con el correo escrito, para que la
  // persona solo tenga que escribir su contraseña.
  const alRegistrarse = (correo) => {
    setCuenta(correo);
    setClave('');
    setError('');
    setAviso('Cuenta creada. Ya puedes iniciar sesión.');
    setRegistrando(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Si falta algún campo se muestra el mensaje debajo y no se llama al WebService.
    if (!validarAlEnviar()) return;
    setError('');
    setAviso('');
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
            className="h-28 mx-auto object-contain" // 112 px: tamaño habitual de logo en pantallas de acceso
          />
        </div>

        {registrando ? (
          <Registro onRegistrado={alRegistrarse} onCancelar={() => setRegistrando(false)} />
        ) : (
          <>
            {/* Aviso de cuenta creada */}
            {aviso && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md text-center">
                {aviso}
              </div>
            )}

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
                  maxLength={CONTRASENA_MAX} // Mismo máximo que el registro y Usuarios (utils/validaciones.js)
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

            <p className="mt-6 text-center text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setAviso('');
                  setRegistrando(true);
                }}
                className="font-medium text-blue-600 hover:underline"
              >
                Regístrate
              </button>
            </p>
          </>
        )}

        {/* Pie de página corporativo */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Sistema de Submedición de Energía Eléctrica (SISMEDIA-RT)
        </div>
        
      </div>
    </div>
  );
}