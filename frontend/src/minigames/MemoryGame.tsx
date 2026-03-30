import { useState, useEffect } from 'react'
import type { MemoryConfig, MemoryPair } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface MemoryGameProps {
  config: MemoryConfig
  onComplete?: () => void
}

type CardState = 'hidden' | 'revealed' | 'matched'

interface Card {
  id: string
  pairId: string
  image_url: string
  label: string
  state: CardState
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function buildCards(pairs: MemoryPair[]): Card[] {
  const doubled: Card[] = []
  pairs.forEach((pair) => {
    doubled.push({ id: `${pair.id}-a`, pairId: pair.id, image_url: pair.image_url, label: pair.label, state: 'hidden' })
    doubled.push({ id: `${pair.id}-b`, pairId: pair.id, image_url: pair.image_url, label: pair.label, state: 'hidden' })
  })
  return shuffleArray(doubled)
}

export default function MemoryGame({ config, onComplete }: MemoryGameProps) {
  const [cards, setCards] = useState<Card[]>(() => buildCards(config.pairs))
  const [revealed, setRevealed] = useState<string[]>([])
  const [locked, setLocked] = useState(false)
  const audio = useAudio()
  const tts = useTTS()

  const gridCols = config.grid_cols ?? 4
  const gridClass = gridCols === 2 ? 'grid-cols-2' : gridCols === 3 ? 'grid-cols-3' : 'grid-cols-4'

  useEffect(() => {
    if (revealed.length !== 2) return
    const [firstId, secondId] = revealed
    const first = cards.find((c) => c.id === firstId)!
    const second = cards.find((c) => c.id === secondId)!

    if (first.pairId === second.pairId) {
      audio.play('snap')
      tts.speak(first.label)
      setCards((prev) =>
        prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, state: 'matched' } : c))
      )
      setRevealed([])
    } else {
      setLocked(true)
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, state: 'hidden' } : c))
        )
        setRevealed([])
        setLocked(false)
      }, 800)
    }
  }, [revealed]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.state === 'matched')) {
      audio.play('success')
      setTimeout(() => {
        onComplete?.()
      }, 600)
    }
  }, [cards]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTap(card: Card) {
    if (locked) return
    if (card.state !== 'hidden') return
    if (revealed.includes(card.id)) return
    if (revealed.length >= 2) return

    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, state: 'revealed' } : c))
    )
    setRevealed((prev) => [...prev, card.id])
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Memory</h2>
      <div className={`grid ${gridClass} gap-3 w-full max-w-sm`}>
        {cards.map((card) => {
          const isHidden = card.state === 'hidden'
          const isMatched = card.state === 'matched'
          return (
            <button
              key={card.id}
              onClick={() => handleTap(card)}
              data-testid={`memory-card-${card.id}`}
              aria-label={isHidden ? 'Karte' : card.label}
              className={`relative rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                isMatched
                  ? 'border-green-400 bg-green-50'
                  : isHidden
                  ? 'border-gray-200 bg-white'
                  : 'border-blue-400 bg-blue-50'
              }`}
              style={{ aspectRatio: '1', transform: isHidden ? 'rotateY(0deg)' : 'rotateY(180deg)' }}
            >
              {isHidden ? (
                <div className="w-full h-full flex items-center justify-center text-3xl">?</div>
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center p-1"
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  {card.image_url ? (
                    <img src={card.image_url} alt={card.label} className="w-full h-4/5 object-contain" />
                  ) : (
                    <span className="text-2xl">{card.label}</span>
                  )}
                  <span className="text-xs text-gray-600 mt-1 text-center">{card.label}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
