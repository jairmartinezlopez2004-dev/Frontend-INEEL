/**
 * Registro.jsx
 * ---------------------------------------------------------------------------
 * Formulario "Crear cuenta" de la pantalla de acceso.
 *
 * Rol en el sistema:
 * Lo muestra Login.jsx al pulsar "Regístrate". Envía nombre, correo y
 * contraseña al WebService (POST /Auth/register) mediante authService.js. El
 * backend siempre crea la cuenta con rol Usuario y no inicia sesión, así que
 * al terminar se regresa al Login con el correo ya escrito.
 */
import { useState } from 'react';
import { registrarCuenta } from '../../services/authService';
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

// Largos de correo y nombre: el correo hasta 50 (igual que el Login) y el
// nombre hasta 50 (columna nombreUsuario de la BD).
const CORREO_MAX = 50;
const NOMBRE_MAX = 50;

const FORM_VACIO = { nombreUsuario: '', correo: '', contrasena: '', confirmacion: '' };

// Reglas de cada campo, en el orden en que aparecen en pantalla.
const validadoresPara = (contrasena) => ({
  nombreUsuario: (v) => validarTexto(v, { nombre: 'El nombre', maximo: NOMBRE_MAX }),
  correo: (v) => validarCorreo(v) ?? validarTexto(v, { nombre: 'El correo', maximo: CORREO_MAX }),
  contrasena: validarContrasena,
  confirmacion: (v) => {
    if (!v) return 'Confirma la contraseña.';
    return v === contrasena ? null : 'Las contraseñas no coinciden.';
  },
});

// Props:
// - onRegistrado: callback con el correo de la cuenta creada.
// - onCancelar: callback para volver al Login sin registrarse.
export default function Registro({ onRegistrado, onCancelar }) {
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState(''); // Error devuelto por el WebService.
  const [cargando, setCargando] = useState(false);
  // El id de cada input es `registro-<campo>` (lo arma ariaDe).
  const { errorDe, ariaDe, validarAlEnviar } = useValidacion(
    form,
    validadoresPara(form.contrasena),
    'registro',
  );

  const claseDe = (campo) => `${CLASE_INPUT} ${errorDe(campo) ? CLASE_INPUT_ERROR : CLASE_INPUT_OK}`;

  const actualizar = (campo) => (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  // Crea la cuenta (POST /Auth/register). Si el correo ya existe el backend
  // responde 409 con "Ya existe un usuario con ese correo.".
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarAlEnviar()) return;
    setError('');
    setCargando(true);

    const correo = form.correo.trim();
    try {
      await registrarCuenta({
        nombreUsuario: form.nombreUsuario.trim(),
        correo,
        contrasena: form.contrasena,
      });
      onRegistrado(correo);
    } catch (err) {
      setError(err.message);
      setCargando(false);
    }
  };

  // Campo con etiqueta, input, mensaje de error y contenido opcional debajo.
  const campo = (nombre, etiqueta, props, debajo) => (
    <div>
      <label htmlFor={`registro-${nombre}`} className="block text-sm font-medium text-gray-700 mb-1">
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
        <MensajeCampo id={`registro-${nombre}`} error={errorDe(nombre)} />
        {debajo}
      </div>
    </div>
  );

  return (
    <>
      <h1 className="mb-6 text-center text-lg font-semibold text-gray-800">Crear cuenta</h1>

      {/* Mensaje de Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md text-center">
          {error}
        </div>
      )}

      {/* noValidate desactiva los globos del navegador: se valida con validadoresPara. */}
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        {campo('nombreUsuario', 'Nombre', {
          type: 'text',
          maxLength: NOMBRE_MAX,
          autoComplete: 'name',
          placeholder: 'Nombre y apellido',
        })}
        {campo('correo', 'Correo', {
          type: 'email',
          maxLength: CORREO_MAX,
          autoComplete: 'email',
          placeholder: 'usuario@dominio',
        })}
        {campo(
          'contrasena',
          'Contraseña',
          {
            type: 'password',
            maxLength: CONTRASENA_MAX,
            autoComplete: 'new-password',
            placeholder: '••••••••',
          },
          <RequisitosContrasena valor={form.contrasena} />,
        )}
        {campo('confirmacion', 'Confirmar contraseña', {
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
          {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <button type="button" onClick={onCancelar} className="font-medium text-blue-600 hover:underline">
          Inicia sesión
        </button>
      </p>
    </>
  );
}
