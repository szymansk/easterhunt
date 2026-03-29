import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTTS } from './useTTS'

const mockSpeak = vi.fn()
const mockCancel = vi.fn()

const speechSynthesisMock = {
  speak: mockSpeak,
  cancel: mockCancel,
}

class MockSpeechSynthesisUtterance {
  text: string
  lang: string = ''
  constructor(text: string) {
    this.text = text
  }
}

describe('useTTS — speechSynthesis available', () => {
  beforeEach(() => {
    vi.stubGlobal('speechSynthesis', speechSynthesisMock)
    vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance)
    mockSpeak.mockClear()
    mockCancel.mockClear()
  })

  it('isTTSAvailable() returns true when speechSynthesis exists', () => {
    const tts = useTTS()
    expect(tts.isTTSAvailable()).toBe(true)
  })

  it('speak() calls speechSynthesis.speak with de-DE utterance', () => {
    const tts = useTTS()
    tts.speak('Hallo Welt')
    expect(mockSpeak).toHaveBeenCalledTimes(1)
    const utterance = mockSpeak.mock.calls[0][0] as SpeechSynthesisUtterance
    expect(utterance.text).toBe('Hallo Welt')
    expect(utterance.lang).toBe('de-DE')
  })

  it('speak() calls cancel() before speaking (stops previous)', () => {
    const tts = useTTS()
    tts.speak('Erstes')
    tts.speak('Zweites')
    expect(mockCancel).toHaveBeenCalledTimes(2)
    expect(mockSpeak).toHaveBeenCalledTimes(2)
  })

  it('stop() calls speechSynthesis.cancel()', () => {
    const tts = useTTS()
    tts.stop()
    expect(mockCancel).toHaveBeenCalledTimes(1)
  })
})

describe('useTTS — speechSynthesis NOT available', () => {
  beforeEach(() => {
    // Make speechSynthesis unavailable
    vi.stubGlobal('speechSynthesis', undefined)
    vi.stubGlobal('SpeechSynthesisUtterance', undefined)
  })

  it('isTTSAvailable() returns false', () => {
    const tts = useTTS()
    expect(tts.isTTSAvailable()).toBe(false)
  })

  it('speak() does not throw when speechSynthesis is unavailable', () => {
    const tts = useTTS()
    expect(() => tts.speak('Test')).not.toThrow()
  })

  it('stop() does not throw when speechSynthesis is unavailable', () => {
    const tts = useTTS()
    expect(() => tts.stop()).not.toThrow()
  })
})
