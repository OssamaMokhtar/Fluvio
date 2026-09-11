/**
 * Scenario corpus for AI conversation role-play.
 *
 * Each scenario defines a real-world situation where the learner
 * plays one role and the AI plays the other. The AI responds with
 * TTS audio, and after each exchange the learner gets a 5-dimension
 * evaluation (pronunciation, grammar, vocabulary, fluency, appropriateness).
 */

export interface Scenario {
  id: string;
  title: string;
  context: string;              // Brief description of the situation
  role_play_instructions: string; // Instructions for the AI on how to play its role
  target_language: 'English' | 'Spanish' | 'French';
  level: 'beginner' | 'intermediate' | 'advanced';
  expected_vocabulary: string[];  // Words/phrases the scenario tests
  evaluation_rubric: {
    pronunciation: string;    // What to listen for
    grammar: string;          // What grammar points to evaluate
    vocabulary: string;       // Expected vocabulary usage
    fluency: string;          // Fluency markers
    appropriateness: string;  // Cultural/contextual appropriateness
  };
}

export const SCENARIOS: Scenario[] = [
  // ──────────────────────────────────────────────
  // ENGLISH — BEGINNER
  // ──────────────────────────────────────────────
  {
    id: 'en-intro',
    title: 'Introducing Yourself',
    context: 'You just moved to a new city and meet a neighbor for the first time.',
    role_play_instructions: 'You are a friendly neighbor. The learner will introduce themselves. Respond naturally, ask 1-2 follow-up questions, keep your English simple and clear.',
    target_language: 'English',
    level: 'beginner',
    expected_vocabulary: ['name', 'from', 'live', 'work', 'hobby', 'nice to meet you'],
    evaluation_rubric: {
      pronunciation: 'Clear vowel sounds, especially word endings. Can the learner pronounce their own name clearly?',
      grammar: 'Simple present tense, subject-verb-object order. Check for "I am" vs "I\'m" consistency.',
      vocabulary: 'Basic personal vocabulary (name, city, job, hobby).',
      fluency: 'Can the learner speak without long pauses? Are single words strung together or full sentences?',
      appropriateness: 'Polite greeting, appropriate for meeting someone new.',
    },
  },
  {
    id: 'en-cafe',
    title: 'Ordering at a Cafe',
    context: 'You walk into a cafe and order a drink and a pastry.',
    role_play_instructions: 'You are a cafe barista. Greet the customer, take their order, ask if they want anything else, and tell them the total. Keep responses short.',
    target_language: 'English',
    level: 'beginner',
    expected_vocabulary: ['coffee', 'tea', 'water', 'please', 'thank you', 'how much', 'cup', 'cup of'],
    evaluation_rubric: {
      pronunciation: 'Clear consonant sounds, especially "th" in "thank you" and "please."',
      grammar: 'Basic request forms ("I would like...", "Can I have...").',
      vocabulary: 'Food/drink vocabulary, polite request words.',
      fluency: 'Can the learner order in one turn without long hesitation?',
      appropriateness: 'Polite tone, eye contact simulation (in voice: friendly tone).',
    },
  },
  {
    id: 'en-directions',
    title: 'Asking for Directions',
    context: 'You are lost in a new city and need to find the train station.',
    role_play_instructions: 'You are a local resident. Give clear, simple directions using basic prepositions (left, right, straight, next to). Keep each direction step short.',
    target_language: 'English',
    level: 'beginner',
    expected_vocabulary: ['left', 'right', 'straight', 'stop', 'street', 'corner', 'next to', 'across'],
    evaluation_rubric: {
      pronunciation: 'Clear "r" and "l" sounds, especially in "right" and "left."',
      grammar: 'Imperative directions ("Go straight," "Turn left"), question forms ("Where is...?").',
      vocabulary: 'Directional vocabulary and basic spatial prepositions.',
      fluency: 'Can the learner ask the question clearly? Can they repeat back directions?',
      appropriateness: 'Polite question form, clear acknowledgment of the answer.',
    },
  },

  // ──────────────────────────────────────────────
  // ENGLISH — INTERMEDIATE
  // ──────────────────────────────────────────────
  {
    id: 'en-restaurant',
    title: 'Dining at a Restaurant',
    context: 'You are at a sit-down restaurant. Order a meal, ask about ingredients, and handle the check.',
    role_play_instructions: 'You are a restaurant server. Welcome the table, take the order, answer questions about the menu, and bring the check. Use natural restaurant language.',
    target_language: 'English',
    level: 'intermediate',
    expected_vocabulary: ['appetizer', 'main course', 'dessert', 'allergy', 'ingredient', 'recommend', 'check', 'tip'],
    evaluation_rubric: {
      pronunciation: 'Connected speech ("what do you" → "whatcha"), clear intonation in questions.',
      grammar: 'Modal verbs ("could I have...", "would you recommend..."), indirect questions.',
      vocabulary: 'Restaurant-specific vocabulary, ability to ask about ingredients/allergies.',
      fluency: 'Can the learner handle a multi-turn exchange smoothly? Natural turn-taking.',
      appropriateness: 'Polite register for restaurant setting, appropriate tipping conversation.',
    },
  },
  {
    id: 'en-job-interview',
    title: 'Job Interview',
    context: 'You are interviewing for a position. Answer questions about your experience and strengths.',
    role_play_instructions: 'You are a hiring manager. Ask 3-4 interview questions (experience, strengths, why this company, a challenge you overcame). Evaluate responses professionally.',
    target_language: 'English',
    level: 'intermediate',
    expected_vocabulary: ['experience', 'responsible for', 'team', 'challenge', 'solution', 'strength', 'weakness', 'opportunity'],
    evaluation_rubric: {
      pronunciation: 'Professional register — clear articulation, controlled pace, no mumbling.',
      grammar: 'Past tense for previous experience, present for current skills, future for goals.',
      vocabulary: 'Professional/business vocabulary, ability to describe responsibilities and achievements.',
      fluency: 'Can the learner sustain a 2-3 sentence answer without losing coherence?',
      appropriateness: 'Professional tone, appropriate level of detail, good interview etiquette.',
    },
  },
  {
    id: 'en-travel-plan',
    title: 'Planning a Trip',
    context: 'You are at a travel agency planning a two-week vacation. Discuss destinations, budget, and preferences.',
    role_play_instructions: 'You are a travel agent. Ask about preferences (beach vs city, budget, interests), suggest 2-3 options, and help narrow down. Use persuasive but friendly language.',
    target_language: 'English',
    level: 'intermediate',
    expected_vocabulary: ['destination', 'budget', 'flight', 'hotel', 'activity', 'sightseeing', 'relax', 'adventure', 'pack'],
    evaluation_rubric: {
      pronunciation: 'Intonation in questions and suggestions, clear numbers (prices, dates).',
      grammar: 'Conditional ("if you like beaches, you could..."), comparatives ("this is cheaper than..."), future plans.',
      vocabulary: 'Travel planning vocabulary, ability to express preferences and make recommendations.',
      fluency: 'Can the learner discuss preferences at length? Handle a 4-5 turn exchange?',
      appropriateness: 'Polite persuasive tone, appropriate for service interaction.',
    },
  },

  // ──────────────────────────────────────────────
  // ENGLISH — ADVANCED
  // ──────────────────────────────────────────────
  {
    id: 'en-debate',
    title: 'Debate: Remote Work',
    context: 'You are in a discussion about whether remote work is better than office work. Present your position and respond to counterarguments.',
    role_play_instructions: 'You take the opposite position. Present 2-3 arguments, respond to the learner\'s points, and challenge them respectfully. Keep it debate-style but friendly.',
    target_language: 'English',
    level: 'advanced',
    expected_vocabulary: ['productivity', 'collaboration', 'flexibility', 'balance', 'isolate', 'commute', 'autonomous', 'interaction'],
    evaluation_rubric: {
      pronunciation: 'Nuanced intonation for emphasis, stress on key words in arguments, natural pacing.',
      grammar: 'Complex sentence structures (although, despite, whereas), hedging ("it could be argued that..."), conditionals.',
      vocabulary: 'Abstract/professional vocabulary, ability to express nuanced positions.',
      fluency: 'Can the learner sustain a complex argument across multiple turns without losing coherence?',
      appropriateness: 'Debate etiquette — respectful disagreement, acknowledging counterpoints, clear structure.',
    },
  },
  {
    id: 'en-story',
    title: 'Tell a Personal Story',
    context: 'Share a memorable experience from your life. The AI will listen and ask follow-up questions.',
    role_play_instructions: 'You are an attentive listener. After the learner tells their story, ask 2-3 follow-up questions that show you were listening. Show interest and empathy.',
    target_language: 'English',
    level: 'advanced',
    expected_vocabulary: ['remember', 'suddenly', 'eventually', 'meanwhile', 'unfortunately', 'amazing', 'terrible', 'surprised'],
    evaluation_rubric: {
      pronunciation: 'Narrative pacing — variation in speed for dramatic effect, clear past tense endings.',
      grammar: 'Past tense consistency, narrative connectors (then, after that, suddenly, eventually), reported speech if relevant.',
      vocabulary: 'Descriptive/emotive vocabulary, ability to convey feeling and detail.',
      fluency: 'Can the learner tell a coherent story with a beginning, middle, and end? Natural pacing?',
      appropriateness: 'Engaging storytelling — appropriate detail level, clear structure, audience awareness.',
    },
  },

  // ──────────────────────────────────────────────
  // SPANISH — BEGINNER
  // ──────────────────────────────────────────────
  {
    id: 'es-perfil',
    title: 'Presentaciones',
    context: 'En una fiesta, conoces a alguien nuevo. Preséntate y pregunta sobre ellos.',
    role_play_instructions: 'Eres una persona amable en una fiesta. Saluda, presenta información básica, y hace 1-2 preguntas sencillas. Usa un español claro y lento.',
    target_language: 'Spanish',
    level: 'beginner',
    expected_vocabulary: ['nombre', 'de dónde', 'vivir', 'trabajar', 'gustar', 'mucho gusto'],
    evaluation_rubric: {
      pronunciation: 'Vocales cortas y puras. Distinción clara de "r" y "l".',
      grammar: 'Verbo "ser" vs "estar", presente de indicativo, gênero y número.',
      vocabulary: 'Vocabulario personal básico (nombre, origen, trabajo, pasatiempo).',
      fluency: '¿Puede el alumno producir frases simples sin pausas largas?',
      appropriateness: 'Saludo apropiado para una situación social informal.',
    },
  },
  {
    id: 'es-restaurante',
    title: 'Pedido en un Restaurante',
    context: 'Estás en un restaurante y necesitas pedir la comida y pedir la cuenta.',
    role_play_instructions: 'Eres un mesero. Saluda, toma el pedido, responde preguntas sobre el menú, y trae la cuenta. Usa lenguaje de restaurante natural.',
    target_language: 'Spanish',
    level: 'intermediate',
    expected_vocabulary: ['entrada', 'plato principal', 'postre', 'receta', 'alergia', 'cuenta', 'propina'],
    evaluation_rubric: {
      pronunciation: 'Entonación en preguntas, "r" fuerte en "restaurante" y "cuenta".',
      grammar: 'Condicional ("me gustaría..."), imperativo para recomendaciones, verbos de pedido.',
      vocabulary: 'Vocabulario de restaurante, capacidad para preguntar sobre ingredientes.',
      fluency: '¿Maneja el alumno una interacción de varios turnos sin pausas largas?',
      appropriateness: 'Registro formal pero amable para un restaurante.',
    },
  },
  {
    id: 'es-viaje',
    title: 'Planeando un Viaje',
    context: 'En una agencia de viajes, planeas un viaje de dos semanas. Hablan sobre destinos, presupuesto, y gustos.',
    role_play_instructions: 'Eres un agente de viajes. Pregunta sobre preferencias (playa vs ciudad, presupuesto, intereses), sugiere 2-3 opciones, y ayuda a decidir.',
    target_language: 'Spanish',
    level: 'intermediate',
    expected_vocabulary: ['destino', 'presupuesto', 'vuelo', 'hotel', 'actividad', 'visitar', 'relajarse', 'aventura'],
    evaluation_rubric: {
      pronunciation: 'Intonación en preguntas y sugerencias, números claros (precios, fechas).',
      grammar: 'Condicional, comparativos, futuro próximo para planes.',
      vocabulary: 'Vocabulario de planificación de viajes, expresar preferencias.',
      fluency: '¿Discute el alumno sus preferencias en una interacción de 4-5 turnos?',
      appropriateness: 'Tono persuasivo pero amable, apropiado para interacción de servicio.',
    },
  },

  // ──────────────────────────────────────────────
  // SPANISH — ADVANCED
  // ──────────────────────────────────────────────
  {
    id: 'es-debate',
    title: 'Debate: Trabajo Remoto',
    context: 'Estás en una discusión sobre si el trabajo remoto es mejor que el trabajo en la oficina. Presenta tu posición y responde a los contraargumentos.',
    role_play_instructions: 'Tomas la posición opuesta. Presenta 2-3 argumentos, responde a los puntos del alumno, y desafía con respeto. Mantén el estilo de debate pero amable.',
    target_language: 'Spanish',
    level: 'advanced',
    expected_vocabulary: ['productividad', 'colaboración', 'flexibilidad', 'equilibrio', 'aislarse', 'trampa', 'autónomo', 'interacción'],
    evaluation_rubric: {
      pronunciation: 'Entonación matizada para énfasis, acento en palabras clave en argumentos.',
      grammar: 'Estructuras complejas (aunque, a pesar de, mientras que), estructuras de opinión ("podría argumentarse que...").',
      vocabulary: 'Vocabulario abstracto/profesional, capacidad para expresar posiciones matizadas.',
      fluency: '¿Mantiene el alumno un argumento complejo en varios turnos sin perder coherencia?',
      appropriateness: 'Etiqueta de debate — desacuerdo respetuoso, reconocer contraargumentos, estructura clara.',
    },
  },

  // ──────────────────────────────────────────────
  // FRENCH — BEGINNER
  // ──────────────────────────────────────────────
  {
    id: 'fr-presenter',
    title: 'Se présenter',
    context: 'Vous arrivez dans un nouveau pays et rencontrez quelqu\'un pour la première fois.',
    role_play_instructions: 'Vous êtes un voisin accueillant. Le learner se présente. Répondez naturellement, posez 1-2 questions simples. Utilisez un français clair et lent.',
    target_language: 'French',
    level: 'beginner',
    expected_vocabulary: ['nom', 'de', 'venir', 'habiter', 'travailler', 'passer', 'ravi'],
    evaluation_rubric: {
      pronunciation: 'Voyelles nasales (an, on, in) et le "r" français. Finales de mots silencieuses.',
      grammar: 'Verbe "être" et "avoir", présent de l\'indicatif, genre et nombre.',
      vocabulary: 'Vocabulaire personnel de base (nom, origine, travail, passe-temps).',
      fluency: 'Le learner peut-il produire des phrases simples sans pauses longues?',
      appropriateness: 'Salutation appropriée pour une rencontre sociale.',
    },
  },
  {
    id: 'fr-cafe',
    title: 'Au Café',
    context: 'Vous entrez dans un café et commandez une boisson et un pâtisserie.',
    role_play_instructions: 'Vous êtes un serveur de café. Accueillez le client, prenez sa commande, proposez autre chose, et donnez le total. Réponses courtes et naturelles.',
    target_language: 'French',
    level: 'beginner',
    expected_vocabulary: ['café', 'thé', 'eau', 's\'il vous plaît', 'merci', 'combien', 'tasse'],
    evaluation_rubric: {
      pronunciation: '"R" français, voyelles nasales dans "un" et "en", liaison dans "s\'il vous plaît".',
      grammar: 'Formes de demande basiques ("Je voudrais...", "Pouvez-vous...").',
      vocabulary: 'Vocabulaire de boissons/gâteaux, mots de politesse.',
      fluency: 'Le learner peut-il commander en une phrase sans hésitation longue?',
      appropriateness: 'Registre poli pour un contexte de café.',
    },
  },

  // ──────────────────────────────────────────────
  // FRENCH — INTERMEDIATE
  // ──────────────────────────────────────────────
  {
    id: 'fr-restaurant',
    title: 'Au Restaurant',
    context: 'Vous êtes dans un restaurant assis. Commandez un repas, demandez des informations sur les plats, et gérez l\'addition.',
    role_play_instructions: 'Vous êtes un serveur. Accueillez la table, prenez la commande, répondez aux questions du menu, et apportez l\'addition. Langage de restaurant naturel.',
    target_language: 'French',
    level: 'intermediate',
    expected_vocabulary: ['entrée', 'plat principal', 'dessert', 'allergie', 'ingredient', 'recommander', 'addition', 'pourboire'],
    evaluation_rubric: {
      pronunciation: 'Liaison dans les phrases, intonation dans les questions, "r" et voyelles nasales.',
      grammar: 'Conditionnel ("Je voudrais..."), demandes indirectes, verbes de commande.',
      vocabulary: 'Vocabulaire de restaurant, demander des informations sur les plats.',
      fluency: 'Le learner gère-t-il un échange de plusieurs tours sans pause?',
      appropriateness: 'Registre formel mais amical pour un restaurant.',
    },
  },
  {
    id: 'fr-voyage',
    title: 'Planifier un Voyage',
    context: 'Vous êtes dans une agence de voyage pour planifier des vacances de deux semaines. Discutez des destinations, du budget, et des préférences.',
    role_play_instructions: 'Vous êtes un agent de voyage. Demandez les préférences (plage vs ville, budget, centres d\'intérêt), proposez 2-3 options, et aidez à choisir.',
    target_language: 'French',
    level: 'intermediate',
    expected_vocabulary: ['destination', 'budget', 'vol', 'hôtel', 'activité', 'visiter', 'se reposer', 'aventure'],
    evaluation_rubric: {
      pronunciation: 'Intonation dans les questions et suggestions, chiffres clairs (prix, dates).',
      grammar: 'Conditionnel, comparatifs, futur proche pour les projets.',
      vocabulary: 'Vocabulaire de planification de voyage, exprimer ses préférences.',
      fluency: 'Le learner discute-t-il ses préférences sur plusieurs tours?',
      appropriateness: 'Ton persuasif mais amical, approprié pour un échange de service.',
    },
  },
];

/**
 * Filter scenarios by language and level.
 */
export function filterScenarios(
  scenarios: Scenario[],
  targetLanguage: string,
  level: string,
): Scenario[] {
  const lang = targetLanguage;
  const lvl = level;
  return scenarios.filter(s => s.target_language === lang && s.level === lvl);
}

/**
 * Get a scenario by ID.
 */
export function getScenarioById(scenarios: Scenario[], id: string): Scenario | undefined {
  return scenarios.find(s => s.id === id);
}
