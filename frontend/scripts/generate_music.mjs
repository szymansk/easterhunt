/**
 * Generates a short looping background music track.
 * Simple pentatonic arpeggio melody, 8 seconds, 44100Hz mono 16-bit WAV.
 * Run with: node scripts/generate_music.mjs
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../public/audio')
mkdirSync(outDir, { recursive: true })

const SR = 44100
const AMP = 0.25 // Keep quiet to not overwhelm game sounds

function sineWave(freq, duration, amplitude = AMP, phase = 0) {
  const n = Math.floor(SR * duration)
  return Array.from({ length: n }, (_, i) =>
    Math.round(32767 * amplitude * Math.sin(2 * Math.PI * freq * i / SR + phase))
  )
}

function addSamples(a, b) {
  return a.map((v, i) => Math.max(-32767, Math.min(32767, v + (b[i] ?? 0))))
}

function fadeIn(samples, fadeSec) {
  const fi = Math.floor(SR * fadeSec)
  return samples.map((v, i) => i < fi ? Math.round(v * i / fi) : v)
}

function fadeOut(samples, fadeSec) {
  const n = samples.length
  const fo = Math.floor(SR * fadeSec)
  return samples.map((v, i) => {
    const distFromEnd = n - 1 - i
    return distFromEnd < fo ? Math.round(v * distFromEnd / fo) : v
  })
}

// Pentatonic scale notes (C major pentatonic: C4, D4, E4, G4, A4, C5)
const NOTES = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]

// Simple pattern: arpeggiate up and back
const PATTERN = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0, 2, 4, 2, 0, 1]
const NOTE_DUR = 0.25 // quarter note at 240 BPM

const totalSamples = Math.floor(SR * PATTERN.length * NOTE_DUR)
let melody = new Array(totalSamples).fill(0)

let offset = 0
for (const noteIdx of PATTERN) {
  const freq = NOTES[noteIdx]
  const dur = NOTE_DUR * 0.85 // slight gap between notes
  const noteSamples = sineWave(freq, dur)
  // Apply fade to each note
  const faded = fadeOut(fadeIn(noteSamples, 0.01), 0.03)
  for (let i = 0; i < faded.length; i++) {
    if (offset + i < totalSamples) melody[offset + i] += faded[i]
  }
  offset += Math.floor(SR * NOTE_DUR)
}

// Add a subtle low bass note (C2) throughout
const bassFreq = 65.41
const bassSamples = sineWave(bassFreq, PATTERN.length * NOTE_DUR, 0.08)
melody = addSamples(melody, bassSamples)

// Apply overall fade in/out for seamless looping
melody = fadeIn(melody, 0.1)
melody = fadeOut(melody, 0.3)

function writeWav(path, samples) {
  const numSamples = samples.length
  const dataSize = numSamples * 2
  const buf = Buffer.alloc(44 + dataSize)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)
  for (let i = 0; i < numSamples; i++) {
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(samples[i]))), 44 + i * 2)
  }
  writeFileSync(path, buf)
  console.log(`${path}: ${buf.length} bytes (${(buf.length / 1024).toFixed(1)} KB)`)
}

writeWav(join(outDir, 'background_music.mp3'), melody)
console.log('Background music generation complete.')
