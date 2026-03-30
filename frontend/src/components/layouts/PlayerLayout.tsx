import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAudio } from '../../hooks/useAudio'
import { useBackgroundMusic } from '../../hooks/useBackgroundMusic'

export default function PlayerLayout() {
  const audio = useAudio()
  const music = useBackgroundMusic()
  const location = useLocation()
  const navigate = useNavigate()
  const [musicEnabled, setMusicEnabled] = useState(music.isEnabled())

  // Show back button on all player pages except the game list itself
  const showBackButton = location.pathname !== '/play' && location.pathname !== '/play/'

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

  // Pause music during station mini-game, resume on station map
  useEffect(() => {
    const isInStation = location.pathname.includes('/station/')
    if (isInStation) {
      music.pause()
    } else {
      music.resume()
    }
  }, [location.pathname, music])

  function handleMusicToggle() {
    music.toggle()
    setMusicEnabled(music.isEnabled())
  }

  return (
    <div className="min-h-screen bg-yellow-50 select-none" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Back button — fixed top-left, only when inside a game */}
      {showBackButton && (
        <button
          onClick={() => navigate('/')}
          aria-label="Zurück zur Startseite"
          className="fixed z-50 w-11 h-11 flex items-center justify-center rounded-full bg-white bg-opacity-80 shadow text-xl active:scale-95 transition-transform"
          style={{ top: 'calc(0.75rem + env(safe-area-inset-top))', left: 'calc(0.75rem + env(safe-area-inset-left))' }}
        >
          ←
        </button>
      )}

      {/* Music toggle button — fixed top-right, respects safe area */}
      <button
        onClick={handleMusicToggle}
        aria-label={musicEnabled ? 'Musik ausschalten' : 'Musik einschalten'}
        className="fixed z-50 w-11 h-11 flex items-center justify-center rounded-full bg-white bg-opacity-80 shadow text-xl active:scale-95 transition-transform"
        style={{ top: 'calc(0.75rem + env(safe-area-inset-top))', right: 'calc(0.75rem + env(safe-area-inset-right))' }}
        data-testid="music-toggle"
      >
        {musicEnabled ? '🎵' : '🔇'}
      </button>

      <Outlet />
    </div>
  )
}
