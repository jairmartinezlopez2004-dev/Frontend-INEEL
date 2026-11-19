/**
 * Login.jsx
 * ---------------------------------------------------------------------------
 * Pantalla de inicio de sesión del visor.
 *
 * Rol en el sistema:
 * Gestiona las credenciales de acceso del usuario y las valida contra el
 * WebService (POST /Auth/login) mediante services/authService.js.
 * Desde aquí también se abren los formularios "Crear cuenta" (Registro.jsx)
 * y "¿Olvidaste tu contraseña?" (RestablecerContrasena.jsx); al terminar
 * cualquiera de los dos se regresa al Login con el correo ya escrito.
 */
import { useState } from 'react';
import { iniciarSesion } from '../../services/authService';
import { useValidacion } from '../../hooks/useValidacion';
import { validarTexto, validarCorreo, CONTRASENA_MAX } from '../../utils/validaciones';
import { MensajeCampo } from '../common/CampoFormulario';
import Registro from './Registro';
import RestablecerContrasena from './RestablecerContrasena';
import { CLASE_INPUT, CLASE_INPUT_OK, CLASE_INPUT_ERROR } from './clasesAuth';
import InputContrasena from '../common/InputContrasena';
import LogosInstitucionales from '../common/LogosInstitucionales';
import { obtenerConfiguracion } from '../../config/configuracion';

// Reglas de cada campo. La cuenta debe ser un correo (el WebService rechaza
// con 400 lo que no lo sea); la contraseña solo no debe estar vacía: las
// credenciales las valida el WebService.
const VALIDADORES = {
  cuenta: validarCorreo,
  clave: (v) => validarTexto(v, { nombre: 'La contraseña', femenino: true, recortar: false }),
};

// Texto exacto con el que el WebService rechaza el login de una cuenta con
// edo = false (Services/AuthService.cs).
const MENSAJE_INACTIVO_BACKEND = 'El usuario está inactivo.';

/**
 * Aviso que se muestra después de registrarse, según la respuesta del backend
 * a POST /Auth/register ({ mensaje, usuario }). Si no trae `usuario.edo`, se
 * usa el `mensaje` del backend tal cual.
 */
function avisoDeRegistro(respuesta) {
  const activa = respuesta?.usuario?.edo;
  if (activa === false) return 'Cuenta creada. Un administrador debe activarla antes de que puedas iniciar sesión.';
  if (activa === true) return 'Cuenta creada. Ya puedes iniciar sesión.';
  return respuesta?.mensaje || 'Cuenta creada.';
}

export default function Login({ onLoginSuccess }) {
  // Estados para capturar cuenta y contraseña del formulario
  const [cuenta, setCuenta] = useState('');
  const [clave, setClave] = useState('');
  // Estado para manejar mensajes de error
  const [error, setError] = useState('');
  // Estado para indicar si la aplicación está esperando
  const [cargando, setCargando] = useState(false);
  // Formulario visible: 'login', 'registro' (Crear cuenta) o 'restablecer'
  // (¿Olvidaste tu contraseña?).
  const [vista, setVista] = useState('login');
  // Aviso de éxito al volver del registro o del restablecimiento.
  const [aviso, setAviso] = useState('');
  // El id de cada input es `login-<campo>` (lo arma ariaDe).
  const { errorDe, ariaDe, validarAlEnviar } = useValidacion({ cuenta, clave }, VALIDADORES, 'login');

  const claseDe = (campo) => `${CLASE_INPUT} ${errorDe(campo) ? CLASE_INPUT_ERROR : CLASE_INPUT_OK}`;

  // Envía las credenciales al WebService (POST /Auth/login). Si son válidas,
  // entrega a App.jsx el usuario ya armado por authService; si no, muestra
  // el mensaje del backend (p. ej. "Correo o Contraseña incorrectos").
  // Al crear la cuenta se vuelve al Login con el correo escrito. El aviso
  // depende de lo que respondió el backend: si la cuenta quedó inactiva
  // (usuario.edo = false), un Administrador o SuperAdministrador debe
  // activarla en Base de datos → Usuarios; si quedó activa, ya puede entrar.
  const alRegistrarse = (correo, respuesta) => {
    setCuenta(correo);
    setClave('');
    setError('');
    setAviso(avisoDeRegistro(respuesta));
    setVista('login');
  };

  // Al cambiar la contraseña se vuelve al Login con el correo escrito y el
  // mensaje del backend ("Contraseña actualizada. Ya puedes iniciar sesión…").
  const alRestablecer = (correo, mensaje) => {
    setCuenta(correo);
    setClave('');
    setError('');
    setAviso(mensaje || 'Contraseña actualizada. Ya puedes iniciar sesión.');
    setVista('login');
  };

  // Abre otro formulario limpiando los avisos del Login.
  const abrir = (nuevaVista) => {
    setError('');
    setAviso('');
    setVista(nuevaVista);
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
      // Cuenta recién registrada (aún sin activar) o dada de baja.
      setError(
        err.message === MENSAJE_INACTIVO_BACKEND
          ? 'Tu cuenta no está activa. Pide a un administrador que te dé acceso.'
          : err.message,
      );
    } finally {
      setCargando(false);
    }
  };

  // Imagen de fondo opcional (config.json → fondoAcceso). Cubre toda la
  // pantalla sin deformarse; la tarjeta blanca queda encima.
  const { fondoAcceso, creditoFondo, enlaceCreditoFondo } = obtenerConfiguracion();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 p-4">
      {fondoAcceso && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${fondoAcceso}")` }}
        />
      )}
      {/* Crédito de la foto de fondo (config.json → creditoFondo). */}
      {fondoAcceso && creditoFondo && (
        <p className="absolute bottom-1 right-2 text-[10px] text-white/80 [text-shadow:0_1px_2px_rgb(0_0_0/0.7)]">
          {enlaceCreditoFondo ? (
            <a href={enlaceCreditoFondo} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {creditoFondo}
            </a>
          ) : (
            creditoFondo
          )}
        </p>
      )}
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        
        {/* Logotipos institucionales (config.json), centrados y apilados: arriba
            el de la empresa (INEEL) y debajo los adicionales (SECIHTI). Este
            bloque es común a inicio de sesión, registro y restablecer contraseña. */}
        <LogosInstitucionales vertical clasePrincipal="h-24" claseAdicional="h-9" className="mb-8" />

        {vista === 'registro' ? (
          <Registro onRegistrado={alRegistrarse} onCancelar={() => setVista('login')} />
        ) : vista === 'restablecer' ? (
          <RestablecerContrasena
            correoInicial={cuenta.trim()}
            onRestablecida={alRestablecer}
            onCancelar={() => setVista('login')}
          />
        ) : (
          <>
            {/* Aviso de cuenta creada */}
            {aviso && (
              <div className="mb-4 p-3 bg-verde-50 border border-verde-200 text-verde-700 text-sm rounded-md text-center">
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
                  Usuario
                </label>
                <input
                  {...ariaDe('cuenta')}
                  type="text"
                  maxLength={50} // Restricción del WebService[cite: 9]
                  autoComplete="username"
                  value={cuenta}
                  onChange={(e) => setCuenta(e.target.value)}
                  className={claseDe('cuenta')}
                  placeholder="usuario@dominio.com"
                />
                <div className="mt-1">
                  <MensajeCampo id="login-cuenta" error={errorDe('cuenta')} />
                </div>
              </div>

              <div>
                <label htmlFor="login-clave" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <InputContrasena
                  {...ariaDe('clave')}
                  maxLength={CONTRASENA_MAX} // Mismo máximo que el registro y Usuarios (utils/validaciones.js)
                  autoComplete="current-password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  className={claseDe('clave')}
                  placeholder="••••••••"
                />
                <div className="mt-1 flex items-start justify-between gap-3">
                  <MensajeCampo id="login-clave" error={errorDe('clave')} />
                  <button
                    type="button"
                    onClick={() => abrir('restablecer')}
                    className="ml-auto shrink-0 text-sm font-medium text-azul-700 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-verde-500 hover:bg-verde-600 text-white font-medium py-2.5 rounded-md transition-colors shadow-sm disabled:opacity-50"
              >
                {cargando ? 'Ingresando al sistema...' : 'Iniciar Sesión'}
              </button>
          
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => abrir('registro')}
                className="font-medium text-azul-700 hover:underline"
              >
                Regístrate
              </button>
            </p>
          </>
        )}

        {/* Siglas del sistema (config.json → siglasSistema), al final de la
            tarjeta en inicio de sesión, registro y restablecer contraseña. */}
        <p className="mt-8 text-center text-2xl font-bold tracking-widest text-gray-700">
          {obtenerConfiguracion().siglasSistema}
        </p>
      </div>
    </div>
  );
}