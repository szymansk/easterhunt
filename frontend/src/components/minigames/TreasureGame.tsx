interface Props {
  imageUrl: string | null
  onComplete: () => void
}

export default function TreasureGame({ imageUrl, onComplete }: Props) {
  return (
    <div className="fixed inset-0 flex flex-col bg-yellow-50">
      <p className="text-center text-2xl font-bold text-orange-600 pt-10 pb-4 px-4">
        Du hast den Schatz gefunden! 🎁
      </p>
      <div className="flex-1 overflow-hidden px-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Schatz"
            className="w-full h-full object-contain rounded-2xl"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl">🎁</span>
          </div>
        )}
      </div>
      <div className="p-6">
        <button
          onClick={onComplete}
          className="w-full py-5 text-2xl font-bold text-white bg-orange-400 rounded-2xl active:scale-95 transition-transform min-h-[60px]"
          data-testid="treasure-complete-btn"
        >
          🎉 Schatz gefunden!
        </button>
      </div>
    </div>
  )
}
