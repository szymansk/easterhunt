/**
 * Generates minimal WAV audio files for the Easter app sound effects.
 * Run with: node scripts/generate_audio.mjs
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../public/audio')
mkdirSync(outDir, { recursive: true })

const SR = 44100

function sine(freq, duration, amplitude = 0.6) {
  const n = Math.floor(SR * duration)
  return Array.from({ length: n }, (_, i) =>
    Math.round(32767 * amplitude * Math.sin(2 * Math.PI * freq * i / SR))
  )
}

function fade(samples, fadeInSec = 0.02, fadeOutSec = 0.05) {
  const fi = Math.floor(SR * fadeInSec)
  const fo = Math.floor(SR * fadeOutSec)
  const n = samples.length
  const out = [...samples]
  for (let i = 0; i < Math.min(fi, n); i++) out[i] = Math.round(out[i] * i / fi)
  for (let i = 0; i < Math.min(fo, n); i++) out[n - 1 - i] = Math.round(out[n - 1 - i] * i / fo)
  return out
}

function writeWav(path, samples) {
  const numSamples = samples.length
  const dataSize = numSamples * 2 // 16-bit
  const buf = Buffer.alloc(44 + dataSize)

  // RIFF chunk
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)

  // fmt chunk
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)      // chunk size
  buf.writeUInt16LE(1, 20)       // PCM
  buf.writeUInt16LE(1, 22)       // mono
  buf.writeUInt32LE(SR, 24)      // sample rate
  buf.writeUInt32LE(SR * 2, 28)  // byte rate
  buf.writeUInt16LE(2, 32)       // block align
  buf.writeUInt16LE(16, 34)      // bits per sample

  // data chunk
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)
  for (let i = 0; i < numSamples; i++) {
    buf.writeInt16LE(samples[i], 44 + i * 2)
  }

  writeFileSync(path, buf)
  console.log(`${path}: ${buf.length} bytes (${(buf.length / 1024).toFixed(1)} KB)`)
}

// success: ascending arpeggio C5-E5-G5
const success = [
  ...fade(sine(523, 0.08)),
  ...fade(sine(659, 0.08)),
  ...fade(sine(784, 0.12)),
]
writeWav(join(outDir, 'success.mp3'), success)

// error: short descending dissonant buzz
const error = [
  ...fade(sine(311, 0.08)),
  ...fade(sine(277, 0.10)),
]
writeWav(join(outDir, 'error.mp3'), error)

// snap: short high-freq click
const snap = fade(sine(880, 0.06, 0.5))
writeWav(join(outDir, 'snap.mp3'), snap)

// celebration: 4-note ascending fanfare
const celebration = [
  ...fade(sine(523, 0.07)),
  ...fade(sine(659, 0.07)),
  ...fade(sine(784, 0.07)),
  ...fade(sine(1047, 0.20)),
]
writeWav(join(outDir, 'celebration.mp3'), celebration)

// button_tap: soft click
const button_tap = fade(sine(660, 0.04, 0.4))
writeWav(join(outDir, 'button_tap.mp3'), button_tap)

console.log('Audio generation complete.')
