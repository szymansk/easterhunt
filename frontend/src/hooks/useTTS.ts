/**
 * useTTS — Text-to-Speech hook using Web Speech API (speechSynthesis).
 *
 * - Uses de-DE locale
 * - Stops current utterance before starting new one
 * - Graceful degradation: unavailable → isTTSAvailable() returns false, no errors
 * - [FR-014, TR-010]
 */

function isSpeechAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.speechSynthesis &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  )
}

export interface UseTTSResult {
  /** Whether speechSynthesis is available in this browser */
  isTTSAvailable: () => boolean
  /** Speak text in German (de-DE). Stops any current utterance first. */
  speak: (text: string) => void
  /** Stop any current utterance */
  stop: () => void
}

export function useTTS(): UseTTSResult {
  return {
    isTTSAvailable: isSpeechAvailable,
    speak: (text: string) => {
      if (!isSpeechAvailable()) return
      try {
        window.speechSynthesis.cancel() // stop any previous utterance
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'de-DE'
        window.speechSynthesis.speak(utterance)
      } catch {
        // Swallow silently — TTS is optional
      }
    },
    stop: () => {
      if (!isSpeechAvailable()) return
      try {
        window.speechSynthesis.cancel()
      } catch {
        // Swallow silently
      }
    },
  }
}
