interface PictureRiddleGameProps {
  question: string
  onComplete?: () => void
}

export default function PictureRiddleGame({ question, onComplete }: PictureRiddleGameProps) {
  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-6 text-center">
        <div className="text-5xl mb-4">🖼️</div>
        <h2 className="text-xl font-bold text-gray-800 mb-6">{question}</h2>
        <button
          onClick={onComplete}
          className="w-full py-3 bg-yellow-400 text-white rounded-xl font-bold text-lg active:scale-95 transition-transform"
        >
          Richtig! ✓
        </button>
      </div>
    </div>
  )
}
