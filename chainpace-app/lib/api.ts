const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface ApiUser {
  id: number;
  username: string;
  email?: string | null;
  phone?: string | null;
  walletAddress?: string | null;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include", // send/receive the httpOnly session cookie
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error || "Something went wrong", res.status);
  }

  return data as T;
}

/* ---------------- Auth endpoints ---------------- */

export function signup(payload: {
  username: string;
  email?: string;
  phone?: string;
  password: string;
}) {
  return apiFetch<{ user: ApiUser }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: { identifier: string; password: string }) {
  return apiFetch<{ user: ApiUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function walletAuth(payload: { walletAddress: string; username?: string }) {
  return apiFetch<{
    user?: ApiUser;
    isNew: boolean;
    requiresUsername?: boolean;
  }>("/api/auth/wallet", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function checkUsername(username: string): Promise<boolean> {
  const data = await apiFetch<{ available: boolean }>(
    `/api/auth/check-username?username=${encodeURIComponent(username)}`
  );
  return data.available;
}

export function me() {
  return apiFetch<{ user: ApiUser }>("/api/auth/me");
}

export function logout() {
  return apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
}

export { ApiError };
