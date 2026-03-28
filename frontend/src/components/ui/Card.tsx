interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-md p-4 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
