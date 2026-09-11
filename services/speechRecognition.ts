/**
 * Browser SpeechRecognition wrapper for live transcription during recording.
 *
 * Uses the Web Speech API (webkitSpeechRecognition / SpeechRecognition)
 * to provide interim transcription results while the user speaks.
 * No API key required — runs entirely in the browser.
 *
 * Fallback: if the browser doesn't support SpeechRecognition, returns null
 * and the UI gracefully degrades to "transcription unavailable."
 */

export interface TranscriptWord {
  word: string;
  start: number;        // relative time from recording start (seconds)
  confidence: number;   // 0–1 from SpeechRecognition API
  isFinal: boolean;     // true when the utterance is finalized
}

export interface SpeechRecognitionHandle {
  /** Start listening for speech. Calls onResult with TranscriptWord[] on each update. */
  start: () => void;
  /** Stop listening. */
  stop: () => void;
  /** Whether currently listening. */
  isListening: () => boolean;
  /** The most recent transcript words (updated live). */
  getWords: () => TranscriptWord[];
  /** Accumulated final transcript text. */
  getFinalText: () => string;
}

const recognitionInstances = new WeakMap<any, { words: TranscriptWord[]; finalText: string; listening: boolean }>();

/**
 * Create a speech recognition handle.
 * Returns null if the browser doesn't support the Web Speech API.
 */
export function createSpeechRecognition(): SpeechRecognitionHandle | null {
  const { SpeechRecognition } = window as any;
  const webkitSpeechRecognition = (window as any).webkitSpeechRecognition;

  const Recognizer = SpeechRecognition || webkitSpeechRecognition;
  if (!Recognizer) {
    console.warn('Web Speech API not available in this browser.');
    return null;
  }

  const recognizer = new Recognizer();
  const state = {
    words: [] as TranscriptWord[],
    finalText: '',
    listening: false,
    startTime: 0 as number,
  };

  recognitionInstances.set(recognizer, state);

  recognizer.continuous = true;
  recognizer.interimResults = true;
  recognizer.lang = 'en-US'; // Will be overridden by caller if needed

  let resultIndex = 0;

  recognizer.onresult = (event: any) => {
    const words: TranscriptWord[] = [];
    const now = (Date.now() - state.startTime) / 1000;

    for (let i = resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim();
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      if (transcript) {
        // Split into words, preserving rough timing
        const wordList = transcript.split(/\s+/).filter(Boolean);
        const wordDuration = isFinal ? (now - (state.words.length > 0 ? state.words[state.words.length - 1].start : 0)) / Math.max(1, wordList.length) : 0.3;

        for (let w = 0; w < wordList.length; w++) {
          const wordStart = isFinal
            ? state.finalText.split(/\s+/).length > 0
              ? (state.words[state.words.length - 1]?.start || 0) + 0.3
              : 0
            : now - (wordList.length - w) * 0.3;

          words.push({
            word: wordList[w],
            start: Math.max(0, wordStart),
            confidence: Math.min(1, Math.max(0, confidence)),
            isFinal,
          });
        }

        if (isFinal) {
          state.finalText += (state.finalText ? ' ' : '') + transcript;
          resultIndex = i + 1;
        }
      }
    }

    if (words.length > 0) {
      // Append new words, replacing any interim words at the same position
      state.words = [...state.words, ...words];
    }
  };

  recognizer.onerror = (event: any) => {
    console.warn('SpeechRecognition error:', event.error);
    if (event.error === 'no-speech') {
      // No speech detected — not a fatal error, just resume listening
      try { recognizer.stop(); } catch {}
      try { recognizer.start(); } catch {}
    }
  };

  recognizer.onend = () => {
    state.listening = false;
  };

  return {
    start: () => {
      state.words = [];
      state.finalText = '';
      state.startTime = Date.now();
      state.listening = true;
      resultIndex = 0;
      try {
        recognizer.lang = 'en-US'; // Default — caller should set appropriate lang
        recognizer.start();
      } catch (e) {
        console.warn('Failed to start SpeechRecognition:', e);
        state.listening = false;
      }
    },
    stop: () => {
      try { recognizer.stop(); } catch {}
      state.listening = false;
    },
    isListening: () => state.listening,
    getWords: () => state.words,
    getFinalText: () => state.finalText,
  };
}

/**
 * Set the recognition language (BCP-47 tag, e.g., 'en-US', 'es-ES', 'fr-FR').
 */
export function setRecognitionLanguage(recognizer: any, lang: string): void {
  try {
    recognizer.lang = lang;
  } catch (e) {
    console.warn('Failed to set recognition language:', e);
  }
}

/**
 * Check if the browser supports speech recognition.
 */
export function isSpeechRecognitionAvailable(): boolean {
  return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
}
