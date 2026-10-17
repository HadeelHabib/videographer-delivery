export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Reads a Zod `.flatten()` error shape ({ formErrors, fieldErrors }) and picks
// the first useful message — a schema-level formError if present, otherwise
// the first field-level error (e.g. "password: String must contain at least
// 4 character(s)"), instead of silently dropping field errors.
function extractZodMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const flat = error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
  if (flat.formErrors?.[0]) return flat.formErrors[0];
  const firstField = Object.entries(flat.fieldErrors ?? {}).find(([, msgs]) => msgs?.length);
  if (firstField) return `${firstField[0]}: ${firstField[1][0]}`;
  return null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const message = typeof data?.error === "string" ? data.error : extractZodMessage(data?.error);
    throw new ApiError(message ?? res.statusText ?? "Request failed", res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  postBinary: <T>(path: string, body: Blob) =>
    request<T>(path, { method: "POST", body, headers: { "Content-Type": body.type || "application/octet-stream" } }),
};
