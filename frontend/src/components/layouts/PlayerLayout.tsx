import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAudio } from '../../hooks/useAudio'
import { useBackgroundMusic } from '../../hooks/useBackgroundMusic'

export default function PlayerLayout() {
  const audio = useAudio()
  const music = useBackgroundMusic()
  const location = useLocation()
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
    <div className="min-h-screen bg-yellow-50">
      {/* Music toggle button — fixed top-right */}
      <button
        onClick={handleMusicToggle}
        aria-label={musicEnabled ? 'Musik ausschalten' : 'Musik einschalten'}
        className="fixed top-3 right-3 z-50 w-11 h-11 flex items-center justify-center rounded-full bg-white bg-opacity-80 shadow text-xl active:scale-95 transition-transform"
        data-testid="music-toggle"
      >
        {musicEnabled ? '🎵' : '🔇'}
      </button>

      <Outlet />
    </div>
  )
}
