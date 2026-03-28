interface BigButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  className?: string
}

export default function BigButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
}: BigButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ minHeight: '60px', minWidth: '120px' }}
      className={`
        rounded-xl font-semibold text-lg px-6 py-3 transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${className}
      `.trim()}
    >
      {children}
    </button>
  )
}
