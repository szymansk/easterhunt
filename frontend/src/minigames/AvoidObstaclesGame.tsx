import { useState, useEffect, useRef, useCallback } from 'react'
import type { AvoidObstaclesConfig } from '../types'
import { useAudio } from '../hooks/useAudio'

interface AvoidObstaclesGameProps {
  config: AvoidObstaclesConfig
  onComplete?: () => void
}

const CANVAS_WIDTH = 360
const CANVAS_HEIGHT = 300
const CHAR_SIZE = 40
const OBS_SIZE = 40
const JUMP_HEIGHT = 80
const JUMP_DURATION = 400
const GROUND_Y = CANVAS_HEIGHT - CHAR_SIZE - 10
const SPEED_MAP = { 1: 3, 2: 5, 3: 7 }

interface Obstacle {
  id: number
  x: number
}

export default function AvoidObstaclesGame({ config, onComplete }: AvoidObstaclesGameProps) {
  const [charY, setCharY] = useState(GROUND_Y)
  const [lives, setLives] = useState(config.lives)
  const [distance, setDistance] = useState(0)
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const isJumping = useRef(false)
  const invincible = useRef(false)
  const obstacleIdRef = useRef(0)
  const livesRef = useRef(config.lives)
  const distanceRef = useRef(0)
  const wonRef = useRef(false)
  const audio = useAudio()
  const speed = SPEED_MAP[config.obstacle_speed]

  const handleJump = useCallback(() => {
    if (isJumping.current) return
    isJumping.current = true
    setCharY(GROUND_Y - JUMP_HEIGHT)
    setTimeout(() => {
      setCharY(GROUND_Y)
      setTimeout(() => { isJumping.current = false }, 50)
    }, JUMP_DURATION)
  }, [])

  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (wonRef.current) return
      obstacleIdRef.current++
      setObstacles((prev) => [...prev, { id: obstacleIdRef.current, x: CANVAS_WIDTH }])
    }, 1800)

    let frameId: number
    let lastTime = performance.now()

    function frame(now: number) {
      const dt = now - lastTime
      lastTime = now

      distanceRef.current += dt * 0.05
      setDistance(Math.floor(distanceRef.current))

      if (distanceRef.current >= config.target_distance && !wonRef.current) {
        wonRef.current = true
        audio.play('success')
        setWon(true)
        setTimeout(() => onComplete?.(), 600)
        return
      }

      setObstacles((prev) =>
        prev
          .map((obs) => ({ ...obs, x: obs.x - speed }))
          .filter((obs) => obs.x > -OBS_SIZE)
      )

      frameId = requestAnimationFrame(frame)
    }

    frameId = requestAnimationFrame(frame)

    return () => {
      clearInterval(spawnInterval)
      cancelAnimationFrame(frameId)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Collision detection
  useEffect(() => {
    if (invincible.current || wonRef.current) return
    const charLeft = 30
    const charTop = charY
    const charRight = charLeft + CHAR_SIZE * 0.8
    const charBottom = charTop + CHAR_SIZE

    for (const obs of obstacles) {
      const obsLeft = obs.x + OBS_SIZE * 0.1
      const obsRight = obs.x + OBS_SIZE * 0.9
      const obsTop = GROUND_Y
      const obsBottom = GROUND_Y + OBS_SIZE

      if (charRight > obsLeft && charLeft < obsRight && charBottom > obsTop && charTop < obsBottom) {
        invincible.current = true
        audio.play('error')
        const newLives = livesRef.current - 1
        livesRef.current = newLives
        setLives(newLives)
        if (newLives <= 0) {
          setGameOver(true)
        }
        setTimeout(() => { invincible.current = false }, 1500)
        break
      }
    }
  }, [obstacles, charY]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleRestart() {
    livesRef.current = config.lives
    distanceRef.current = 0
    wonRef.current = false
    setLives(config.lives)
    setDistance(0)
    setObstacles([])
    setGameOver(false)
    setWon(false)
  }

  if (gameOver && !won) {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-4">
        <p className="text-2xl font-bold text-gray-800 mb-2">Strecke: {distance}</p>
        <p className="text-gray-600 mb-6">Ziel: {config.target_distance}</p>
        <button
          onClick={handleRestart}
          data-testid="obstacle-restart-btn"
          className="px-8 py-4 bg-orange-400 text-white text-xl font-bold rounded-2xl active:scale-95 shadow"
        >
          Nochmal?
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sky-100 flex flex-col items-center p-4">
      <div className="flex justify-between w-full max-w-sm mb-3">
        <p className="font-bold text-gray-700" data-testid="distance-display">
          Strecke: {distance} / {config.target_distance}
        </p>
        <p className="font-bold text-gray-700" data-testid="lives-display">
          {'❤️'.repeat(lives)}
        </p>
      </div>

      <div
        className="relative bg-gradient-to-b from-sky-300 to-green-300 rounded-xl overflow-hidden shadow-lg cursor-pointer"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        onClick={handleJump}
        data-testid="game-canvas"
      >
        {/* Ground */}
        <div
          className="absolute bg-green-600 w-full"
          style={{ bottom: 0, height: 10 }}
        />

        {/* Character */}
        <div
          className="absolute text-4xl transition-none"
          data-testid="character"
          style={{ left: 30, top: charY, width: CHAR_SIZE, height: CHAR_SIZE, lineHeight: 1 }}
        >
          {config.character_emoji}
        </div>

        {/* Obstacles */}
        {obstacles.map((obs) => (
          <div
            key={obs.id}
            data-testid={`obstacle-${obs.id}`}
            className="absolute text-4xl"
            style={{ left: obs.x, top: GROUND_Y, width: OBS_SIZE, height: OBS_SIZE, lineHeight: 1 }}
          >
            {config.obstacle_emoji}
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm text-gray-600">Tippe um zu springen!</p>
    </div>
  )
}
