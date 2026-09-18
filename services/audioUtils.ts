
/**
 * Converts a Blob to a Base64 string (stripping the data URL prefix).
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * SL-07: removed. This returned Math.random() values that were drawn as if they
 * were an audio envelope. Use an AnalyserNode against the live MediaStream when
 * a real recording visualiser is needed.
 */

/**
 * Helper to play audio blob
 */
export const playAudioBlob = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
};

/**
 * Decodes an audio blob into an AudioBuffer for visualization.
 */
export const getAudioBuffer = async (blob: Blob): Promise<AudioBuffer> => {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return await audioContext.decodeAudioData(arrayBuffer);
};

/**
 * Helper to decode base64 string to Uint8Array
 */
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Plays base64-encoded TTS audio returned by /api/generate-tts.
 *
 * SL-13: this function was called playPCM and decoded the bytes as 24 kHz mono
 * Int16 PCM, with comments describing Gemini's TTS format. The server has
 * requested MP3 from OpenAI since the migration in commit aa2118a, so the bytes
 * were never PCM. `new Int16Array(bytes.buffer)` also threw a RangeError on any
 * odd-length payload. decodeAudioData handles MP3, WAV, Opus and AAC and asks
 * the browser to tell us the real sample rate instead of assuming one.
 *
 * The old name is kept as an alias so existing call sites keep working.
 */
export const playEncodedAudio = async (base64Audio: string): Promise<void> => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioContextClass();
  try {
    const bytes = decodeBase64(base64Audio);
    const buffer = await ctx.decodeAudioData(bytes.buffer.slice(0) as ArrayBuffer);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
    await new Promise<void>((resolve) => { source.onended = () => resolve(); });
  } catch (e) {
    console.error('Could not play TTS audio', e);
  } finally {
    try { await ctx.close(); } catch { /* already closed */ }
  }
};

/** @deprecated Misnamed — the payload is encoded audio, not raw PCM. Use playEncodedAudio. */
export const playPCM = playEncodedAudio;
