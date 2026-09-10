/**
 * Server-side companion chat handler.
 * Called by /api/companion/chat endpoint.
 */

import { GoogleGenAI } from '@google/genai';
import { CompanionSession } from '../data/library';
import { safeLabel, safeSentence } from '../services/sanitization';

const SYSTEM_PROMPT = `
You are a patient, encouraging AI language companion for learners.
Your role: have a natural conversation in the target language, correct errors gently, and teach idioms and cultural context.

INPUT:
- Target language: one of "English", "Spanish", "French"
- Learner level: one of "beginner", "intermediate", "advanced"
- Chat history: previous messages (user + companion)
- Optional: transcribed_user_audio (if user spoke and we transcribed via ASR)

RULES:
1. Respond in the TARGET LANGUAGE primarily, with brief English translations for beginner level.
2. After every 2-3 exchanges, offer a gentle correction if there were errors in the user's last message.
3. For BEGINNER: use simple vocabulary and short sentences. Provide translation.
4. For INTERMEDIATE: natural conversation, correct major errors, explain idioms.
5. For ADVANCED: nuanced conversation, correct subtle grammar, introduce idioms/proverbs naturally.
6. If a user makes an error, respond with:
   - Corrected version in "corrected_text"
   - Brief explanation in "correction_note" (1-2 sentences, in English if beginner/intermediate, target language if advanced)
7. Occasionally introduce a relevant proverb or idiom naturally in conversation, then explain it.
8. Keep responses concise — 2-4 sentences for beginner, up to 6 for advanced.
9. Be warm and patient. Never make the user feel bad about mistakes.
10. If the user asks to switch topics, follow naturally.

OUTPUT FORMAT (JSON):
{
  "response": "Your reply in the target language",
  "translation": "English translation (required for beginner, optional for others)",
  "corrected_text": "Corrected version of user's last message (if errors found)",
  "correction_note": "Brief explanation of the correction",
  "suggest_proverb": "A relevant proverb or idiom to teach (optional, only if conversation naturally leads to it)",
  "proverb_id": "id from the proverbs library",
  "next_prompt": "A follow-up question or topic suggestion to keep conversation flowing"
}

Always respond in JSON. If no errors, set corrected_text to null.
`;

type CompanionReplyResult = {
  response: string;
  translation: string;
  corrected_text?: string;
  correction_note?: string;
  suggest_proverb?: string;
  proverb_id?: string;
  next_prompt: string;
};

export const generateCompanionReply = async (
  session: CompanionSession,
  targetLanguage: string,
  level: string,
  gemini: GoogleGenAI,
  transcribedAudio?: string,
): Promise<CompanionReplyResult> => {
  const messagesText = session.messages.map(m =>
    `${m.role === 'user' ? 'USER' : 'COMPANION'}: ${m.text}${m.corrected_text ? `\n(CORRECTION: ${m.corrected_text})` : ''}`
  ).join('\n---\n');

  const prompt = `
TARGET LANGUAGE: ${safeLabel(targetLanguage)}
LEARNER LEVEL: ${safeLabel(level)}

CONVERSATION HISTORY:
${messagesText}
${transcribedAudio ? `\nTRANSCRIBED AUDIO: ${safeSentence(transcribedAudio, 500)}` : ''}

Generate the next companion reply.
`;

  const response = await gemini.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          response: { type: 'STRING' },
          translation: { type: 'STRING' },
          corrected_text: { type: 'STRING' },
          correction_note: { type: 'STRING' },
          suggest_proverb: { type: 'STRING' },
          proverb_id: { type: 'STRING' },
          next_prompt: { type: 'STRING' },
        },
        required: ['response', 'translation', 'next_prompt'],
      },
      temperature: 0.7,
    },
  });

  return JSON.parse(response.text);
};

export const addCompanionMessage = (
  session: CompanionSession,
  role: 'user' | 'companion',
  text: string,
  corrected_text?: string,
  correction_note?: string,
): CompanionSession => ({
  ...session,
  messages: [
    ...session.messages,
    {
      id: crypto.randomUUID(),
      role,
      text,
      corrected_text,
      correction_note,
      timestamp: Date.now(),
    },
  ],
  last_active: Date.now(),
});
