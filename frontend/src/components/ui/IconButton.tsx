interface IconButtonProps {
  icon: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  label: string
  className?: string
}

export default function IconButton({
  icon,
  onClick,
  disabled = false,
  label,
  className = '',
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{ minHeight: '44px', minWidth: '44px' }}
      className={`
        flex items-center justify-center rounded-lg transition-colors
        hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `.trim()}
    >
      {icon}
    </button>
  )
}
