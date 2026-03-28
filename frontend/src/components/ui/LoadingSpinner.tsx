interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  }

  return (
    <div
      role="status"
      aria-label="Laden..."
      className={`${sizeClasses[size]} rounded-full border-gray-300 border-t-blue-500 animate-spin`}
    />
  )
}
