import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useBackgroundMusic, _musicState, _resetMusicState } from './useBackgroundMusic'

const mockPlay = vi.fn().mockResolvedValue(undefined)
const mockPause = vi.fn()

class MockAudio {
  src: string
  loop: boolean = false
  volume: number = 1

  constructor(src: string) {
    this.src = src
  }

  play = mockPlay
  pause = mockPause
}

vi.stubGlobal('Audio', MockAudio)

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
vi.stubGlobal('localStorage', localStorageMock)

describe('useBackgroundMusic', () => {
  beforeEach(() => {
    _resetMusicState()
    localStorageMock.clear()
    mockPlay.mockClear()
    mockPause.mockClear()
    mockPlay.mockResolvedValue(undefined)
  })

  it('returns stable control functions', () => {
    const m = useBackgroundMusic()
    expect(typeof m.isEnabled).toBe('function')
    expect(typeof m.toggle).toBe('function')
    expect(typeof m.unlock).toBe('function')
    expect(typeof m.pause).toBe('function')
    expect(typeof m.resume).toBe('function')
  })

  it('is enabled by default', () => {
    const m = useBackgroundMusic()
    expect(m.isEnabled()).toBe(true)
  })

  it('unlock() starts music when enabled', () => {
    const m = useBackgroundMusic()
    m.unlock()
    expect(mockPlay).toHaveBeenCalledTimes(1)
  })

  it('unlock() is idempotent', () => {
    const m = useBackgroundMusic()
    m.unlock()
    m.unlock()
    expect(mockPlay).toHaveBeenCalledTimes(1)
  })

  it('music does not start before unlock()', () => {
    useBackgroundMusic()
    expect(mockPlay).not.toHaveBeenCalled()
  })

  it('toggle() disables music and calls pause', () => {
    const m = useBackgroundMusic()
    m.unlock()
    mockPlay.mockClear()
    m.toggle()
    expect(m.isEnabled()).toBe(false)
    expect(mockPause).toHaveBeenCalledTimes(1)
  })

  it('toggle() re-enables music and calls play', () => {
    const m = useBackgroundMusic()
    m.unlock()
    m.toggle() // disable
    mockPlay.mockClear()
    m.toggle() // re-enable
    expect(m.isEnabled()).toBe(true)
    expect(mockPlay).toHaveBeenCalledTimes(1)
  })

  it('toggle() persists to localStorage', () => {
    const m = useBackgroundMusic()
    m.toggle() // disable
    expect(localStorageMock.getItem('easter_music_enabled')).toBe('false')
    m.toggle() // re-enable
    expect(localStorageMock.getItem('easter_music_enabled')).toBe('true')
  })

  it('pause() stops music', () => {
    const m = useBackgroundMusic()
    m.unlock()
    mockPause.mockClear()
    m.pause()
    expect(mockPause).toHaveBeenCalledTimes(1)
  })

  it('resume() after pause starts music again', () => {
    const m = useBackgroundMusic()
    m.unlock()
    m.pause()
    mockPlay.mockClear()
    m.resume()
    expect(mockPlay).toHaveBeenCalledTimes(1)
  })

  it('resume() when disabled does not start music', () => {
    const music = useBackgroundMusic()
    music.unlock()
    music.toggle() // disable
    music.pause()
    mockPlay.mockClear()
    music.resume()
    expect(mockPlay).not.toHaveBeenCalled()
  })

  it('play() rejection does not throw', () => {
    mockPlay.mockRejectedValueOnce(new DOMException('NotAllowedError'))
    const m = useBackgroundMusic()
    expect(() => m.unlock()).not.toThrow()
  })

  it('music loops (loop property is true)', () => {
    const m = useBackgroundMusic()
    m.unlock()
    const audio = _musicState.audio as unknown as MockAudio
    expect(audio.loop).toBe(true)
  })
})
