import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAudio, _resetAudioState, _audioState } from './useAudio'
import type { SoundName } from './useAudio'

// Mock HTMLAudioElement
const mockPlay = vi.fn().mockResolvedValue(undefined)
const mockPause = vi.fn()

class MockAudio {
  src: string
  preload: string = 'auto'
  currentTime: number = 0
  volume: number = 1

  constructor(src: string) {
    this.src = src
  }

  play = mockPlay
  pause = mockPause
}

// Replace global Audio before tests
vi.stubGlobal('Audio', MockAudio)

describe('useAudio', () => {
  beforeEach(() => {
    _resetAudioState()
    mockPlay.mockClear()
    mockPause.mockClear()
    mockPlay.mockResolvedValue(undefined)
  })

  it('returns stable control functions', () => {
    const audio = useAudio()
    expect(typeof audio.unlock).toBe('function')
    expect(typeof audio.play).toBe('function')
    expect(typeof audio.stop).toBe('function')
    expect(typeof audio.setVolume).toBe('function')
    expect(typeof audio.isUnlocked).toBe('function')
  })

  it('is locked initially', () => {
    const audio = useAudio()
    expect(audio.isUnlocked()).toBe(false)
  })

  it('play() before unlock does not call audio.play', () => {
    const audio = useAudio()
    audio.play('success')
    expect(mockPlay).not.toHaveBeenCalled()
  })

  it('unlock() sets unlocked state', () => {
    const audio = useAudio()
    audio.unlock()
    expect(audio.isUnlocked()).toBe(true)
  })

  it('play() after unlock calls audio.play', () => {
    const audio = useAudio()
    audio.unlock()
    audio.play('success')
    expect(mockPlay).toHaveBeenCalledTimes(1)
  })

  it('play() with unknown sound name does not throw', () => {
    const audio = useAudio()
    audio.unlock()
    // Force an unknown name via type cast
    expect(() => audio.play('unknown' as SoundName)).not.toThrow()
  })

  it('play() when audio.play() rejects does not throw', async () => {
    mockPlay.mockRejectedValueOnce(new DOMException('NotAllowedError'))
    const audio = useAudio()
    audio.unlock()
    expect(() => audio.play('error')).not.toThrow()
  })

  it('stop() resets currentTime and pauses', () => {
    const audio = useAudio()
    audio.unlock()
    // Preload creates sound objects
    audio.play('snap')
    const snapEl = _audioState.sounds['snap'] as unknown as MockAudio & { currentTime: number }
    snapEl.currentTime = 0.5
    audio.stop('snap')
    expect(mockPause).toHaveBeenCalledTimes(1)
    expect(snapEl.currentTime).toBe(0)
  })

  it('setVolume() clamps to 0–1 and applies to all sounds', () => {
    const audio = useAudio()
    audio.unlock()
    audio.play('success')
    audio.play('error')
    audio.setVolume(0.5)
    const successEl = _audioState.sounds['success'] as unknown as MockAudio
    const errorEl = _audioState.sounds['error'] as unknown as MockAudio
    expect(successEl.volume).toBe(0.5)
    expect(errorEl.volume).toBe(0.5)
  })

  it('setVolume() clamps values below 0 to 0', () => {
    const audio = useAudio()
    audio.unlock()
    audio.play('success')
    audio.setVolume(-0.5)
    const el = _audioState.sounds['success'] as unknown as MockAudio
    expect(el.volume).toBe(0)
  })

  it('setVolume() clamps values above 1 to 1', () => {
    const audio = useAudio()
    audio.unlock()
    audio.play('success')
    audio.setVolume(2)
    const el = _audioState.sounds['success'] as unknown as MockAudio
    expect(el.volume).toBe(1)
  })

  it('multiple hook instances share the same unlocked state', () => {
    const a1 = useAudio()
    const a2 = useAudio()
    a1.unlock()
    expect(a2.isUnlocked()).toBe(true)
  })
})
