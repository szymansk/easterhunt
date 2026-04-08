interface SuccessOverlayProps {
  message?: string
  onClose: () => void
}

export default function SuccessOverlay({
  message = 'Super gemacht!',
  onClose,
}: SuccessOverlayProps) {
  return (
    <div
      data-testid="station-complete"
      className="fixed inset-0 z-50 flex items-center justify-center bg-green-500 bg-opacity-90 animate-pulse"
      onClick={onClose}
      role="alert"
    >
      <div className="text-center text-white">
        <div className="text-8xl mb-6" aria-hidden="true">🎉</div>
        <h2 className="text-4xl font-bold mb-4">{message}</h2>
        <p className="text-xl opacity-80">Tippe um weiterzumachen</p>
      </div>
    </div>
  )
}
