import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAudio } from '../../hooks/useAudio'
import { useBackgroundMusic } from '../../hooks/useBackgroundMusic'

export default function PlayerLayout() {
  const audio = useAudio()
  const music = useBackgroundMusic()
  const navigate = useNavigate()
  const [musicEnabled, setMusicEnabled] = useState(music.isEnabled())

  // Unlock audio on the first user interaction in player mode
  useEffect(() => {
    function handleInteraction() {
      audio.unlock()
      music.unlock()
    }
    document.addEventListener('click', handleInteraction, { once: true })
    document.addEventListener('touchstart', handleInteraction, { once: true })
    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
    }
  }, [audio, music])

  // Pause music when leaving the player area
  useEffect(() => {
    return () => { music.pause() }
  }, [music])

  function handleMusicToggle() {
    music.toggle()
    setMusicEnabled(music.isEnabled())
  }

  return (
    <div className="min-h-screen bg-yellow-50 select-none" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Back button — fixed top-left, always visible in player area */}
      <button
        onClick={() => navigate('/')}
        aria-label="Zurück zur Startseite"
        className="fixed z-50 w-11 h-11 flex items-center justify-center rounded-full bg-white bg-opacity-80 shadow text-xl active:scale-95 transition-transform"
        style={{ top: 'calc(0.75rem + env(safe-area-inset-top))', left: 'calc(0.75rem + env(safe-area-inset-left))' }}
      >
        ←
      </button>

      {/* Music toggle button — fixed bottom-right, avoids overlap with TTS buttons */}
      <button
        onClick={handleMusicToggle}
        aria-label={musicEnabled ? 'Musik ausschalten' : 'Musik einschalten'}
        className="fixed z-50 w-11 h-11 flex items-center justify-center rounded-full bg-white bg-opacity-80 shadow text-xl active:scale-95 transition-transform"
        style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))', right: 'calc(0.75rem + env(safe-area-inset-right))' }}
        data-testid="music-toggle"
      >
        {musicEnabled ? '🎵' : '🔇'}
      </button>

      <Outlet />
    </div>
  )
}
