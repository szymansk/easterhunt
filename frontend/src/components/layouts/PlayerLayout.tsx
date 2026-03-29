import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAudio } from '../../hooks/useAudio'

export default function PlayerLayout() {
  const audio = useAudio()

  // Unlock audio on the first user interaction in player mode
  useEffect(() => {
    function handleInteraction() {
      audio.unlock()
    }
    document.addEventListener('click', handleInteraction, { once: true })
    document.addEventListener('touchstart', handleInteraction, { once: true })
    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
    }
  }, [audio])

  return (
    <div className="min-h-screen bg-yellow-50">
      <Outlet />
    </div>
  )
}
