/**
 * useAudio hook — Audio Manager Service
 *
 * Respects browser autoplay policy (TR-010): audio context is unlocked only
 * after a user interaction (click/touch). Plays sounds silently on failure.
 */

export type SoundName = 'success' | 'error' | 'snap' | 'celebration' | 'button_tap'

interface AudioState {
  unlocked: boolean
  sounds: Partial<Record<SoundName, HTMLAudioElement>>
}

// Module-level singleton so the same audio state is shared across hook calls
const audioState: AudioState = {
  unlocked: false,
  sounds: {},
}

const SOUND_PATHS: Record<SoundName, string> = {
  success: '/audio/success.mp3',
  error: '/audio/error.mp3',
  snap: '/audio/snap.mp3',
  celebration: '/audio/celebration.mp3',
  button_tap: '/audio/button_tap.mp3',
}

function preloadSounds(): void {
  for (const [name, path] of Object.entries(SOUND_PATHS) as [SoundName, string][]) {
    if (!audioState.sounds[name]) {
      try {
        const audio = new Audio(path)
        audio.preload = 'auto'
        audioState.sounds[name] = audio
      } catch {
        // Audio creation failed — will be silently skipped on play
      }
    }
  }
}

function unlockAudio(): void {
  if (audioState.unlocked) return
  audioState.unlocked = true
  preloadSounds()
}

function playSound(name: SoundName): void {
  if (!audioState.unlocked) return

  const audio = audioState.sounds[name]
  if (!audio) return

  try {
    // Rewind to allow rapid replays
    audio.currentTime = 0
    audio.play().catch(() => {
      // DOMException or NotAllowedError — swallow silently
    })
  } catch {
    // Synchronous errors — swallow silently
  }
}

function stopSound(name: SoundName): void {
  const audio = audioState.sounds[name]
  if (!audio) return
  try {
    audio.pause()
    audio.currentTime = 0
  } catch {
    // Swallow silently
  }
}

function setVolume(volume: number): void {
  const clamped = Math.max(0, Math.min(1, volume))
  for (const audio of Object.values(audioState.sounds)) {
    if (audio) {
      try {
        audio.volume = clamped
      } catch {
        // Swallow silently
      }
    }
  }
}

export interface UseAudioResult {
  /** Call once on any user interaction to unlock the audio context */
  unlock: () => void
  /** Play a named sound. No-op if audio is locked or unavailable. */
  play: (name: SoundName) => void
  /** Stop a named sound. */
  stop: (name: SoundName) => void
  /** Set volume for all sounds (0–1). */
  setVolume: (volume: number) => void
  /** Whether audio has been unlocked by a user interaction. */
  isUnlocked: () => boolean
}

/**
 * useAudio — returns stable audio control functions.
 *
 * The same singleton is returned on every call, so this hook is safe to use
 * in multiple components without duplicate state.
 */
export function useAudio(): UseAudioResult {
  return {
    unlock: unlockAudio,
    play: playSound,
    stop: stopSound,
    setVolume,
    isUnlocked: () => audioState.unlocked,
  }
}

// Exported for testing purposes only
export const _audioState = audioState
export const _resetAudioState = () => {
  audioState.unlocked = false
  audioState.sounds = {}
}
