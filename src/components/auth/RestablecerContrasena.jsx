/**
 * RestablecerContrasena.jsx
 * ---------------------------------------------------------------------------
 * Formulario "¿Olvidaste tu contraseña?" de la pantalla de acceso, con código
 * de verificación por correo. Aplica igual a Usuario, Administrador y
 * SuperAdministrador.
 *
 * Rol en el sistema:
 * Lo muestra Login.jsx al pulsar "¿Olvidaste tu contraseña?". Tiene dos pasos:
 * 1. Correo: pide un código de 6 dígitos (POST /Contrasena/solicitar-codigo).
 *    El backend siempre responde lo mismo, exista o no la cuenta.
 * 2. Código: con el código, la contraseña nueva y su confirmación cambia la
 *    contraseña (POST /Contrasena/restablecer).
 * Al terminar se regresa al Login con el correo ya escrito.
 *
 * Reglas del backend que se reflejan aquí: el código vence en 15 minutos, se
 * invalida tras 5 intentos incorrectos y no se puede pedir otro antes de 60
 * segundos (el botón "Reenviar código" espera ese tiempo).
 */
import { useEffect, useState } from 'react';
import { restablecerContrasena, solicitarCodigoContrasena } from '../../services/authService';
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
import InputContrasena from '../common/InputContrasena';

// Mismo largo máximo de correo que el Login y el registro.
const CORREO_MAX = 50;

// Segundos que el backend exige entre dos solicitudes de código.
const SEGUNDOS_ENTRE_CODIGOS = 60;

// Reglas de cada paso, en el orden en que aparecen los campos en pantalla.
const validadoresCorreo = {
  correo: (v) => validarCorreo(v) ?? validarTexto(v, { nombre: 'El correo', maximo: CORREO_MAX }),
};

const validadoresCodigo = (contrasena) => ({
  codigo: (v) => {
    if (!v) return 'Escribe el código que te llegó por correo.';
    return /^\d{6}$/.test(v) ? null : 'El código tiene 6 dígitos.';
  },
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
  const [paso, setPaso] = useState('correo'); // 'correo' | 'codigo'
  const [form, setForm] = useState({ correo: correoInicial, codigo: '', contrasena: '', confirmacion: '' });
  const [error, setError] = useState(''); // Error devuelto por el WebService.
  const [aviso, setAviso] = useState(''); // Confirmación de código enviado.
  const [cargando, setCargando] = useState(false);
  const [espera, setEspera] = useState(0); // Segundos que faltan para poder reenviar el código.

  // El id de cada input es `restablecer-<campo>` (lo arma ariaDe).
  const { errorDe, ariaDe, validarAlEnviar } = useValidacion(
    form,
    paso === 'correo' ? validadoresCorreo : validadoresCodigo(form.contrasena),
    'restablecer',
  );

  // Cuenta regresiva para "Reenviar código".
  useEffect(() => {
    if (espera <= 0) return undefined;
    const temporizador = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(temporizador);
  }, [espera]);

  const claseDe = (campo) => `${CLASE_INPUT} ${errorDe(campo) ? CLASE_INPUT_ERROR : CLASE_INPUT_OK}`;

  const actualizar = (campo) => (e) => {
    // El código solo admite dígitos (máximo 6).
    const valor = campo === 'codigo' ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value;
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  // Pide el código (POST /Contrasena/solicitar-codigo).
  const pedirCodigo = async () => {
    setError('');
    setCargando(true);
    try {
      const respuesta = await solicitarCodigoContrasena(form.correo.trim());
      setAviso(
        `${respuesta?.mensaje ?? 'Si el correo pertenece a una cuenta activa, recibirás un código.'} ` +
          'Revisa también la carpeta de spam.',
      );
      setEspera(SEGUNDOS_ENTRE_CODIGOS);
      setPaso('codigo');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const enviarCorreo = async (e) => {
    e.preventDefault();
    if (!validarAlEnviar()) return;
    await pedirCodigo();
  };

  // Cambia la contraseña con el código (POST /Contrasena/restablecer). El
  // backend responde 400 si el código es incorrecto o venció, o si la
  // contraseña nueva no cumple la política o es igual a la actual.
  const enviarCodigo = async (e) => {
    e.preventDefault();
    if (!validarAlEnviar()) return;
    setError('');
    setCargando(true);

    const correo = form.correo.trim();
    try {
      const respuesta = await restablecerContrasena({
        correo,
        codigo: form.codigo,
        nuevaContrasena: form.contrasena,
      });
      onRestablecida(correo, respuesta?.mensaje);
    } catch (err) {
      setError(err.message);
      setCargando(false);
    }
  };

  // Regresa al paso del correo (por ejemplo, si se escribió mal).
  const cambiarCorreo = () => {
    setPaso('correo');
    setError('');
    setAviso('');
    setForm((prev) => ({ ...prev, codigo: '', contrasena: '', confirmacion: '' }));
  };

  // Campo con etiqueta, input, mensaje de error y contenido opcional debajo.
  // Los campos con type 'password' usan InputContrasena (botón de ojo para mostrarla).
  const campo = (nombre, etiqueta, props, debajo) => {
    const Control = props.type === 'password' ? InputContrasena : 'input';
    return (
      <div>
        <label htmlFor={`restablecer-${nombre}`} className="block text-sm font-medium text-gray-700 mb-1">
          {etiqueta}
        </label>
        <Control
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
  };

  const botonPrincipal =
    'w-full bg-verde-500 hover:bg-verde-600 text-white font-medium py-2.5 rounded-md transition-colors shadow-sm disabled:opacity-50';
  const enlace = 'font-medium text-blue-600 hover:text-blue-800 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline';

  return (
    <>
      <h1 className="mb-2 text-center text-lg font-semibold text-gray-800">Restablecer contraseña</h1>
      <p className="mb-6 text-center text-sm text-gray-600">
        {paso === 'correo'
          ? 'Escribe el correo de tu cuenta y te enviaremos un código de verificación.'
          : 'Escribe el código que te enviamos y tu contraseña nueva.'}
      </p>

      {/* Mensaje de Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md text-center">
          {error}
        </div>
      )}

      {paso === 'correo' ? (
        // noValidate desactiva los globos del navegador: se valida con los validadores de cada paso.
        <form noValidate onSubmit={enviarCorreo} className="space-y-5">
          {campo('correo', 'Correo', {
            type: 'email',
            maxLength: CORREO_MAX,
            autoComplete: 'username',
            placeholder: 'usuario@dominio.com',
          })}

          <button type="submit" disabled={cargando} className={botonPrincipal}>
            {cargando ? 'Enviando...' : 'Enviar código'}
          </button>
        </form>
      ) : (
        <>
          {/* Aviso de código enviado y correo al que se envió */}
          {aviso && (
            <div className="mb-4 p-3 bg-verde-50 border border-verde-200 text-verde-700 text-sm rounded-md text-center">
              {aviso}
            </div>
          )}
          <p className="mb-5 text-center text-sm text-gray-600">
            Correo: <span className="font-medium text-gray-800">{form.correo.trim()}</span>{' '}
            <button type="button" onClick={cambiarCorreo} className={enlace}>
              Cambiar
            </button>
          </p>

          <form noValidate onSubmit={enviarCodigo} className="space-y-5">
            {campo(
              'codigo',
              'Código de verificación',
              {
                type: 'text',
                inputMode: 'numeric',
                autoComplete: 'one-time-code',
                maxLength: 6,
                placeholder: '123456',
              },
              <p className="text-xs text-gray-500">
                {espera > 0 ? (
                  `¿No te llegó? Podrás pedir otro en ${espera} s.`
                ) : (
                  <>
                    ¿No te llegó?{' '}
                    <button type="button" onClick={pedirCodigo} disabled={cargando} className={enlace}>
                      Reenviar código
                    </button>
                  </>
                )}
              </p>,
            )}
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

            <button type="submit" disabled={cargando} className={botonPrincipal}>
              {cargando ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-gray-600">
        ¿La recordaste?{' '}
        <button type="button" onClick={onCancelar} className={enlace}>
          Inicia sesión
        </button>
      </p>
    </>
  );
}
