import { OpenAI } from 'openai';
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

// -----------------------------------------------------------------------
// Local fallback: generates a companion reply without any API call.
// Uses language + level + last message to craft a contextual response.
// -----------------------------------------------------------------------
const LOCAL_FALLBACK_RESPONSES: Record<string, Record<string, { response: string; translation: string; next_prompt: string }>> = {
  'English': {
    'beginner': {
      response: 'Great start! Your English is improving. Keep practising every day — even just a few minutes helps.',
      translation: '',
      next_prompt: 'Can you tell me about yourself in a few sentences?'
    },
    'intermediate': {
      response: 'Nice work! I noticed you\'re getting more comfortable with longer sentences. Try focusing on pronunciation of tricky sounds like "th" and word endings.',
      translation: '',
      next_prompt: 'What did you do today? Tell me in 2-3 sentences.'
    },
    'advanced': {
      response: 'Excellent progress. Your English is sounding very natural. To take it further, practice connected speech and intonation — try reading aloud with a podcast and mimicking the rhythm.',
      translation: '',
      next_prompt: 'What\'s a topic you\'re passionate about? Let\'s discuss it.'
    }
  },
  'Spanish': {
    'beginner': {
      response: '¡Muy bien! Your Spanish is off to a good start. Remember: Spanish vowels are short and pure — say them clearly!',
      translation: 'Very well! Your Spanish is off to a good start. Remember: Spanish vowels are short and pure — say them clearly!',
      next_prompt: '¿Cómo te llamas y de dónde eres?'
    },
    'intermediate': {
      response: 'Buen trabajo. Your sentences are getting longer. Watch the verb conjugations — especially "ser" vs "estar" and past tense.',
      translation: 'Good work. Your sentences are getting longer. Watch the verb conjugations — especially "ser" vs "estar" and past tense.',
      next_prompt: 'Habla de tu familia — ¿cuántos hermanos tienes?'
    },
    'advanced': {
      response: 'Excelente. Your Spanish is approaching fluency. To refine it: practice the subjunctive mood, work on your accent (especially "r" vs "rr"), and learn some regional idioms.',
      translation: 'Excellent. Your Spanish is approaching fluency. To refine it: practice the subjunctive mood, work on your accent (especially "r" vs "rr"), and learn some regional idioms.',
      next_prompt: '¿Cuál es tu opinión sobre el cambio climático?'
    }
  },
  'French': {
    'beginner': {
      response: 'Très bien! Your French is getting started nicely. Remember: most final consonants in French are silent — don\'t pronounce them!',
      translation: 'Very well! Your French is getting started nicely. Remember: most final consonants in French are silent — don\'t pronounce them!',
      next_prompt: 'Parlez-moi de vous — comment allez-vous aujourd\'hui?'
    },
    'intermediate': {
      response: 'Bon travail. You\'re building good sentences. Focus on: nasal vowels (an, on, in), the silent "h", and verb endings in -er, -ir, -re.',
      translation: 'Good work. You\'re building good sentences. Focus on: nasal vowels (an, on, in), the silent "h", and verb endings in -er, -ir, -re.',
      next_prompt: 'Qu\'est-ce que vous aimez faire le week-end?'
    },
    'advanced': {
      response: 'Excellent. Your French is sophisticated. To polish it: practice liaison (linking words), work on the rhythm and melody of French, and learn some common expressions like "voilà" and "en fait".',
      translation: 'Excellent. Your French is sophisticated. To polish it: practice liaison (linking words), work on the rhythm and melody of French, and learn some common expressions like "voilà" and "en fait".',
      next_prompt: 'Qu\'est-ce que vous pensez de la culture française?'
    }
  }
};

function localFallbackCompanionReply(session: CompanionSession, targetLanguage: string, level: string): CompanionReplyResult {
  const langKey = targetLanguage;
  const levelKey = level;
  const responses = LOCAL_FALLBACK_RESPONSES[langKey]?.[levelKey];
  const base = responses || LOCAL_FALLBACK_RESPONSES[langKey]?.['intermediate'] || LOCAL_FALLBACK_RESPONSES['English']['beginner'];

  return {
    response: base.response,
    translation: base.translation || '',
    next_prompt: base.next_prompt,
  };
}

export const generateCompanionReply = async (
  session: CompanionSession,
  targetLanguage: string,
  level: string,
  openai: OpenAI,
  transcribedAudio?: string,
): Promise<CompanionReplyResult> => {
  // --- FALLBACK CHAIN ---
  // 1. Try gpt-4o (full quality)
  // 2. Try gpt-4o-mini (cheaper, still good)
  // 3. Local heuristic fallback (no API credits needed)
  const models: string[] = ['gpt-4o', 'gpt-4o-mini'];

  for (const model of models) {
    try {
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

      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1024,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (err: any) {
      // 429 (no credits), 401 (bad key), 500 — try next model
      if (err.status === 429 || err.status === 401 || err.status >= 500) {
        continue;
      }
      // For other errors, also try next model
      continue;
    }
  }

  // --- LOCAL HEURISTIC FALLBACK (no API call required) ---
  return localFallbackCompanionReply(session, targetLanguage, level);
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
