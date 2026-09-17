function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}

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

function CheckboxField({ label, defaultChecked }) {
  return (
    <label className="flex items-center gap-2 pt-6">
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
      />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  )
}

function SectionBox({ title, children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  )
}

function ComsForm() {
  return (
    <form className="flex flex-col gap-6">
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

      <SectionBox title="Parámetros">
        <SelectField
          label="Empaquetado"
          defaultValue="LittleEndian"
          options={['LittleEndian', 'BigEndian']}
        />
        <CheckboxField label="Ver mensajes RxTx" defaultChecked={false} />
      </SectionBox>

      <div className="flex justify-center border-t border-slate-200 pt-6">
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Aceptar
        </button>
      </div>
    </form>
  )
}

export default ComsForm
