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
  target_language: 'English' | 'Spanish' | 'French' | 'Italian' | 'German' | 'Japanese' | 'Portuguese' | 'Chinese' | 'Arabic' | 'Russian' | 'Turkish' | 'Korean' | 'Hindi';
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
  // ==================================================
  // ITALIAN — BEGINNER
  // ==================================================
  {
    id: 'it-intro',
    title: 'Introducing Yourself in Italian',
    context: 'You just arrived in Rome and meet a local for the first time. Keep it simple and friendly.',
    role_play_instructions: 'You are a friendly local. The learner introduces themselves. Respond naturally, ask 1-2 follow-up questions.',
    target_language: 'Italian',
    level: 'beginner',
    expected_vocabulary: ["name", "from", "live", "work", "hello", "nice to meet you"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of basic greetings and self-introduction.',
      grammar: 'Simple present tense, basic personal information questions.',
      vocabulary: 'Basic personal vocabulary (name, city, job, hobby).',
      fluency: 'Can the learner speak without long pauses?',
      appropriateness: 'Polite greeting appropriate for meeting someone new.',
    },
  },

  {
    id: 'it-ordering',
    title: 'Ordering at a Restaurant',
    context: 'You walk into a local restaurant and order a meal. Keep it simple and friendly.',
    role_play_instructions: 'You are a waiter. Greet the customer, take their order, ask if they want anything else.',
    target_language: 'Italian',
    level: 'beginner',
    expected_vocabulary: ["please", "thank you", "menu", "water", "coffee", "bill"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of food/drink names and polite phrases.',
      grammar: 'Basic request forms ("I would like...", "Can I have...").',
      vocabulary: 'Food/drink vocabulary, polite request words.',
      fluency: 'Can the learner order in one turn without long hesitation?',
      appropriateness: 'Polite tone appropriate for restaurant setting.',
    },
  },

  {
    id: 'it-directions',
    title: 'Asking for Directions',
    context: 'You are lost in Rome and need to find a famous landmark. Keep it simple and friendly.',
    role_play_instructions: 'You are a local. Give clear, simple directions using basic prepositions.',
    target_language: 'Italian',
    level: 'beginner',
    expected_vocabulary: ["left", "right", "straight", "stop", "street", "corner"],
    evaluation_rubric: {
      pronunciation: 'Clear directional words and numbers.',
      grammar: 'Imperative directions, question forms ("Where is...?").',
      vocabulary: 'Directional vocabulary and spatial prepositions.',
      fluency: 'Can the learner ask and repeat back directions?',
      appropriateness: 'Polite question form, clear acknowledgment.',
    },
  },

  // ==================================================
  // ITALIAN — INTERMEDIATE
  // ==================================================
  {
    id: 'it-restaurant',
    title: 'Dining at a Restaurant',
    context: 'You are at a sit-down restaurant. Order a meal, ask about ingredients, and handle the check.',
    role_play_instructions: 'You are a server. Welcome the table, take the order, answer questions about the menu, and bring the check.',
    target_language: 'Italian',
    level: 'intermediate',
    expected_vocabulary: ["appetizer", "main course", "dessert", "allergy", "recommend", "check", "tip"],
    evaluation_rubric: {
      pronunciation: 'Connected speech, clear intonation in questions.',
      grammar: 'Modal verbs ("could I have...", "would you recommend..."), indirect questions.',
      vocabulary: 'Restaurant-specific vocabulary, ability to ask about ingredients.',
      fluency: 'Can the learner handle a multi-turn exchange smoothly?',
      appropriateness: 'Polite register for restaurant setting.',
    },
  },

  {
    id: 'it-travel',
    title: 'Planning a Trip',
    context: 'You are at a travel agency planning a vacation. Discuss destinations, budget, and preferences.',
    role_play_instructions: 'You are a travel agent. Ask about preferences, suggest 2-3 options, and help narrow down.',
    target_language: 'Italian',
    level: 'intermediate',
    expected_vocabulary: ["destination", "budget", "flight", "hotel", "activity", "sightseeing", "relax"],
    evaluation_rubric: {
      pronunciation: 'Intonation in questions and suggestions, clear numbers.',
      grammar: 'Conditional ("if you like..."), comparatives ("this is cheaper than..."), future plans.',
      vocabulary: 'Travel planning vocabulary, ability to express preferences.',
      fluency: 'Can the learner discuss preferences at length?',
      appropriateness: 'Polite persuasive tone, appropriate for service interaction.',
    },
  },

  // ==================================================
  // ITALIAN — ADVANCED
  // ==================================================
  {
    id: 'it-debate',
    title: 'Debate: Modern Life',
    context: 'You are in a discussion about a topic relevant to modern life and society.',
    role_play_instructions: 'You take the opposite position. Present 2-3 arguments, respond to the learner\'s points, and challenge them respectfully.',
    target_language: 'Italian',
    level: 'advanced',
    expected_vocabulary: ["productivity", "community", "tradition", "modern", "balance", "perspective"],
    evaluation_rubric: {
      pronunciation: 'Nuanced intonation for emphasis, stress on key words.',
      grammar: 'Complex sentence structures, hedging ("it could be argued that..."), conditionals.',
      vocabulary: 'Abstract vocabulary, ability to express nuanced positions.',
      fluency: 'Can the learner sustain a complex argument across multiple turns?',
      appropriateness: 'Debate etiquette — respectful disagreement, acknowledging counterpoints.',
    },
  },

  // ==================================================
  // GERMAN — BEGINNER
  // ==================================================
  {
    id: 'de-intro',
    title: 'Introducing Yourself in German',
    context: 'You just arrived in Berlin and meet a local for the first time. Keep it simple and friendly.',
    role_play_instructions: 'You are a friendly local. The learner introduces themselves. Respond naturally, ask 1-2 follow-up questions.',
    target_language: 'German',
    level: 'beginner',
    expected_vocabulary: ["name", "from", "live", "work", "hello", "nice to meet you"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of basic greetings and self-introduction.',
      grammar: 'Simple present tense, basic personal information questions.',
      vocabulary: 'Basic personal vocabulary (name, city, job, hobby).',
      fluency: 'Can the learner speak without long pauses?',
      appropriateness: 'Polite greeting appropriate for meeting someone new.',
    },
  },

  {
    id: 'de-ordering',
    title: 'Ordering at a Restaurant',
    context: 'You walk into a local restaurant and order a meal. Keep it simple and friendly.',
    role_play_instructions: 'You are a waiter. Greet the customer, take their order, ask if they want anything else.',
    target_language: 'German',
    level: 'beginner',
    expected_vocabulary: ["please", "thank you", "menu", "water", "coffee", "bill"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of food/drink names and polite phrases.',
      grammar: 'Basic request forms ("I would like...", "Can I have...").',
      vocabulary: 'Food/drink vocabulary, polite request words.',
      fluency: 'Can the learner order in one turn without long hesitation?',
      appropriateness: 'Polite tone appropriate for restaurant setting.',
    },
  },

  {
    id: 'de-directions',
    title: 'Asking for Directions',
    context: 'You are lost in Berlin and need to find a famous landmark. Keep it simple and friendly.',
    role_play_instructions: 'You are a local. Give clear, simple directions using basic prepositions.',
    target_language: 'German',
    level: 'beginner',
    expected_vocabulary: ["left", "right", "straight", "stop", "street", "corner"],
    evaluation_rubric: {
      pronunciation: 'Clear directional words and numbers.',
      grammar: 'Imperative directions, question forms ("Where is...?").',
      vocabulary: 'Directional vocabulary and spatial prepositions.',
      fluency: 'Can the learner ask and repeat back directions?',
      appropriateness: 'Polite question form, clear acknowledgment.',
    },
  },

  // ==================================================
  // GERMAN — INTERMEDIATE
  // ==================================================
  {
    id: 'de-restaurant',
    title: 'Dining at a Restaurant',
    context: 'You are at a sit-down restaurant. Order a meal, ask about ingredients, and handle the check.',
    role_play_instructions: 'You are a server. Welcome the table, take the order, answer questions about the menu, and bring the check.',
    target_language: 'German',
    level: 'intermediate',
    expected_vocabulary: ["appetizer", "main course", "dessert", "allergy", "recommend", "check", "tip"],
    evaluation_rubric: {
      pronunciation: 'Connected speech, clear intonation in questions.',
      grammar: 'Modal verbs ("could I have...", "would you recommend..."), indirect questions.',
      vocabulary: 'Restaurant-specific vocabulary, ability to ask about ingredients.',
      fluency: 'Can the learner handle a multi-turn exchange smoothly?',
      appropriateness: 'Polite register for restaurant setting.',
    },
  },

  {
    id: 'de-travel',
    title: 'Planning a Trip',
    context: 'You are at a travel agency planning a vacation. Discuss destinations, budget, and preferences.',
    role_play_instructions: 'You are a travel agent. Ask about preferences, suggest 2-3 options, and help narrow down.',
    target_language: 'German',
    level: 'intermediate',
    expected_vocabulary: ["destination", "budget", "flight", "hotel", "activity", "sightseeing", "relax"],
    evaluation_rubric: {
      pronunciation: 'Intonation in questions and suggestions, clear numbers.',
      grammar: 'Conditional ("if you like..."), comparatives ("this is cheaper than..."), future plans.',
      vocabulary: 'Travel planning vocabulary, ability to express preferences.',
      fluency: 'Can the learner discuss preferences at length?',
      appropriateness: 'Polite persuasive tone, appropriate for service interaction.',
    },
  },

  // ==================================================
  // GERMAN — ADVANCED
  // ==================================================
  {
    id: 'de-debate',
    title: 'Debate: Modern Life',
    context: 'You are in a discussion about a topic relevant to modern life and society.',
    role_play_instructions: 'You take the opposite position. Present 2-3 arguments, respond to the learner\'s points, and challenge them respectfully.',
    target_language: 'German',
    level: 'advanced',
    expected_vocabulary: ["productivity", "community", "tradition", "modern", "balance", "perspective"],
    evaluation_rubric: {
      pronunciation: 'Nuanced intonation for emphasis, stress on key words.',
      grammar: 'Complex sentence structures, hedging ("it could be argued that..."), conditionals.',
      vocabulary: 'Abstract vocabulary, ability to express nuanced positions.',
      fluency: 'Can the learner sustain a complex argument across multiple turns?',
      appropriateness: 'Debate etiquette — respectful disagreement, acknowledging counterpoints.',
    },
  },

  // ==================================================
  // JAPANESE — BEGINNER
  // ==================================================
  {
    id: 'ja-intro',
    title: 'Introducing Yourself in Japanese',
    context: 'You just arrived in Tokyo and meet a local for the first time. Keep it simple and friendly.',
    role_play_instructions: 'You are a friendly local. The learner introduces themselves. Respond naturally, ask 1-2 follow-up questions.',
    target_language: 'Japanese',
    level: 'beginner',
    expected_vocabulary: ["name", "from", "live", "work", "hello", "nice to meet you"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of basic greetings and self-introduction.',
      grammar: 'Simple present tense, basic personal information questions.',
      vocabulary: 'Basic personal vocabulary (name, city, job, hobby).',
      fluency: 'Can the learner speak without long pauses?',
      appropriateness: 'Polite greeting appropriate for meeting someone new.',
    },
  },

  {
    id: 'ja-ordering',
    title: 'Ordering at a Restaurant',
    context: 'You walk into a local restaurant and order a meal. Keep it simple and friendly.',
    role_play_instructions: 'You are a waiter. Greet the customer, take their order, ask if they want anything else.',
    target_language: 'Japanese',
    level: 'beginner',
    expected_vocabulary: ["please", "thank you", "menu", "water", "coffee", "bill"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of food/drink names and polite phrases.',
      grammar: 'Basic request forms ("I would like...", "Can I have...").',
      vocabulary: 'Food/drink vocabulary, polite request words.',
      fluency: 'Can the learner order in one turn without long hesitation?',
      appropriateness: 'Polite tone appropriate for restaurant setting.',
    },
  },

  {
    id: 'ja-directions',
    title: 'Asking for Directions',
    context: 'You are lost in Tokyo and need to find a famous landmark. Keep it simple and friendly.',
    role_play_instructions: 'You are a local. Give clear, simple directions using basic prepositions.',
    target_language: 'Japanese',
    level: 'beginner',
    expected_vocabulary: ["left", "right", "straight", "stop", "street", "corner"],
    evaluation_rubric: {
      pronunciation: 'Clear directional words and numbers.',
      grammar: 'Imperative directions, question forms ("Where is...?").',
      vocabulary: 'Directional vocabulary and spatial prepositions.',
      fluency: 'Can the learner ask and repeat back directions?',
      appropriateness: 'Polite question form, clear acknowledgment.',
    },
  },

  // ==================================================
  // JAPANESE — INTERMEDIATE
  // ==================================================
  {
    id: 'ja-restaurant',
    title: 'Dining at a Restaurant',
    context: 'You are at a sit-down restaurant. Order a meal, ask about ingredients, and handle the check.',
    role_play_instructions: 'You are a server. Welcome the table, take the order, answer questions about the menu, and bring the check.',
    target_language: 'Japanese',
    level: 'intermediate',
    expected_vocabulary: ["appetizer", "main course", "dessert", "allergy", "recommend", "check", "tip"],
    evaluation_rubric: {
      pronunciation: 'Connected speech, clear intonation in questions.',
      grammar: 'Modal verbs ("could I have...", "would you recommend..."), indirect questions.',
      vocabulary: 'Restaurant-specific vocabulary, ability to ask about ingredients.',
      fluency: 'Can the learner handle a multi-turn exchange smoothly?',
      appropriateness: 'Polite register for restaurant setting.',
    },
  },

  {
    id: 'ja-travel',
    title: 'Planning a Trip',
    context: 'You are at a travel agency planning a vacation. Discuss destinations, budget, and preferences.',
    role_play_instructions: 'You are a travel agent. Ask about preferences, suggest 2-3 options, and help narrow down.',
    target_language: 'Japanese',
    level: 'intermediate',
    expected_vocabulary: ["destination", "budget", "flight", "hotel", "activity", "sightseeing", "relax"],
    evaluation_rubric: {
      pronunciation: 'Intonation in questions and suggestions, clear numbers.',
      grammar: 'Conditional ("if you like..."), comparatives ("this is cheaper than..."), future plans.',
      vocabulary: 'Travel planning vocabulary, ability to express preferences.',
      fluency: 'Can the learner discuss preferences at length?',
      appropriateness: 'Polite persuasive tone, appropriate for service interaction.',
    },
  },

  // ==================================================
  // JAPANESE — ADVANCED
  // ==================================================
  {
    id: 'ja-debate',
    title: 'Debate: Modern Life',
    context: 'You are in a discussion about a topic relevant to modern life and society.',
    role_play_instructions: 'You take the opposite position. Present 2-3 arguments, respond to the learner\'s points, and challenge them respectfully.',
    target_language: 'Japanese',
    level: 'advanced',
    expected_vocabulary: ["productivity", "community", "tradition", "modern", "balance", "perspective"],
    evaluation_rubric: {
      pronunciation: 'Nuanced intonation for emphasis, stress on key words.',
      grammar: 'Complex sentence structures, hedging ("it could be argued that..."), conditionals.',
      vocabulary: 'Abstract vocabulary, ability to express nuanced positions.',
      fluency: 'Can the learner sustain a complex argument across multiple turns?',
      appropriateness: 'Debate etiquette — respectful disagreement, acknowledging counterpoints.',
    },
  },

  // ==================================================
  // PORTUGUESE — BEGINNER
  // ==================================================
  {
    id: 'pt-intro',
    title: 'Introducing Yourself in Portuguese',
    context: 'You just arrived in Lisbon and meet a local for the first time. Keep it simple and friendly.',
    role_play_instructions: 'You are a friendly local. The learner introduces themselves. Respond naturally, ask 1-2 follow-up questions.',
    target_language: 'Portuguese',
    level: 'beginner',
    expected_vocabulary: ["name", "from", "live", "work", "hello", "nice to meet you"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of basic greetings and self-introduction.',
      grammar: 'Simple present tense, basic personal information questions.',
      vocabulary: 'Basic personal vocabulary (name, city, job, hobby).',
      fluency: 'Can the learner speak without long pauses?',
      appropriateness: 'Polite greeting appropriate for meeting someone new.',
    },
  },

  {
    id: 'pt-ordering',
    title: 'Ordering at a Restaurant',
    context: 'You walk into a local restaurant and order a meal. Keep it simple and friendly.',
    role_play_instructions: 'You are a waiter. Greet the customer, take their order, ask if they want anything else.',
    target_language: 'Portuguese',
    level: 'beginner',
    expected_vocabulary: ["please", "thank you", "menu", "water", "coffee", "bill"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of food/drink names and polite phrases.',
      grammar: 'Basic request forms ("I would like...", "Can I have...").',
      vocabulary: 'Food/drink vocabulary, polite request words.',
      fluency: 'Can the learner order in one turn without long hesitation?',
      appropriateness: 'Polite tone appropriate for restaurant setting.',
    },
  },

  {
    id: 'pt-directions',
    title: 'Asking for Directions',
    context: 'You are lost in Lisbon and need to find a famous landmark. Keep it simple and friendly.',
    role_play_instructions: 'You are a local. Give clear, simple directions using basic prepositions.',
    target_language: 'Portuguese',
    level: 'beginner',
    expected_vocabulary: ["left", "right", "straight", "stop", "street", "corner"],
    evaluation_rubric: {
      pronunciation: 'Clear directional words and numbers.',
      grammar: 'Imperative directions, question forms ("Where is...?").',
      vocabulary: 'Directional vocabulary and spatial prepositions.',
      fluency: 'Can the learner ask and repeat back directions?',
      appropriateness: 'Polite question form, clear acknowledgment.',
    },
  },

  // ==================================================
  // PORTUGUESE — INTERMEDIATE
  // ==================================================
  {
    id: 'pt-restaurant',
    title: 'Dining at a Restaurant',
    context: 'You are at a sit-down restaurant. Order a meal, ask about ingredients, and handle the check.',
    role_play_instructions: 'You are a server. Welcome the table, take the order, answer questions about the menu, and bring the check.',
    target_language: 'Portuguese',
    level: 'intermediate',
    expected_vocabulary: ["appetizer", "main course", "dessert", "allergy", "recommend", "check", "tip"],
    evaluation_rubric: {
      pronunciation: 'Connected speech, clear intonation in questions.',
      grammar: 'Modal verbs ("could I have...", "would you recommend..."), indirect questions.',
      vocabulary: 'Restaurant-specific vocabulary, ability to ask about ingredients.',
      fluency: 'Can the learner handle a multi-turn exchange smoothly?',
      appropriateness: 'Polite register for restaurant setting.',
    },
  },

  {
    id: 'pt-travel',
    title: 'Planning a Trip',
    context: 'You are at a travel agency planning a vacation. Discuss destinations, budget, and preferences.',
    role_play_instructions: 'You are a travel agent. Ask about preferences, suggest 2-3 options, and help narrow down.',
    target_language: 'Portuguese',
    level: 'intermediate',
    expected_vocabulary: ["destination", "budget", "flight", "hotel", "activity", "sightseeing", "relax"],
    evaluation_rubric: {
      pronunciation: 'Intonation in questions and suggestions, clear numbers.',
      grammar: 'Conditional ("if you like..."), comparatives ("this is cheaper than..."), future plans.',
      vocabulary: 'Travel planning vocabulary, ability to express preferences.',
      fluency: 'Can the learner discuss preferences at length?',
      appropriateness: 'Polite persuasive tone, appropriate for service interaction.',
    },
  },

  // ==================================================
  // PORTUGUESE — ADVANCED
  // ==================================================
  {
    id: 'pt-debate',
    title: 'Debate: Modern Life',
    context: 'You are in a discussion about a topic relevant to modern life and society.',
    role_play_instructions: 'You take the opposite position. Present 2-3 arguments, respond to the learner\'s points, and challenge them respectfully.',
    target_language: 'Portuguese',
    level: 'advanced',
    expected_vocabulary: ["productivity", "community", "tradition", "modern", "balance", "perspective"],
    evaluation_rubric: {
      pronunciation: 'Nuanced intonation for emphasis, stress on key words.',
      grammar: 'Complex sentence structures, hedging ("it could be argued that..."), conditionals.',
      vocabulary: 'Abstract vocabulary, ability to express nuanced positions.',
      fluency: 'Can the learner sustain a complex argument across multiple turns?',
      appropriateness: 'Debate etiquette — respectful disagreement, acknowledging counterpoints.',
    },
  },

  // ==================================================
  // CHINESE — BEGINNER
  // ==================================================
  {
    id: 'zh-intro',
    title: 'Introducing Yourself in Chinese',
    context: 'You just arrived in Shanghai and meet a local for the first time. Keep it simple and friendly.',
    role_play_instructions: 'You are a friendly local. The learner introduces themselves. Respond naturally, ask 1-2 follow-up questions.',
    target_language: 'Chinese',
    level: 'beginner',
    expected_vocabulary: ["name", "from", "live", "work", "hello", "nice to meet you"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of basic greetings and self-introduction.',
      grammar: 'Simple present tense, basic personal information questions.',
      vocabulary: 'Basic personal vocabulary (name, city, job, hobby).',
      fluency: 'Can the learner speak without long pauses?',
      appropriateness: 'Polite greeting appropriate for meeting someone new.',
    },
  },

  {
    id: 'zh-ordering',
    title: 'Ordering at a Restaurant',
    context: 'You walk into a local restaurant and order a meal. Keep it simple and friendly.',
    role_play_instructions: 'You are a waiter. Greet the customer, take their order, ask if they want anything else.',
    target_language: 'Chinese',
    level: 'beginner',
    expected_vocabulary: ["please", "thank you", "menu", "water", "coffee", "bill"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of food/drink names and polite phrases.',
      grammar: 'Basic request forms ("I would like...", "Can I have...").',
      vocabulary: 'Food/drink vocabulary, polite request words.',
      fluency: 'Can the learner order in one turn without long hesitation?',
      appropriateness: 'Polite tone appropriate for restaurant setting.',
    },
  },

  {
    id: 'zh-directions',
    title: 'Asking for Directions',
    context: 'You are lost in Shanghai and need to find a famous landmark. Keep it simple and friendly.',
    role_play_instructions: 'You are a local. Give clear, simple directions using basic prepositions.',
    target_language: 'Chinese',
    level: 'beginner',
    expected_vocabulary: ["left", "right", "straight", "stop", "street", "corner"],
    evaluation_rubric: {
      pronunciation: 'Clear directional words and numbers.',
      grammar: 'Imperative directions, question forms ("Where is...?").',
      vocabulary: 'Directional vocabulary and spatial prepositions.',
      fluency: 'Can the learner ask and repeat back directions?',
      appropriateness: 'Polite question form, clear acknowledgment.',
    },
  },

  // ==================================================
  // CHINESE — INTERMEDIATE
  // ==================================================
  {
    id: 'zh-restaurant',
    title: 'Dining at a Restaurant',
    context: 'You are at a sit-down restaurant. Order a meal, ask about ingredients, and handle the check.',
    role_play_instructions: 'You are a server. Welcome the table, take the order, answer questions about the menu, and bring the check.',
    target_language: 'Chinese',
    level: 'intermediate',
    expected_vocabulary: ["appetizer", "main course", "dessert", "allergy", "recommend", "check", "tip"],
    evaluation_rubric: {
      pronunciation: 'Connected speech, clear intonation in questions.',
      grammar: 'Modal verbs ("could I have...", "would you recommend..."), indirect questions.',
      vocabulary: 'Restaurant-specific vocabulary, ability to ask about ingredients.',
      fluency: 'Can the learner handle a multi-turn exchange smoothly?',
      appropriateness: 'Polite register for restaurant setting.',
    },
  },

  {
    id: 'zh-travel',
    title: 'Planning a Trip',
    context: 'You are at a travel agency planning a vacation. Discuss destinations, budget, and preferences.',
    role_play_instructions: 'You are a travel agent. Ask about preferences, suggest 2-3 options, and help narrow down.',
    target_language: 'Chinese',
    level: 'intermediate',
    expected_vocabulary: ["destination", "budget", "flight", "hotel", "activity", "sightseeing", "relax"],
    evaluation_rubric: {
      pronunciation: 'Intonation in questions and suggestions, clear numbers.',
      grammar: 'Conditional ("if you like..."), comparatives ("this is cheaper than..."), future plans.',
      vocabulary: 'Travel planning vocabulary, ability to express preferences.',
      fluency: 'Can the learner discuss preferences at length?',
      appropriateness: 'Polite persuasive tone, appropriate for service interaction.',
    },
  },

  // ==================================================
  // CHINESE — ADVANCED
  // ==================================================
  {
    id: 'zh-debate',
    title: 'Debate: Modern Life',
    context: 'You are in a discussion about a topic relevant to modern life and society.',
    role_play_instructions: 'You take the opposite position. Present 2-3 arguments, respond to the learner\'s points, and challenge them respectfully.',
    target_language: 'Chinese',
    level: 'advanced',
    expected_vocabulary: ["productivity", "community", "tradition", "modern", "balance", "perspective"],
    evaluation_rubric: {
      pronunciation: 'Nuanced intonation for emphasis, stress on key words.',
      grammar: 'Complex sentence structures, hedging ("it could be argued that..."), conditionals.',
      vocabulary: 'Abstract vocabulary, ability to express nuanced positions.',
      fluency: 'Can the learner sustain a complex argument across multiple turns?',
      appropriateness: 'Debate etiquette — respectful disagreement, acknowledging counterpoints.',
    },
  },

  // ==================================================
  // ARABIC — BEGINNER
  // ==================================================
  {
    id: 'ar-intro',
    title: 'Introducing Yourself in Arabic',
    context: 'You just arrived in Cairo and meet a local for the first time. Keep it simple and friendly.',
    role_play_instructions: 'You are a friendly local. The learner introduces themselves. Respond naturally, ask 1-2 follow-up questions.',
    target_language: 'Arabic',
    level: 'beginner',
    expected_vocabulary: ["name", "from", "live", "work", "hello", "nice to meet you"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of basic greetings and self-introduction.',
      grammar: 'Simple present tense, basic personal information questions.',
      vocabulary: 'Basic personal vocabulary (name, city, job, hobby).',
      fluency: 'Can the learner speak without long pauses?',
      appropriateness: 'Polite greeting appropriate for meeting someone new.',
    },
  },

  {
    id: 'ar-ordering',
    title: 'Ordering at a Restaurant',
    context: 'You walk into a local restaurant and order a meal. Keep it simple and friendly.',
    role_play_instructions: 'You are a waiter. Greet the customer, take their order, ask if they want anything else.',
    target_language: 'Arabic',
    level: 'beginner',
    expected_vocabulary: ["please", "thank you", "menu", "water", "coffee", "bill"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of food/drink names and polite phrases.',
      grammar: 'Basic request forms ("I would like...", "Can I have...").',
      vocabulary: 'Food/drink vocabulary, polite request words.',
      fluency: 'Can the learner order in one turn without long hesitation?',
      appropriateness: 'Polite tone appropriate for restaurant setting.',
    },
  },

  {
    id: 'ar-directions',
    title: 'Asking for Directions',
    context: 'You are lost in Cairo and need to find a famous landmark. Keep it simple and friendly.',
    role_play_instructions: 'You are a local. Give clear, simple directions using basic prepositions.',
    target_language: 'Arabic',
    level: 'beginner',
    expected_vocabulary: ["left", "right", "straight", "stop", "street", "corner"],
    evaluation_rubric: {
      pronunciation: 'Clear directional words and numbers.',
      grammar: 'Imperative directions, question forms ("Where is...?").',
      vocabulary: 'Directional vocabulary and spatial prepositions.',
      fluency: 'Can the learner ask and repeat back directions?',
      appropriateness: 'Polite question form, clear acknowledgment.',
    },
  },

  // ==================================================
  // ARABIC — INTERMEDIATE
  // ==================================================
  {
    id: 'ar-restaurant',
    title: 'Dining at a Restaurant',
    context: 'You are at a sit-down restaurant. Order a meal, ask about ingredients, and handle the check.',
    role_play_instructions: 'You are a server. Welcome the table, take the order, answer questions about the menu, and bring the check.',
    target_language: 'Arabic',
    level: 'intermediate',
    expected_vocabulary: ["appetizer", "main course", "dessert", "allergy", "recommend", "check", "tip"],
    evaluation_rubric: {
      pronunciation: 'Connected speech, clear intonation in questions.',
      grammar: 'Modal verbs ("could I have...", "would you recommend..."), indirect questions.',
      vocabulary: 'Restaurant-specific vocabulary, ability to ask about ingredients.',
      fluency: 'Can the learner handle a multi-turn exchange smoothly?',
      appropriateness: 'Polite register for restaurant setting.',
    },
  },

  {
    id: 'ar-travel',
    title: 'Planning a Trip',
    context: 'You are at a travel agency planning a vacation. Discuss destinations, budget, and preferences.',
    role_play_instructions: 'You are a travel agent. Ask about preferences, suggest 2-3 options, and help narrow down.',
    target_language: 'Arabic',
    level: 'intermediate',
    expected_vocabulary: ["destination", "budget", "flight", "hotel", "activity", "sightseeing", "relax"],
    evaluation_rubric: {
      pronunciation: 'Intonation in questions and suggestions, clear numbers.',
      grammar: 'Conditional ("if you like..."), comparatives ("this is cheaper than..."), future plans.',
      vocabulary: 'Travel planning vocabulary, ability to express preferences.',
      fluency: 'Can the learner discuss preferences at length?',
      appropriateness: 'Polite persuasive tone, appropriate for service interaction.',
    },
  },

  // ==================================================
  // ARABIC — ADVANCED
  // ==================================================
  {
    id: 'ar-debate',
    title: 'Debate: Modern Life',
    context: 'You are in a discussion about a topic relevant to modern life and society.',
    role_play_instructions: 'You take the opposite position. Present 2-3 arguments, respond to the learner\'s points, and challenge them respectfully.',
    target_language: 'Arabic',
    level: 'advanced',
    expected_vocabulary: ["productivity", "community", "tradition", "modern", "balance", "perspective"],
    evaluation_rubric: {
      pronunciation: 'Nuanced intonation for emphasis, stress on key words.',
      grammar: 'Complex sentence structures, hedging ("it could be argued that..."), conditionals.',
      vocabulary: 'Abstract vocabulary, ability to express nuanced positions.',
      fluency: 'Can the learner sustain a complex argument across multiple turns?',
      appropriateness: 'Debate etiquette — respectful disagreement, acknowledging counterpoints.',
    },
  },

  // ==================================================
  // RUSSIAN — BEGINNER
  // ==================================================
  {
    id: 'ru-intro',
    title: 'Introducing Yourself in Russian',
    context: 'You just arrived in Moscow and meet a local for the first time. Keep it simple and friendly.',
    role_play_instructions: 'You are a friendly local. The learner introduces themselves. Respond naturally, ask 1-2 follow-up questions.',
    target_language: 'Russian',
    level: 'beginner',
    expected_vocabulary: ["name", "from", "live", "work", "hello", "nice to meet you"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of basic greetings and self-introduction.',
      grammar: 'Simple present tense, basic personal information questions.',
      vocabulary: 'Basic personal vocabulary (name, city, job, hobby).',
      fluency: 'Can the learner speak without long pauses?',
      appropriateness: 'Polite greeting appropriate for meeting someone new.',
    },
  },

  {
    id: 'ru-ordering',
    title: 'Ordering at a Restaurant',
    context: 'You walk into a local restaurant and order a meal. Keep it simple and friendly.',
    role_play_instructions: 'You are a waiter. Greet the customer, take their order, ask if they want anything else.',
    target_language: 'Russian',
    level: 'beginner',
    expected_vocabulary: ["please", "thank you", "menu", "water", "coffee", "bill"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of food/drink names and polite phrases.',
      grammar: 'Basic request forms ("I would like...", "Can I have...").',
      vocabulary: 'Food/drink vocabulary, polite request words.',
      fluency: 'Can the learner order in one turn without long hesitation?',
      appropriateness: 'Polite tone appropriate for restaurant setting.',
    },
  },

  {
    id: 'ru-directions',
    title: 'Asking for Directions',
    context: 'You are lost in Moscow and need to find a famous landmark. Keep it simple and friendly.',
    role_play_instructions: 'You are a local. Give clear, simple directions using basic prepositions.',
    target_language: 'Russian',
    level: 'beginner',
    expected_vocabulary: ["left", "right", "straight", "stop", "street", "corner"],
    evaluation_rubric: {
      pronunciation: 'Clear directional words and numbers.',
      grammar: 'Imperative directions, question forms ("Where is...?").',
      vocabulary: 'Directional vocabulary and spatial prepositions.',
      fluency: 'Can the learner ask and repeat back directions?',
      appropriateness: 'Polite question form, clear acknowledgment.',
    },
  },

  // ==================================================
  // RUSSIAN — INTERMEDIATE
  // ==================================================
  {
    id: 'ru-restaurant',
    title: 'Dining at a Restaurant',
    context: 'You are at a sit-down restaurant. Order a meal, ask about ingredients, and handle the check.',
    role_play_instructions: 'You are a server. Welcome the table, take the order, answer questions about the menu, and bring the check.',
    target_language: 'Russian',
    level: 'intermediate',
    expected_vocabulary: ["appetizer", "main course", "dessert", "allergy", "recommend", "check", "tip"],
    evaluation_rubric: {
      pronunciation: 'Connected speech, clear intonation in questions.',
      grammar: 'Modal verbs ("could I have...", "would you recommend..."), indirect questions.',
      vocabulary: 'Restaurant-specific vocabulary, ability to ask about ingredients.',
      fluency: 'Can the learner handle a multi-turn exchange smoothly?',
      appropriateness: 'Polite register for restaurant setting.',
    },
  },

  {
    id: 'ru-travel',
    title: 'Planning a Trip',
    context: 'You are at a travel agency planning a vacation. Discuss destinations, budget, and preferences.',
    role_play_instructions: 'You are a travel agent. Ask about preferences, suggest 2-3 options, and help narrow down.',
    target_language: 'Russian',
    level: 'intermediate',
    expected_vocabulary: ["destination", "budget", "flight", "hotel", "activity", "sightseeing", "relax"],
    evaluation_rubric: {
      pronunciation: 'Intonation in questions and suggestions, clear numbers.',
      grammar: 'Conditional ("if you like..."), comparatives ("this is cheaper than..."), future plans.',
      vocabulary: 'Travel planning vocabulary, ability to express preferences.',
      fluency: 'Can the learner discuss preferences at length?',
      appropriateness: 'Polite persuasive tone, appropriate for service interaction.',
    },
  },

  // ==================================================
  // RUSSIAN — ADVANCED
  // ==================================================
  {
    id: 'ru-debate',
    title: 'Debate: Modern Life',
    context: 'You are in a discussion about a topic relevant to modern life and society.',
    role_play_instructions: 'You take the opposite position. Present 2-3 arguments, respond to the learner\'s points, and challenge them respectfully.',
    target_language: 'Russian',
    level: 'advanced',
    expected_vocabulary: ["productivity", "community", "tradition", "modern", "balance", "perspective"],
    evaluation_rubric: {
      pronunciation: 'Nuanced intonation for emphasis, stress on key words.',
      grammar: 'Complex sentence structures, hedging ("it could be argued that..."), conditionals.',
      vocabulary: 'Abstract vocabulary, ability to express nuanced positions.',
      fluency: 'Can the learner sustain a complex argument across multiple turns?',
      appropriateness: 'Debate etiquette — respectful disagreement, acknowledging counterpoints.',
    },
  },

  // ==================================================
  // TURKISH — BEGINNER
  // ==================================================
  {
    id: 'tr-intro',
    title: 'Introducing Yourself in Turkish',
    context: 'You just arrived in Istanbul and meet a local for the first time. Keep it simple and friendly.',
    role_play_instructions: 'You are a friendly local. The learner introduces themselves. Respond naturally, ask 1-2 follow-up questions.',
    target_language: 'Turkish',
    level: 'beginner',
    expected_vocabulary: ["name", "from", "live", "work", "hello", "nice to meet you"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of basic greetings and self-introduction.',
      grammar: 'Simple present tense, basic personal information questions.',
      vocabulary: 'Basic personal vocabulary (name, city, job, hobby).',
      fluency: 'Can the learner speak without long pauses?',
      appropriateness: 'Polite greeting appropriate for meeting someone new.',
    },
  },

  {
    id: 'tr-ordering',
    title: 'Ordering at a Restaurant',
    context: 'You walk into a local restaurant and order a meal. Keep it simple and friendly.',
    role_play_instructions: 'You are a waiter. Greet the customer, take their order, ask if they want anything else.',
    target_language: 'Turkish',
    level: 'beginner',
    expected_vocabulary: ["please", "thank you", "menu", "water", "coffee", "bill"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of food/drink names and polite phrases.',
      grammar: 'Basic request forms ("I would like...", "Can I have...").',
      vocabulary: 'Food/drink vocabulary, polite request words.',
      fluency: 'Can the learner order in one turn without long hesitation?',
      appropriateness: 'Polite tone appropriate for restaurant setting.',
    },
  },

  {
    id: 'tr-directions',
    title: 'Asking for Directions',
    context: 'You are lost in Istanbul and need to find a famous landmark. Keep it simple and friendly.',
    role_play_instructions: 'You are a local. Give clear, simple directions using basic prepositions.',
    target_language: 'Turkish',
    level: 'beginner',
    expected_vocabulary: ["left", "right", "straight", "stop", "street", "corner"],
    evaluation_rubric: {
      pronunciation: 'Clear directional words and numbers.',
      grammar: 'Imperative directions, question forms ("Where is...?").',
      vocabulary: 'Directional vocabulary and spatial prepositions.',
      fluency: 'Can the learner ask and repeat back directions?',
      appropriateness: 'Polite question form, clear acknowledgment.',
    },
  },

  // ==================================================
  // TURKISH — INTERMEDIATE
  // ==================================================
  {
    id: 'tr-restaurant',
    title: 'Dining at a Restaurant',
    context: 'You are at a sit-down restaurant. Order a meal, ask about ingredients, and handle the check.',
    role_play_instructions: 'You are a server. Welcome the table, take the order, answer questions about the menu, and bring the check.',
    target_language: 'Turkish',
    level: 'intermediate',
    expected_vocabulary: ["appetizer", "main course", "dessert", "allergy", "recommend", "check", "tip"],
    evaluation_rubric: {
      pronunciation: 'Connected speech, clear intonation in questions.',
      grammar: 'Modal verbs ("could I have...", "would you recommend..."), indirect questions.',
      vocabulary: 'Restaurant-specific vocabulary, ability to ask about ingredients.',
      fluency: 'Can the learner handle a multi-turn exchange smoothly?',
      appropriateness: 'Polite register for restaurant setting.',
    },
  },

  {
    id: 'tr-travel',
    title: 'Planning a Trip',
    context: 'You are at a travel agency planning a vacation. Discuss destinations, budget, and preferences.',
    role_play_instructions: 'You are a travel agent. Ask about preferences, suggest 2-3 options, and help narrow down.',
    target_language: 'Turkish',
    level: 'intermediate',
    expected_vocabulary: ["destination", "budget", "flight", "hotel", "activity", "sightseeing", "relax"],
    evaluation_rubric: {
      pronunciation: 'Intonation in questions and suggestions, clear numbers.',
      grammar: 'Conditional ("if you like..."), comparatives ("this is cheaper than..."), future plans.',
      vocabulary: 'Travel planning vocabulary, ability to express preferences.',
      fluency: 'Can the learner discuss preferences at length?',
      appropriateness: 'Polite persuasive tone, appropriate for service interaction.',
    },
  },

  // ==================================================
  // TURKISH — ADVANCED
  // ==================================================
  {
    id: 'tr-debate',
    title: 'Debate: Modern Life',
    context: 'You are in a discussion about a topic relevant to modern life and society.',
    role_play_instructions: 'You take the opposite position. Present 2-3 arguments, respond to the learner\'s points, and challenge them respectfully.',
    target_language: 'Turkish',
    level: 'advanced',
    expected_vocabulary: ["productivity", "community", "tradition", "modern", "balance", "perspective"],
    evaluation_rubric: {
      pronunciation: 'Nuanced intonation for emphasis, stress on key words.',
      grammar: 'Complex sentence structures, hedging ("it could be argued that..."), conditionals.',
      vocabulary: 'Abstract vocabulary, ability to express nuanced positions.',
      fluency: 'Can the learner sustain a complex argument across multiple turns?',
      appropriateness: 'Debate etiquette — respectful disagreement, acknowledging counterpoints.',
    },
  },

  // ==================================================
  // KOREAN — BEGINNER
  // ==================================================
  {
    id: 'ko-intro',
    title: 'Introducing Yourself in Korean',
    context: 'You just arrived in Seoul and meet a local for the first time. Keep it simple and friendly.',
    role_play_instructions: 'You are a friendly local. The learner introduces themselves. Respond naturally, ask 1-2 follow-up questions.',
    target_language: 'Korean',
    level: 'beginner',
    expected_vocabulary: ["name", "from", "live", "work", "hello", "nice to meet you"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of basic greetings and self-introduction.',
      grammar: 'Simple present tense, basic personal information questions.',
      vocabulary: 'Basic personal vocabulary (name, city, job, hobby).',
      fluency: 'Can the learner speak without long pauses?',
      appropriateness: 'Polite greeting appropriate for meeting someone new.',
    },
  },

  {
    id: 'ko-ordering',
    title: 'Ordering at a Restaurant',
    context: 'You walk into a local restaurant and order a meal. Keep it simple and friendly.',
    role_play_instructions: 'You are a waiter. Greet the customer, take their order, ask if they want anything else.',
    target_language: 'Korean',
    level: 'beginner',
    expected_vocabulary: ["please", "thank you", "menu", "water", "coffee", "bill"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of food/drink names and polite phrases.',
      grammar: 'Basic request forms ("I would like...", "Can I have...").',
      vocabulary: 'Food/drink vocabulary, polite request words.',
      fluency: 'Can the learner order in one turn without long hesitation?',
      appropriateness: 'Polite tone appropriate for restaurant setting.',
    },
  },

  {
    id: 'ko-directions',
    title: 'Asking for Directions',
    context: 'You are lost in Seoul and need to find a famous landmark. Keep it simple and friendly.',
    role_play_instructions: 'You are a local. Give clear, simple directions using basic prepositions.',
    target_language: 'Korean',
    level: 'beginner',
    expected_vocabulary: ["left", "right", "straight", "stop", "street", "corner"],
    evaluation_rubric: {
      pronunciation: 'Clear directional words and numbers.',
      grammar: 'Imperative directions, question forms ("Where is...?").',
      vocabulary: 'Directional vocabulary and spatial prepositions.',
      fluency: 'Can the learner ask and repeat back directions?',
      appropriateness: 'Polite question form, clear acknowledgment.',
    },
  },

  // ==================================================
  // KOREAN — INTERMEDIATE
  // ==================================================
  {
    id: 'ko-restaurant',
    title: 'Dining at a Restaurant',
    context: 'You are at a sit-down restaurant. Order a meal, ask about ingredients, and handle the check.',
    role_play_instructions: 'You are a server. Welcome the table, take the order, answer questions about the menu, and bring the check.',
    target_language: 'Korean',
    level: 'intermediate',
    expected_vocabulary: ["appetizer", "main course", "dessert", "allergy", "recommend", "check", "tip"],
    evaluation_rubric: {
      pronunciation: 'Connected speech, clear intonation in questions.',
      grammar: 'Modal verbs ("could I have...", "would you recommend..."), indirect questions.',
      vocabulary: 'Restaurant-specific vocabulary, ability to ask about ingredients.',
      fluency: 'Can the learner handle a multi-turn exchange smoothly?',
      appropriateness: 'Polite register for restaurant setting.',
    },
  },

  {
    id: 'ko-travel',
    title: 'Planning a Trip',
    context: 'You are at a travel agency planning a vacation. Discuss destinations, budget, and preferences.',
    role_play_instructions: 'You are a travel agent. Ask about preferences, suggest 2-3 options, and help narrow down.',
    target_language: 'Korean',
    level: 'intermediate',
    expected_vocabulary: ["destination", "budget", "flight", "hotel", "activity", "sightseeing", "relax"],
    evaluation_rubric: {
      pronunciation: 'Intonation in questions and suggestions, clear numbers.',
      grammar: 'Conditional ("if you like..."), comparatives ("this is cheaper than..."), future plans.',
      vocabulary: 'Travel planning vocabulary, ability to express preferences.',
      fluency: 'Can the learner discuss preferences at length?',
      appropriateness: 'Polite persuasive tone, appropriate for service interaction.',
    },
  },

  // ==================================================
  // KOREAN — ADVANCED
  // ==================================================
  {
    id: 'ko-debate',
    title: 'Debate: Modern Life',
    context: 'You are in a discussion about a topic relevant to modern life and society.',
    role_play_instructions: 'You take the opposite position. Present 2-3 arguments, respond to the learner\'s points, and challenge them respectfully.',
    target_language: 'Korean',
    level: 'advanced',
    expected_vocabulary: ["productivity", "community", "tradition", "modern", "balance", "perspective"],
    evaluation_rubric: {
      pronunciation: 'Nuanced intonation for emphasis, stress on key words.',
      grammar: 'Complex sentence structures, hedging ("it could be argued that..."), conditionals.',
      vocabulary: 'Abstract vocabulary, ability to express nuanced positions.',
      fluency: 'Can the learner sustain a complex argument across multiple turns?',
      appropriateness: 'Debate etiquette — respectful disagreement, acknowledging counterpoints.',
    },
  },

  // ==================================================
  // HINDI — BEGINNER
  // ==================================================
  {
    id: 'hi-intro',
    title: 'Introducing Yourself in Hindi',
    context: 'You just arrived in Mumbai and meet a local for the first time. Keep it simple and friendly.',
    role_play_instructions: 'You are a friendly local. The learner introduces themselves. Respond naturally, ask 1-2 follow-up questions.',
    target_language: 'Hindi',
    level: 'beginner',
    expected_vocabulary: ["name", "from", "live", "work", "hello", "nice to meet you"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of basic greetings and self-introduction.',
      grammar: 'Simple present tense, basic personal information questions.',
      vocabulary: 'Basic personal vocabulary (name, city, job, hobby).',
      fluency: 'Can the learner speak without long pauses?',
      appropriateness: 'Polite greeting appropriate for meeting someone new.',
    },
  },

  {
    id: 'hi-ordering',
    title: 'Ordering at a Restaurant',
    context: 'You walk into a local restaurant and order a meal. Keep it simple and friendly.',
    role_play_instructions: 'You are a waiter. Greet the customer, take their order, ask if they want anything else.',
    target_language: 'Hindi',
    level: 'beginner',
    expected_vocabulary: ["please", "thank you", "menu", "water", "coffee", "bill"],
    evaluation_rubric: {
      pronunciation: 'Clear pronunciation of food/drink names and polite phrases.',
      grammar: 'Basic request forms ("I would like...", "Can I have...").',
      vocabulary: 'Food/drink vocabulary, polite request words.',
      fluency: 'Can the learner order in one turn without long hesitation?',
      appropriateness: 'Polite tone appropriate for restaurant setting.',
    },
  },

  {
    id: 'hi-directions',
    title: 'Asking for Directions',
    context: 'You are lost in Mumbai and need to find a famous landmark. Keep it simple and friendly.',
    role_play_instructions: 'You are a local. Give clear, simple directions using basic prepositions.',
    target_language: 'Hindi',
    level: 'beginner',
    expected_vocabulary: ["left", "right", "straight", "stop", "street", "corner"],
    evaluation_rubric: {
      pronunciation: 'Clear directional words and numbers.',
      grammar: 'Imperative directions, question forms ("Where is...?").',
      vocabulary: 'Directional vocabulary and spatial prepositions.',
      fluency: 'Can the learner ask and repeat back directions?',
      appropriateness: 'Polite question form, clear acknowledgment.',
    },
  },

  // ==================================================
  // HINDI — INTERMEDIATE
  // ==================================================
  {
    id: 'hi-restaurant',
    title: 'Dining at a Restaurant',
    context: 'You are at a sit-down restaurant. Order a meal, ask about ingredients, and handle the check.',
    role_play_instructions: 'You are a server. Welcome the table, take the order, answer questions about the menu, and bring the check.',
    target_language: 'Hindi',
    level: 'intermediate',
    expected_vocabulary: ["appetizer", "main course", "dessert", "allergy", "recommend", "check", "tip"],
    evaluation_rubric: {
      pronunciation: 'Connected speech, clear intonation in questions.',
      grammar: 'Modal verbs ("could I have...", "would you recommend..."), indirect questions.',
      vocabulary: 'Restaurant-specific vocabulary, ability to ask about ingredients.',
      fluency: 'Can the learner handle a multi-turn exchange smoothly?',
      appropriateness: 'Polite register for restaurant setting.',
    },
  },

  {
    id: 'hi-travel',
    title: 'Planning a Trip',
    context: 'You are at a travel agency planning a vacation. Discuss destinations, budget, and preferences.',
    role_play_instructions: 'You are a travel agent. Ask about preferences, suggest 2-3 options, and help narrow down.',
    target_language: 'Hindi',
    level: 'intermediate',
    expected_vocabulary: ["destination", "budget", "flight", "hotel", "activity", "sightseeing", "relax"],
    evaluation_rubric: {
      pronunciation: 'Intonation in questions and suggestions, clear numbers.',
      grammar: 'Conditional ("if you like..."), comparatives ("this is cheaper than..."), future plans.',
      vocabulary: 'Travel planning vocabulary, ability to express preferences.',
      fluency: 'Can the learner discuss preferences at length?',
      appropriateness: 'Polite persuasive tone, appropriate for service interaction.',
    },
  },

  // ==================================================
  // HINDI — ADVANCED
  // ==================================================
  {
    id: 'hi-debate',
    title: 'Debate: Modern Life',
    context: 'You are in a discussion about a topic relevant to modern life and society.',
    role_play_instructions: 'You take the opposite position. Present 2-3 arguments, respond to the learner\'s points, and challenge them respectfully.',
    target_language: 'Hindi',
    level: 'advanced',
    expected_vocabulary: ["productivity", "community", "tradition", "modern", "balance", "perspective"],
    evaluation_rubric: {
      pronunciation: 'Nuanced intonation for emphasis, stress on key words.',
      grammar: 'Complex sentence structures, hedging ("it could be argued that..."), conditionals.',
      vocabulary: 'Abstract vocabulary, ability to express nuanced positions.',
      fluency: 'Can the learner sustain a complex argument across multiple turns?',
      appropriateness: 'Debate etiquette — respectful disagreement, acknowledging counterpoints.',
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
