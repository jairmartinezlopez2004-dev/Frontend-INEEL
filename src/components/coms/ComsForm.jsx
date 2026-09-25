/**
 * ComsForm.jsx
 * ---------------------------------------------------------------------------
 * Formulario de configuración de comunicaciones con el medidor: tipo de
 * transporte (Serial/TCP), protocolo, y parámetros específicos de la
 * conexión serial (puerto COM, baud rate, paridad, bits de datos/paro,
 * timeout) y de empaquetado de datos.
 *
 * Rol en el sistema:
 * Es la vista principal de la pestaña "Coms" dentro del módulo Medidores.
 * Define visualmente todos los parámetros que, en producción, se enviarían
 * al WebService para configurar cómo la aplicación debe comunicarse
 * físicamente con el medidor (por puerto serial o por red).
 *
 * Integración con el WebService:
 * Actualmente el formulario es "de maqueta": todos los campos usan
 * `defaultValue`/`defaultChecked` (no controlados) y el botón "Aceptar" no
 * dispara ninguna petición todavía. Cuando se conecte el backend real, este
 * formulario deberá pasar a componentes controlados (useState + value/checked)
 * y el botón "Aceptar" deberá invocar el método del WebService que persiste
 * la configuración de comunicación (por ejemplo, algo como
 * GuardarConfiguracionComunicacion).
 */

// Envoltorio genérico de un campo de formulario: etiqueta + control (children).
function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      {children}
    </label>
  )
}

// Campo tipo <select> reutilizable, ya envuelto en su Field con etiqueta.
function SelectField({ label, defaultValue, options }) {
  return (
    <Field label={label}>
      <select
        defaultValue={defaultValue}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </Field>
  )
}

// Campo tipo checkbox reutilizable, con su etiqueta a la derecha.
function CheckboxField({ label, defaultChecked }) {
  return (
    <label className="flex items-center gap-2 pt-6">
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
      />
      <span className="text-sm font-semibold text-slate-900">{label}</span>
    </label>
  )
}

// Caja/sección con título, usada para agrupar visualmente varios campos relacionados
// (ej. "Parámetros serial", "Parámetros" de empaquetado).
function SectionBox({ title, children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-800">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  )
}

function ComsForm() {
  return (
    <form className="flex flex-col gap-6">
      {/* Fila superior: parámetros generales de comunicación (transporte, RF, protocolo). */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SelectField
          label="Transporte"
          defaultValue="SERIAL"
          options={['SERIAL', 'TCP/IP']}
        />
        <CheckboxField label="Usar RF" defaultChecked={false} />
        <SelectField
          label="Protocolo"
          defaultValue="ComsCECv25"
          options={['ComsCECv25', 'ComsCECv30', 'DLMS']}
        />
      </div>

      {/* Sección de parámetros específicos de la conexión serial (puerto físico). */}
      <SectionBox title="Parámetros serial">
        <SelectField
          label="Com"
          defaultValue="COM3"
          options={['COM1', 'COM2', 'COM3', 'COM4', 'COM5']}
        />
        <SelectField
          label="Baud Rate"
          defaultValue="38400"
          options={['2400', '9600', '19200', '38400', '57600', '115200']}
        />
        <SelectField
          label="Paridad"
          defaultValue="Ninguna"
          options={['Ninguna', 'Par', 'Impar']}
        />
        <SelectField label="Bits de Datos" defaultValue="8" options={['7', '8']} />
        <SelectField label="Bits de Paro" defaultValue="1" options={['1', '2']} />
        <Field label="TimeOut (ms)">
          <input
            type="number"
            defaultValue={5000}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>
      </SectionBox>

      {/* Sección de parámetros de empaquetado/depuración de datos. */}
      <SectionBox title="Parámetros">
        <SelectField
          label="Empaquetado"
          defaultValue="LittleEndian"
          options={['LittleEndian', 'BigEndian']}
        />
        <CheckboxField label="Ver mensajes RxTx" defaultChecked={false} />
      </SectionBox>

      {/* Botón de acción principal del formulario. Pendiente de conectar con el
          WebService que persiste esta configuración de comunicación. */}
      <div className="flex justify-center border-t border-slate-200 pt-6">
        <button
          type="button"
          className="transform cursor-pointer rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 hover:shadow-md active:scale-95"
        >
          Aceptar
        </button>
      </div>
    </form>
  )
}

export default ComsForm
