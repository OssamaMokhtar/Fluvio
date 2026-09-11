/**
 * Waveform extraction and comparison utilities.
 *
 * Used by ComparisonPlayer to render dual waveform overlay
 * (user audio vs native TTS) and detect divergence regions.
 */

import { getAudioBuffer } from './audioUtils';

/**
 * Extract amplitude envelope from an AudioBuffer.
 * Returns normalized values in [0, 1] at `numPoints` evenly spaced positions.
 */
export function getWaveformData(audioBuffer: AudioBuffer, numPoints = 300): number[] {
  const channel = audioBuffer.getChannelData(0);
  const len = channel.length;
  const blockSize = Math.max(1, Math.floor(len / numPoints));
  const result: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    const start = i * blockSize;
    let max = 0;
    const end = Math.min(start + blockSize, len);
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channel[j]);
      if (abs > max) max = abs;
    }
    result.push(max);
  }

  // Normalize to [0, 1]
  const globalMax = Math.max(...result, 0.001);
  return result.map(v => v / globalMax);
}

/**
 * Decode a base64 TTS string to an AudioBuffer.
 * Assumes 24kHz mono 16-bit PCM (OpenAI TTS / Gemini TTS output).
 */
export async function decodeBase64ToAudioBuffer(base64: string, sampleRate = 24000): Promise<AudioBuffer> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioContextClass({ sampleRate });

  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);

    const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  } finally {
    ctx.close();
  }
}

/**
 * Compare two waveform arrays (user vs native) and return divergence regions.
 * Returns array of { start, end, severity } where severity is 0–1.
 *
 * A region is "divergent" when the local amplitude correlation between
 * user and native waveforms drops below the threshold over a minimum span.
 */
export function compareWaveforms(
  user: number[],
  native: number[],
  windowSize = 20,
  threshold = 0.4,
  minSpan = 3,
): { start: number; end: number; severity: number }[] {
  // Ensure same length by truncating to the shorter one
  const len = Math.min(user.length, native.length);
  const regions: { start: number; end: number; severity: number }[] = [];
  let inRegion = false;
  let regionStart = 0;
  let regionMaxSeverity = 0;

  for (let i = 0; i <= len - windowSize; i++) {
    let sumDiff = 0;
    for (let j = 0; j < windowSize; j++) {
      sumDiff += Math.abs(user[i + j] - native[i + j]);
    }
    const avgDiff = sumDiff / windowSize;
    const severity = Math.min(1, avgDiff);

    if (severity > threshold) {
      if (!inRegion) {
        inRegion = true;
        regionStart = i;
        regionMaxSeverity = severity;
      } else if (severity > regionMaxSeverity) {
        regionMaxSeverity = severity;
      }
    } else if (inRegion) {
      const span = i - regionStart;
      if (span >= minSpan) {
        regions.push({ start: regionStart, end: i, severity: regionMaxSeverity });
      }
      inRegion = false;
    }
  }

  // Close any open region at the end
  if (inRegion && (len - regionStart) >= minSpan) {
    regions.push({ start: regionStart, end: len, severity: regionMaxSeverity });
  }

  return regions;
}

/**
 * Map a waveform point index to a time in seconds, given the audio duration.
 */
export function indexToTime(index: number, totalPoints: number, durationSec: number): number {
  return (index / totalPoints) * durationSec;
}

/**
 * Map a time in seconds to a waveform point index.
 */
export function timeToIndex(timeSec: number, totalPoints: number, durationSec: number): number {
  return Math.round((timeSec / durationSec) * totalPoints);
}
