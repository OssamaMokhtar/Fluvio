// Companion client-side helpers (used by CompanionChat component)

import { CompanionSession, CompanionMessage } from '../data/library';

export const createCompanionSession = (language: string, level: string): CompanionSession => ({
  id: crypto.randomUUID(),
  language: language as any,
  level: level as 'beginner' | 'intermediate' | 'advanced',
  messages: [],
  started_at: Date.now(),
  last_active: Date.now(),
});

export const addCompanionMessage = (
  session: CompanionSession,
  role: 'user' | 'companion' | 'ai',
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

// Re-export for consumers who need the type
export type { CompanionSession, CompanionMessage };
