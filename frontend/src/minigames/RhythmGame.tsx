import { useState, useRef } from 'react'
import type { RhythmConfig } from '../types'
import { useAudio } from '../hooks/useAudio'
import { useTTS } from '../hooks/useTTS'

interface RhythmGameProps {
  config: RhythmConfig
  onComplete?: () => void
}

type Phase = 'idle' | 'playing' | 'waiting' | 'listening' | 'result'

export default function RhythmGame({ config, onComplete }: RhythmGameProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [isFlashing, setIsFlashing] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [resultMsg, setResultMsg] = useState('')
  const tapTimestamps = useRef<number[]>([])
  const audio = useAudio()
  const tts = useTTS()

  async function playPattern() {
    setPhase('playing')
    for (const beat of config.pattern) {
      await delay(beat.delay_ms)
      setIsFlashing(true)
      audio.play('snap')
      await delay(150)
      setIsFlashing(false)
    }
    setPhase('waiting')
    await delay(800)
    tts.speak('Jetzt du!')
    setPhase('listening')
    tapTimestamps.current = []
  }

  function handleTap() {
    if (phase !== 'listening') {
      if (phase === 'idle') playPattern()
      return
    }

    tapTimestamps.current.push(performance.now())
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 150)

    if (tapTimestamps.current.length >= config.pattern.length) {
      evaluateTaps()
    }
  }

  function evaluateTaps() {
    const taps = tapTimestamps.current
    if (taps.length < 2 || config.pattern.length < 2) {
      handleSuccess()
      return
    }

    const tapIntervals = taps.slice(1).map((t, i) => t - taps[i])
    const patternIntervals = config.pattern.slice(1).map((b) => b.delay_ms)

    let correct = true
    for (let i = 0; i < Math.min(tapIntervals.length, patternIntervals.length); i++) {
      if (Math.abs(tapIntervals[i] - patternIntervals[i]) > config.tolerance_ms) {
        correct = false
        break
      }
    }

    if (correct) {
      handleSuccess()
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts < config.max_attempts) {
        setPhase('idle')
        setResultMsg('Nochmal versuchen!')
        setTimeout(() => { setResultMsg(''); playPattern() }, 1000)
      } else {
        setResultMsg('Sehr gut versucht!')
        setPhase('result')
        setTimeout(() => onComplete?.(), 1500)
      }
    }
  }

  function handleSuccess() {
    audio.play('success')
    setResultMsg('Super!')
    setPhase('result')
    setTimeout(() => onComplete?.(), 600)
  }

  function delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
  }

  return (
    <div className="min-h-screen bg-violet-50 flex flex-col items-center justify-center p-4">
      <p className="font-bold text-gray-800 text-lg mb-2 text-center">{config.prompt}</p>

      {phase === 'idle' && (
        <p className="text-gray-500 mb-6 text-center">Tippe auf den Kreis um das Muster abzuspielen</p>
      )}
      {phase === 'playing' && (
        <p className="text-violet-600 font-semibold mb-6 text-center">Schau genau zu...</p>
      )}
      {phase === 'waiting' && (
        <p className="text-violet-600 font-semibold mb-6 text-center">Gleich bist du dran!</p>
      )}
      {phase === 'listening' && (
        <p className="text-green-600 font-semibold mb-6 text-center">
          Tippe den Rhythmus! ({tapTimestamps.current.length}/{config.pattern.length})
        </p>
      )}
      {resultMsg && (
        <p className="text-orange-600 font-bold text-xl mb-6 text-center">{resultMsg}</p>
      )}

      <button
        onClick={handleTap}
        data-testid="rhythm-tap-btn"
        aria-label="Tippen"
        className={`w-48 h-48 rounded-full flex items-center justify-center text-6xl font-bold shadow-2xl transition-all active:scale-95 ${
          isFlashing
            ? 'bg-violet-500 scale-110'
            : phase === 'listening'
            ? 'bg-green-300'
            : 'bg-violet-200'
        }`}
      >
        {phase === 'idle' ? '▶' : '●'}
      </button>

      <p className="mt-4 text-sm text-gray-500">
        Versuch {attempts + 1} von {config.max_attempts}
      </p>
    </div>
  )
}
