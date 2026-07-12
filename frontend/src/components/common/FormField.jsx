const FormField = ({
  label,
  error,
  id,
  type = 'text',
  children,
  className = '',
  ...props
}) => {
  const inputStyles = `w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed ${
    error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200'
  }`

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {label}
        </label>
      )}
      {children ? (
        // Allow children to override the input (like select, custom datepickers, etc.)
        typeof children === 'function' ? children({ id, className: inputStyles }) : children
      ) : (
        <input
          id={id}
          type={type}
          className={inputStyles}
          {...props}
        />
      )}
      {error && (
        <p className="text-xs font-medium text-red-600 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField
