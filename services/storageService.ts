
import { AnalysisResponse, SessionRecord, TranscriptWord } from '../types';

const DB_NAME = 'slang_db';
const STORE_NAME = 'sessions';
const DB_VERSION = 1;

// Open DB Helper
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveSession = async (analysis: AnalysisResponse, audioBlob: Blob | null, targetPhoneme?: string | null, annotatedTranscriptWords?: TranscriptWord[]): Promise<void> => {
  try {
    const db = await openDB();
    const newRecord: SessionRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      overall_score: analysis.overall_score,
      pronunciation_score: analysis.pronunciation_score,
      intelligibility_score: analysis.intelligibility_score,
      phoneme_errors: analysis.phoneme_errors,
      target_phoneme: targetPhoneme,
      full_analysis: analysis,
      audioBlob: audioBlob || undefined
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(newRecord);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to save session to IndexedDB", error);
    // Fallback or silent fail?
  }
};

export const getHistory = async (): Promise<SessionRecord[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
          const results = request.result as SessionRecord[];
          // Sort descending by timestamp
          results.sort((a, b) => b.timestamp - a.timestamp);
          resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to load history from IndexedDB", error);
    return [];
  }
};

export const deleteSession = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to delete session", error);
    throw error;
  }
};
