/**
 * Sous-ensemble typé du runtime claude.ai, présent uniquement quand l'application
 * est ouverte comme Artifact. En local (`npm run dev`), `window.claude` est absent.
 */
export interface McpError {
  code: string;
  server?: string;
  message: string;
  retryable?: boolean;
  retryAfterMs?: number;
}

export interface McpCallResult {
  content: unknown[];
  structuredContent?: unknown;
  payload?: unknown;
}

export interface McpServerInfo {
  server: string;
  authStatus: string;
  tools: { name: string }[];
}

export interface McpNamespace {
  callTool(server: string, tool: string, input?: unknown): Promise<McpCallResult>;
  listTools(server?: string): Promise<{ servers: McpServerInfo[] }>;
}

export interface DbDocSnapshot {
  exists: boolean;
  data(): Record<string, unknown> | undefined;
}

export interface DbDocRef {
  get(): Promise<DbDocSnapshot>;
  set(data: Record<string, unknown>): Promise<void>;
}

export interface DbNamespace {
  doc(path: string): DbDocRef;
}

export interface UserNamespace {
  id(): Promise<string | null>;
}

export interface PermissionsNamespace {
  state(name: string): Promise<string>;
  manage(): Promise<void>;
}

export interface ClaudeRuntime {
  use(name: 'mcp'): Promise<McpNamespace | null>;
  use(name: 'db'): Promise<DbNamespace | null>;
  use(name: 'user'): Promise<UserNamespace | null>;
  use(name: 'permissions'): Promise<PermissionsNamespace | null>;
}

declare global {
  interface Window {
    claude?: ClaudeRuntime;
  }
}
