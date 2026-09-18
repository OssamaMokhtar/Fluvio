/** Scenario role-play service.
 *
 * Handles the server-side logic for AI conversation scenarios:
 * - Generating the AI's reply for each turn (gpt-4o → gpt-4o-mini → local fallback)
 * - Local heuristic 5-dimension scoring when no OpenAI credits available
 * - Building scenario-specific prompts that include role-play instructions
 */

import { Scenario, SCENARIOS, getScenarioById } from '../data/scenarios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScenarioMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  translation?: string;
  scores?: ScenarioScores;
  feedback?: string;
  corrected_version?: string;
  tts_audio?: string;
  timestamp: number;
}

export interface ScenarioScores {
  /**
   * SL-02: null in text-chat scenarios. There is no audio in a typed exchange,
   * so any pronunciation number would be invented. Render "not assessed", never 0.
   */
  pronunciation: number | null;
  grammar: number;
  vocabulary: number;
  fluency: number;
  appropriateness: number;
  overall: number;
  /** false = placeholder values from a static table, not an assessment. */
  measured: boolean;
}

export interface ScenarioSession {
  id: string;
  scenario_id: string;
  target_language: string;
  level: string;
  messages: ScenarioMessage[];
  started_at: number;
  last_active: number;
}

export interface ScenarioTurnResult {
  response: string;
  translation: string;
  tts_audio: string | null;   // null here; client fetches /api/generate-tts
  scores: ScenarioScores;
  feedback: string;
  corrected_version?: string;
  next_prompt: string;
  scenario_id: string;
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

export function createScenarioSession(scenario: Scenario, level: string): ScenarioSession {
  return {
    id: crypto.randomUUID(),
    scenario_id: scenario.id,
    target_language: scenario.target_language,
    level,
    messages: [],
    started_at: Date.now(),
    last_active: Date.now(),
  };
}

export function addScenarioMessage(
  session: ScenarioSession,
  role: 'user' | 'ai',
  text: string,
  translation?: string,
  scores?: ScenarioScores,
  feedback?: string,
  corrected_version?: string,
): ScenarioSession {
  return {
    ...session,
    messages: [
      ...session.messages,
      {
        id: crypto.randomUUID(),
        role,
        text,
        translation,
        scores,
        feedback,
        corrected_version,
        timestamp: Date.now(),
      },
    ],
    last_active: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Heuristic scoring (no API required)
// ---------------------------------------------------------------------------

/**
 * SL-02: placeholder values used ONLY when no model evaluation is available.
 * Pronunciation is absent by design — see ScenarioScores.pronunciation.
 * Anything built from this table is returned with measured: false.
 */
type TextDimensions = Pick<ScenarioScores, 'grammar' | 'vocabulary' | 'fluency' | 'appropriateness'>;

const HEURISTIC_BASE: Record<string, Record<string, TextDimensions>> = {
  'English': {
    'beginner':   { grammar: 60, vocabulary: 62, fluency: 55, appropriateness: 70 },
    'intermediate': { grammar: 68, vocabulary: 70, fluency: 65, appropriateness: 75 },
    'advanced':   { grammar: 78, vocabulary: 76, fluency: 72, appropriateness: 82 },
  },
  'Spanish': {
    'beginner':   { grammar: 58, vocabulary: 60, fluency: 52, appropriateness: 68 },
    'intermediate': { grammar: 65, vocabulary: 68, fluency: 62, appropriateness: 73 },
    'advanced':   { grammar: 75, vocabulary: 73, fluency: 70, appropriateness: 80 },
  },
  'French': {
    'beginner':   { grammar: 55, vocabulary: 58, fluency: 50, appropriateness: 65 },
    'intermediate': { grammar: 63, vocabulary: 66, fluency: 60, appropriateness: 70 },
    'advanced':   { grammar: 72, vocabulary: 70, fluency: 68, appropriateness: 78 },
  },
};

/**
 * SL-02: validate model-returned scores.
 *
 * Returns `measured: true` only when the model supplied usable numbers for every
 * text-judgeable dimension. `pronunciation` is deliberately null: this is a text
 * chat and no audio exists, so a pronunciation score here would be fabricated.
 * The client must not render a null dimension as a zero or as a bar.
 */
function coerceScores(raw: any, targetLanguage: string, level: string): ScenarioScores {
  const dims = ['grammar', 'vocabulary', 'fluency', 'appropriateness'] as const;
  const clean: Record<string, number> = {};
  let ok = true;
  for (const d of dims) {
    const v = Number(raw?.[d]);
    if (!Number.isFinite(v) || v < 0 || v > 100) { ok = false; break; }
    clean[d] = Math.round(v);
  }
  if (!ok) return { ...heuristicScores(targetLanguage, level), measured: false };
  const overall = Math.round(dims.reduce((a, d) => a + clean[d], 0) / dims.length);
  return {
    pronunciation: null,
    grammar: clean.grammar,
    vocabulary: clean.vocabulary,
    fluency: clean.fluency,
    appropriateness: clean.appropriateness,
    overall,
    measured: true,
  };
}

function heuristicScores(targetLanguage: string, level: string): ScenarioScores {
  const base = HEURISTIC_BASE[targetLanguage]?.[level] ||
    HEURISTIC_BASE['English']['intermediate'];
  const overall = Math.round(
    (base.grammar + base.vocabulary + base.fluency + base.appropriateness) / 4
  );
  return { ...base, pronunciation: null, overall, measured: false };
}

// ---------------------------------------------------------------------------
// Local fallback scenario reply (no OpenAI credits needed)
// ---------------------------------------------------------------------------

const LOCAL_FALLBACK: Record<string, Record<string, { response: string; feedback: string; next_prompt: string }>> = {
  'English': {
    'beginner': {
      response: 'Great job! Try to speak a bit louder and clearer. Can you try that again?',
      feedback: 'Good effort! Keep practicing. Focus on pronouncing each word clearly.',
      next_prompt: 'Try introducing yourself again — say your name, where you are from, and what you do.',
    },
    'intermediate': {
      response: 'Nice work! Your sentences are getting longer. Focus on connecting words smoothly.',
      feedback: 'Your sentences are improving. Try to use linking words like "and", "but", "so" to connect ideas.',
      next_prompt: 'Tell me about your day yesterday — what did you do?',
    },
    'advanced': {
      response: 'Excellent. Your language is sounding very natural. Try to vary your intonation more.',
      feedback: 'Your language is sophisticated. Vary your pitch to emphasize key words and sound more engaging.',
      next_prompt: 'What is a topic you feel passionately about? Let me know your position.',
    },
  },
  'Spanish': {
    'beginner': {
      response: '¡Muy bien! Practica las vocales puras y cortas. ¿Puedes repetir?',
      feedback: 'Buen intento. Practica vocales puras y cortas. Los sonidos claros son clave en español.',
      next_prompt: 'Preséntate de nuevo — di tu nombre, de dónde eres, y qué te gusta hacer.',
    },
    'intermediate': {
      response: 'Buen trabajo. Tus frases son más largas. Practica la entonación.',
      feedback: 'Tus frases están mejorando. Practica la entonación de preguntas y declaraciones.',
      next_prompt: 'Cuéntame sobre tu día ayer — ¿qué hiciste?',
    },
    'advanced': {
      response: 'Excelente. Tu español suena muy natural. Intenta variar la entonación.',
      feedback: 'Tu español es sofisticado. Varía tu entonación para enfatizar palabras clave.',
      next_prompt: '¿De qué tema te apasione? Cuéntame tu posición.',
    },
  },
  'French': {
    'beginner': {
      response: 'Très bien! Pratique les voyelles pures et courtes. Pouvez-vous répéter?',
      feedback: 'Bon essai. Pratiquez les voyelles pures et courtes. Les sons clairs sont essentiels en français.',
      next_prompt: 'Présentez-vous à nouveau — dites votre nom, d\'où vous venez, et ce que vous aimez faire.',
    },
    'intermediate': {
      response: 'Bon travail. Vos phrases sont plus longues. Travaillez l\'intonation.',
      feedback: 'Vos phrases s\'améliorent. Travaillez l\'intonation des questions et des déclarations.',
      next_prompt: 'Parlez-moi de votre journée d\'hier — qu\'avez-vous fait?',
    },
    'advanced': {
      response: 'Excellent. Votre français est très naturel. Essayez de varier l\'intonation.',
      feedback: 'Votre français est sophistiqué. Variez votre intonation pour souligner les mots clés.',
      next_prompt: 'De quel sujet vous passionne? Expliquez votre position.',
    },
  },
};

function localScenarioFallback(
  scenario: Scenario,
  userMessage: string,
  targetLanguage: string,
  level: string,
): ScenarioTurnResult {
  const scores = heuristicScores(targetLanguage, level);
  const fallback = LOCAL_FALLBACK[targetLanguage]?.[level] ||
    LOCAL_FALLBACK['English']['intermediate'];

  const response = fallback.response;
  const feedback = fallback.feedback;

  return {
    response,
    translation: '',
    tts_audio: null, // client calls /api/generate-tts separately
    scores,
    feedback,
    next_prompt: fallback.next_prompt,
    scenario_id: scenario.id,
  };
}

// ---------------------------------------------------------------------------
// OpenAI route helper
// ---------------------------------------------------------------------------

/**
 * Generate a scenario turn result.
 *
 * Uses the same fallback chain as generateCompanionReply:
 *   1. gpt-4o (full quality)
 *   2. gpt-4o-mini (cheaper)
 *   3. Local heuristic fallback (no API credits needed)
 *
 * The scenario context + role-play instructions are baked into the prompt
 * so the AI responds in character.
 */
export async function generateScenarioTurn(
  scenario: Scenario,
  session: ScenarioSession,
  userMessage: string,
  openai: import('openai').OpenAI | null,
): Promise<ScenarioTurnResult> {
  const targetLanguage = scenario.target_language;
  const level = session.level;

  // Build the conversation history text
  const historyText = session.messages.map(m =>
    `${m.role === 'user' ? 'USER' : 'AI'}: ${m.text}${m.translation ? `\n(Translation: ${m.translation})` : ''}${m.scores ? `\n(Scores: pronunciation=${m.scores.pronunciation}, grammar=${m.scores.grammar}, vocabulary=${m.scores.vocabulary}, fluency=${m.scores.fluency}, appropriateness=${m.scores.appropriateness})` : ''}`
  ).join('\n\n');

  const isFirstTurn = session.messages.length === 0;

  const prompt = `\
SCENARIO: ${scenario.title}
CONTEXT: ${scenario.context}
YOUR ROLE: ${scenario.role_play_instructions}
TARGET LANGUAGE: ${targetLanguage}
LEARNER LEVEL: ${level}

${isFirstTurn
  ? `This is the start of the conversation. Respond in character as the AI role above. Keep your response concise (2-4 sentences for beginner, up to 6 for advanced). Respond primarily in the TARGET LANGUAGE. For beginner level, include a brief English translation at the end. Do NOT include any text outside the JSON object.
`
  : `The learner just said: "${userMessage}"

Generate the AI's next reply in character. Respond primarily in the TARGET LANGUAGE. For beginner level, include a brief English translation at the end. Keep responses concise (2-4 sentences for beginner, up to 6 for advanced).
`
}

EVALUATE the learner's turn on four dimensions you can actually judge from text.
Score each 0-100. Be honest and discriminating: a beginner making real errors
should score in the 40s and 50s, not the 70s. Do NOT score pronunciation — you
are reading text, not listening to audio.

OUTPUT FORMAT (JSON):
{
  "response": "Your reply in the target language",
  "translation": "English translation (required for beginner, optional for others)",
  "next_prompt": "A follow-up question or prompt to keep the conversation going",
  "corrected_version": "Corrected version of user's message if errors found, otherwise omit this key",
  "feedback": "Brief encouraging feedback on the learner's turn (1-2 sentences)",
  "scores": {
    "grammar": 0-100,
    "vocabulary": 0-100,
    "fluency": 0-100,
    "appropriateness": 0-100
  },
  "score_rationale": "One sentence explaining the lowest score"
}

Always respond in JSON. Do not include any text outside the JSON object.
`;

  // If no OpenAI (no credits), return local fallback
  if (!openai) {
    return localScenarioFallback(scenario, userMessage, targetLanguage, level);
  }

  // Try gpt-4o, then gpt-4o-mini, then local fallback
  const models = ['gpt-4o', 'gpt-4o-mini'] as const;
  for (const model of models) {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1024,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        // SL-02: this line used to be
        //   const scores = heuristicScores(targetLanguage, level);
        // which threw away the model's evaluation and returned a constant from a
        // static table — on the SUCCESS path, not the fallback. Every learner at
        // a given language/level saw identical scores on every turn, forever.
        // The model is now asked for scores and its answer is used, validated.
        const scores = coerceScores(parsed.scores, targetLanguage, level);
        return {
          response: parsed.response || '',
          translation: parsed.translation || '',
          tts_audio: null,
          scores,
          feedback: parsed.feedback || '',
          corrected_version: parsed.corrected_version,
          next_prompt: parsed.next_prompt || '',
          scenario_id: scenario.id,
        };
      }
    } catch (err: any) {
      if (err.status === 429 || err.status === 401 || err.status >= 500) {
        continue;
      }
      continue;
    }
  }

  // Fallback
  return localScenarioFallback(scenario, userMessage, targetLanguage, level);
}
