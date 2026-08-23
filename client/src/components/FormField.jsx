export default function FormField({
  label,
  id,
  error,
  type = 'text',
  ...inputProps
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input id={id} type={type} className="field-line" {...inputProps} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
