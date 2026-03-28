interface MazeGameProps {
  onComplete?: () => void
}

export default function MazeGame({ onComplete }: MazeGameProps) {
  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-6 text-center">
        <div className="text-5xl mb-4">🌿</div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Labyrinth</h2>
        <p className="text-gray-500 mb-6">Finde den Weg durch das Labyrinth!</p>
        <button
          onClick={onComplete}
          className="w-full py-3 bg-green-400 text-white rounded-xl font-bold text-lg active:scale-95 transition-transform"
        >
          Geschafft! ✓
        </button>
      </div>
    </div>
  )
}
