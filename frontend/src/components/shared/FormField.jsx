export function FormField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  ...props
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        className={`w-full rounded-md border px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[var(--color-primary)] ${error ? "border-[var(--color-danger)]" : "border-slate-300"}`}
        {...props}
      />
      {error ? (
        <span className="text-sm text-[var(--color-danger)]" aria-live="polite">
          {error}
        </span>
      ) : null}
    </label>
  );
}
