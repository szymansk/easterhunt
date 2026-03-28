interface NumberRiddleGameProps {
  question: string
  correctAnswer: number
  onComplete?: () => void
}

export default function NumberRiddleGame({ question, correctAnswer, onComplete }: NumberRiddleGameProps) {
  function handleAnswer(value: number) {
    if (value === correctAnswer) {
      onComplete?.()
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-6 text-center">
        <div className="text-5xl mb-4">🔢</div>
        <h2 className="text-xl font-bold text-gray-800 mb-6">{question}</h2>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => handleAnswer(n)}
              className="w-full aspect-square rounded-xl bg-blue-100 text-blue-800 font-bold text-lg hover:bg-blue-200 active:scale-95 transition-transform"
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
