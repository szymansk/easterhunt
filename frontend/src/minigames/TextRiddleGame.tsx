interface TextRiddleGameProps {
  question: string
  options: string[]
  answerMode: 'multiple_choice' | 'single_tap'
  onComplete?: () => void
}

export default function TextRiddleGame({ question, options, answerMode, onComplete }: TextRiddleGameProps) {
  if (answerMode === 'single_tap') {
    return (
      <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-5xl mb-4">🤔</div>
          <h2 className="text-xl font-bold text-gray-800 mb-6">{question}</h2>
          <button
            onClick={onComplete}
            className="w-full py-4 bg-purple-400 text-white rounded-xl font-bold text-lg active:scale-95 transition-transform"
          >
            Antwort tippen!
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-6">
        <div className="text-5xl text-center mb-4">🤔</div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">{question}</h2>
        <div className="space-y-3">
          {options.map((option, idx) => (
            <button
              key={idx}
              onClick={onComplete}
              className="w-full py-3 px-4 bg-purple-100 text-purple-800 rounded-xl font-semibold text-left hover:bg-purple-200 active:scale-95 transition-transform"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
