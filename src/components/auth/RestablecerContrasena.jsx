/**
 * RestablecerContrasena.jsx
 * ---------------------------------------------------------------------------
 * Formulario "¿Olvidaste tu contraseña?" de la pantalla de acceso.
 *
 * Rol en el sistema:
 * Lo muestra Login.jsx al pulsar "¿Olvidaste tu contraseña?". Envía el correo
 * y la contraseña nueva al WebService (POST /Contrasena/restablecer) mediante
 * authService.js. El servicio es público (no requiere sesión) y no envía
 * correo de verificación; al terminar se regresa al Login con el correo ya
 * escrito para entrar con la contraseña nueva.
 */
import { useState } from 'react';
import { restablecerContrasena } from '../../services/authService';
import { useValidacion } from '../../hooks/useValidacion';
import {
  validarTexto,
  validarCorreo,
  validarContrasena,
  CONTRASENA_MAX,
} from '../../utils/validaciones';
import { MensajeCampo } from '../common/CampoFormulario';
import RequisitosContrasena from '../common/RequisitosContrasena';
import { CLASE_INPUT, CLASE_INPUT_OK, CLASE_INPUT_ERROR } from './clasesAuth';

// Mismo largo máximo de correo que el Login y el registro.
const CORREO_MAX = 50;

// Reglas de cada campo, en el orden en que aparecen en pantalla.
const validadoresPara = (contrasena) => ({
  correo: (v) => validarCorreo(v) ?? validarTexto(v, { nombre: 'El correo', maximo: CORREO_MAX }),
  contrasena: validarContrasena,
  confirmacion: (v) => {
    if (!v) return 'Confirma la contraseña.';
    return v === contrasena ? null : 'Las contraseñas no coinciden.';
  },
});

// Props:
// - correoInicial: correo que ya estaba escrito en el Login (puede venir vacío).
// - onRestablecida: callback con el correo y el mensaje del backend al terminar.
// - onCancelar: callback para volver al Login sin cambiar la contraseña.
export default function RestablecerContrasena({ correoInicial = '', onRestablecida, onCancelar }) {
  const [form, setForm] = useState({ correo: correoInicial, contrasena: '', confirmacion: '' });
  const [error, setError] = useState(''); // Error devuelto por el WebService.
  const [cargando, setCargando] = useState(false);
  // El id de cada input es `restablecer-<campo>` (lo arma ariaDe).
  const { errorDe, ariaDe, validarAlEnviar } = useValidacion(
    form,
    validadoresPara(form.contrasena),
    'restablecer',
  );

  const claseDe = (campo) => `${CLASE_INPUT} ${errorDe(campo) ? CLASE_INPUT_ERROR : CLASE_INPUT_OK}`;

  const actualizar = (campo) => (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  // Cambia la contraseña (POST /Contrasena/restablecer). El backend responde
  // 400 con su mensaje si no hay una cuenta activa con ese correo o si la
  // contraseña nueva es igual a la actual.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarAlEnviar()) return;
    setError('');
    setCargando(true);

    const correo = form.correo.trim();
    try {
      const respuesta = await restablecerContrasena({ correo, nuevaContrasena: form.contrasena });
      onRestablecida(correo, respuesta?.mensaje);
    } catch (err) {
      setError(err.message);
      setCargando(false);
    }
  };

  // Campo con etiqueta, input, mensaje de error y contenido opcional debajo.
  const campo = (nombre, etiqueta, props, debajo) => (
    <div>
      <label htmlFor={`restablecer-${nombre}`} className="block text-sm font-medium text-gray-700 mb-1">
        {etiqueta}
      </label>
      <input
        {...ariaDe(nombre)}
        {...props}
        value={form[nombre]}
        onChange={actualizar(nombre)}
        className={claseDe(nombre)}
      />
      <div className="mt-1 space-y-1.5">
        <MensajeCampo id={`restablecer-${nombre}`} error={errorDe(nombre)} />
        {debajo}
      </div>
    </div>
  );

  return (
    <>
      <h1 className="mb-2 text-center text-lg font-semibold text-gray-800">Restablecer contraseña</h1>
      <p className="mb-6 text-center text-sm text-gray-600">
        Escribe el correo de tu cuenta y la contraseña nueva.
      </p>

      {/* Mensaje de Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md text-center">
          {error}
        </div>
      )}

      {/* noValidate desactiva los globos del navegador: se valida con validadoresPara. */}
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        {campo('correo', 'Correo', {
          type: 'email',
          maxLength: CORREO_MAX,
          autoComplete: 'username',
          placeholder: 'usuario@dominio.com',
        })}
        {campo(
          'contrasena',
          'Contraseña nueva',
          {
            type: 'password',
            maxLength: CONTRASENA_MAX,
            autoComplete: 'new-password',
            placeholder: '••••••••',
          },
          <RequisitosContrasena valor={form.contrasena} />,
        )}
        {campo('confirmacion', 'Confirmar contraseña nueva', {
          type: 'password',
          maxLength: CONTRASENA_MAX,
          autoComplete: 'new-password',
          placeholder: '••••••••',
        })}

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition-colors shadow-sm disabled:opacity-50"
        >
          {cargando ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        ¿La recordaste?{' '}
        <button type="button" onClick={onCancelar} className="font-medium text-blue-600 hover:underline">
          Inicia sesión
        </button>
      </p>
    </>
  );
}
