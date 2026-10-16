import type { ClaudeRuntime } from '../types/claude-runtime';

/** Le runtime claude.ai n'existe que dans la version en ligne (Artifact). */
export function runtime(): ClaudeRuntime | null {
  return typeof window !== 'undefined' && window.claude && typeof window.claude.use === 'function' ? window.claude : null;
}

export const isOnline = (): boolean => runtime() !== null;
