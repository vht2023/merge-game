const fs = require('fs');
const path = require('path');

function createWavBuffer(sampleRate, durationSec, sampleFn) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const blockAlign = 2; // 16-bit mono
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1size = 16 for PCM
  buffer.writeUInt16LE(1, 20);  // audioFormat = 1 (PCM)
  buffer.writeUInt16LE(1, 22);  // numChannels = 1 (mono)
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // bitsPerSample = 16

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.max(-1, Math.min(1, sampleFn(t, durationSec)));
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

const SAMPLE_RATE = 22050;

// 1. Pop SFX (0.08s)
const popBuffer = createWavBuffer(SAMPLE_RATE, 0.08, (t, dur) => {
  const env = Math.exp(-t * 40);
  const freq = 650 - t * 3500;
  return Math.sin(2 * Math.PI * freq * t) * env;
});

// 2. Merge SFX (0.35s pleasant chord)
const mergeBuffer = createWavBuffer(SAMPLE_RATE, 0.35, (t, dur) => {
  const env = Math.exp(-t * 8);
  const s1 = Math.sin(2 * Math.PI * 523.25 * t); // C5
  const s2 = Math.sin(2 * Math.PI * 659.25 * t); // E5
  const s3 = Math.sin(2 * Math.PI * 783.99 * t); // G5
  const s4 = Math.sin(2 * Math.PI * 1046.50 * t); // C6
  return ((s1 + s2 + s3 + s4) / 4) * env;
});

// 3. Coin SFX (0.2s double chime)
const coinBuffer = createWavBuffer(SAMPLE_RATE, 0.22, (t, dur) => {
  if (t < 0.1) {
    const env = Math.exp(-t * 20);
    return Math.sin(2 * Math.PI * 987.77 * t) * env; // B5
  } else {
    const t2 = t - 0.1;
    const env = Math.exp(-t2 * 18);
    return Math.sin(2 * Math.PI * 1318.51 * t2) * env; // E6
  }
});

// 4. Level Up SFX (0.6s fanfare)
const levelUpBuffer = createWavBuffer(SAMPLE_RATE, 0.6, (t, dur) => {
  const step = Math.floor(t / 0.12);
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  const freq = notes[Math.min(step, notes.length - 1)];
  const tInStep = t - step * 0.12;
  const env = Math.exp(-tInStep * 10) * (1 - t / dur);
  return Math.sin(2 * Math.PI * freq * t) * env;
});

// 5. BGM Lofi Loop (4 seconds soothing repeating ambient chord melody)
const bgmBuffer = createWavBuffer(SAMPLE_RATE, 4.0, (t, dur) => {
  const chordNotes = [
    [261.63, 329.63, 392.00], // C
    [220.00, 261.63, 329.63], // Am
    [349.23, 440.00, 523.25], // F
    [392.00, 493.88, 587.33], // G
  ];
  const bar = Math.floor(t / 1.0);
  const currentChord = chordNotes[bar % 4];
  const tInBar = t % 1.0;
  const env = (Math.sin(Math.PI * (t / dur))) * 0.35;
  const c1 = Math.sin(2 * Math.PI * currentChord[0] * t);
  const c2 = Math.sin(2 * Math.PI * currentChord[1] * t);
  const c3 = Math.sin(2 * Math.PI * currentChord[2] * t);
  return ((c1 + c2 + c3) / 3) * env;
});

const outDir = path.join(__dirname, '../assets/sounds');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'pop.wav'), popBuffer);
fs.writeFileSync(path.join(outDir, 'merge.wav'), mergeBuffer);
fs.writeFileSync(path.join(outDir, 'coin.wav'), coinBuffer);
fs.writeFileSync(path.join(outDir, 'levelup.wav'), levelUpBuffer);
fs.writeFileSync(path.join(outDir, 'bgm_lofi.wav'), bgmBuffer);

console.log('Successfully generated all game sound effects in assets/sounds!');
