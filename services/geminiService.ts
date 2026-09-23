import { AnalysisResponse, UserProfile } from "../types";
import { apiHeaders } from './deviceId';

export const analyzeAudio = async (
  audioBase64: string,
  userProfile: UserProfile,
  referenceText: string,
  targetPhoneme?: string | null
): Promise<AnalysisResponse> => {
  try {
    const response = await fetch("/api/analyze-audio", {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({
        audioBase64,
        userProfile,
        referenceText,
        targetPhoneme,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Client Proxy Analyze Audio Error:", error);
    throw error;
  }
};

export const generateTTS = async (text: string): Promise<string> => {
  try {
    const response = await fetch("/api/generate-tts", {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.audioData;
  } catch (error) {
    console.error("Client Proxy TTS Error:", error);
    throw error;
  }
};

export const generateLessonPlan = async (userProfile: UserProfile): Promise<{ prompt: string, context: string }> => {
  try {
    const response = await fetch("/api/generate-lesson-plan", {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({ userProfile }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Client Proxy Lesson Plan Error:", error);
    // Safe client-side fallback
    return {
      context: "Daily Practice",
      prompt: "The quick brown fox jumps over the lazy dog."
    };
  }
};
