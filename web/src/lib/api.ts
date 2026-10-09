// Client de l'API Navigoal pour les composants navigateur.
export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string, public fields?: { path: string; message: string }[]) {
    super(message);
  }
}

const url = (path: string) => `/api${path.startsWith("/") ? path : `/${path}`}`.replace(/\/?(\?|$)/, "/$1");

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const res = await fetch(url(path), {
    method: init.method ?? (init.body || init.form ? "POST" : "GET"),
    headers: init.form ? undefined : init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
    credentials: "same-origin",
  });
  const type = res.headers.get("content-type") ?? "";
  const data = type.includes("json") ? await res.json() : await res.text();
  if (!res.ok) {
    const e = (data as { error?: { message: string; code: string; fields?: { path: string; message: string }[] } }).error;
    throw new ApiError(e?.message ?? "Une erreur est survenue.", res.status, e?.code ?? "erreur", e?.fields);
  }
  return data as T;
}

export const apiUrl = url;
