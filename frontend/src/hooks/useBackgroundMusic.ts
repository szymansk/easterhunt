/**
 * useBackgroundMusic — optional looping background music with localStorage persistence.
 *
 * - Music starts only after unlock() is called (browser autoplay policy, TR-010)
 * - Toggle preference persisted in localStorage
 * - pause()/resume() allow caller to stop during station transitions
 */

const MUSIC_ENABLED_KEY = 'easter_music_enabled'
const MUSIC_SRC = '/audio/background_music.mp3'

interface MusicState {
  audio: HTMLAudioElement | null
  unlocked: boolean
  enabled: boolean
  paused: boolean
}

const musicState: MusicState = {
  audio: null,
  unlocked: false,
  enabled: loadMusicEnabled(),
  paused: false,
}

function loadMusicEnabled(): boolean {
  try {
    const stored = localStorage.getItem(MUSIC_ENABLED_KEY)
    return stored === null ? true : stored === 'true'
  } catch {
    return true
  }
}

function saveMusicEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(MUSIC_ENABLED_KEY, String(enabled))
  } catch {
    // Swallow silently
  }
}

function ensureAudio(): HTMLAudioElement | null {
  if (musicState.audio) return musicState.audio
  try {
    const audio = new Audio(MUSIC_SRC)
    audio.loop = true
    audio.volume = 0.4
    musicState.audio = audio
    return audio
  } catch {
    return null
  }
}

function startMusic(): void {
  if (!musicState.unlocked || !musicState.enabled || musicState.paused) return
  const audio = ensureAudio()
  if (!audio) return
  try {
    audio.play().catch(() => {})
  } catch {
    // Swallow silently
  }
}

function stopMusic(): void {
  const audio = musicState.audio
  if (!audio) return
  try {
    audio.pause()
  } catch {
    // Swallow silently
  }
}

export interface UseBackgroundMusicResult {
  /** Whether music is currently enabled */
  isEnabled: () => boolean
  /** Toggle music on/off, persists to localStorage */
  toggle: () => void
  /** Unlock audio context after user interaction, then start music if enabled */
  unlock: () => void
  /** Pause music (e.g. during station mini-game) */
  pause: () => void
  /** Resume music if enabled (e.g. back on station map) */
  resume: () => void
}

export function useBackgroundMusic(): UseBackgroundMusicResult {
  return {
    isEnabled: () => musicState.enabled,
    toggle: () => {
      musicState.enabled = !musicState.enabled
      saveMusicEnabled(musicState.enabled)
      if (musicState.enabled) {
        startMusic()
      } else {
        stopMusic()
      }
    },
    unlock: () => {
      if (musicState.unlocked) return
      musicState.unlocked = true
      startMusic()
    },
    pause: () => {
      musicState.paused = true
      stopMusic()
    },
    resume: () => {
      musicState.paused = false
      startMusic()
    },
  }
}

// Exported for testing
export const _musicState = musicState
export const _resetMusicState = () => {
  if (musicState.audio) {
    try { musicState.audio.pause() } catch {}
  }
  musicState.audio = null
  musicState.unlocked = false
  musicState.enabled = true
  musicState.paused = false
}
