import wave
import struct
import math
import os

def write_wav(path, samples, sample_rate=44100):
    """Write a mono 16-bit WAV file."""
    with wave.open(path, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        data = struct.pack(f'<{len(samples)}h', *samples)
        f.writeframes(data)
    size = os.path.getsize(path)
    print(f'{path}: {size} bytes ({size/1024:.1f} KB)')

SR = 44100

def sine(freq, duration, amplitude=0.6, sr=SR):
    n = int(sr * duration)
    return [int(32767 * amplitude * math.sin(2 * math.pi * freq * i / sr)) for i in range(n)]

def fade(samples, fade_in=0.02, fade_out=0.05, sr=SR):
    fi = int(sr * fade_in)
    fo = int(sr * fade_out)
    n = len(samples)
    out = list(samples)
    for i in range(min(fi, n)):
        out[i] = int(out[i] * i / fi)
    for i in range(min(fo, n)):
        out[n - 1 - i] = int(out[n - 1 - i] * i / fo)
    return out

outdir = '/Users/szymanski/Projects/easter/frontend/public/audio'
os.makedirs(outdir, exist_ok=True)

# success: ascending arpeggio C5-E5-G5 (major triad)
success = []
for freq, dur in [(523, 0.08), (659, 0.08), (784, 0.12)]:
    success += fade(sine(freq, dur))
write_wav(f'{outdir}/success.mp3', success)

# error: short descending dissonant buzz
error = []
for freq, dur in [(311, 0.08), (277, 0.10)]:
    error += fade(sine(freq, dur))
write_wav(f'{outdir}/error.mp3', error)

# snap: short click - high freq transient
snap = fade(sine(880, 0.06, amplitude=0.5))
write_wav(f'{outdir}/snap.mp3', snap)

# celebration: 4-note ascending fanfare
celebration = []
for freq, dur in [(523, 0.07), (659, 0.07), (784, 0.07), (1047, 0.20)]:
    celebration += fade(sine(freq, dur))
write_wav(f'{outdir}/celebration.mp3', celebration)

# button_tap: soft click
button_tap = fade(sine(660, 0.04, amplitude=0.4))
write_wav(f'{outdir}/button_tap.mp3', button_tap)

print('Done.')
