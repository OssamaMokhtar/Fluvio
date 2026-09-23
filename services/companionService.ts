import { CompanionSession } from '../data/library';
import { apiHeaders } from './deviceId';

export interface CompanionReply {
  response: string;
  translation: string;
  corrected_text?: string;
  correction_note?: string;
  suggest_proverb?: string;
  proverb_id?: string;
  next_prompt: string;
  session: CompanionSession;
  timestamp: number;
}

export const companionChat = async (
  session: CompanionSession,
  message: string,
  targetLanguage: string,
  level: string,
  transcribedAudio?: string,
): Promise<CompanionReply> => {
  const response = await fetch('/api/companion/chat', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({
      sessionId: session.id,
      message,
      targetLanguage,
      level,
      transcribedAudio,
      messages: session.messages,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return await response.json();
};
