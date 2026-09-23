const raw = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const isBrowserLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const API_URL =
  !raw || raw.includes("localhost") || raw.includes("127.0.0.1")
    ? isBrowserLocal || typeof window === "undefined"
      ? ""
      : raw.includes("localhost")
        ? ""
        : raw
    : raw;

export interface ApiUser {
  id: number;
  username: string;
  email?: string | null;
  phone?: string | null;
  walletAddress?: string | null;
  bio?: string;
}

export interface ApiMessage {
  id: number;
  fromUserId: number;
  toUserId: number;
  body: string;
  createdAt: string;
}

export interface Conversation {
  peer: ApiUser;
  lastBody: string;
  lastAt: string;
  lastFromId: number;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base =
    raw && !raw.includes("localhost") && !raw.includes("127.0.0.1") ? raw : "";
  const res = await fetch(`${base}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((data as any).error || "Something went wrong", res.status);
  }
  return data as T;
}

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

export function requestOtp(email: string) {
  return apiFetch<{ ok: boolean; sent: boolean; devCode?: string; mailError?: string }>(
    "/api/auth/request-otp",
    { method: "POST", body: JSON.stringify({ email }) },
  );
}

export function verifyOtp(payload: { email: string; code: string; username?: string }) {
  return apiFetch<{ user?: ApiUser; isNew?: boolean; requiresUsername?: boolean }>(
    "/api/auth/verify-otp",
    { method: "POST", body: JSON.stringify(payload) },
  );
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
    `/api/auth/check-username?username=${encodeURIComponent(username)}`,
  );
  return data.available;
}

export function me() {
  return apiFetch<{ user: ApiUser | null }>("/api/auth/me");
}

export function logout() {
  return apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
}

export function updateMe(payload: { username?: string; bio?: string }) {
  return apiFetch<{ user: ApiUser }>("/api/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function linkWallet(walletAddress: string) {
  return apiFetch<{ user: ApiUser }>("/api/me/wallet", {
    method: "POST",
    body: JSON.stringify({ walletAddress }),
  });
}

export function getSettings() {
  return apiFetch<{ allowAnyoneMessage: boolean }>("/api/me/settings");
}

export function updateSettings(allowAnyoneMessage: boolean) {
  return apiFetch<{ allowAnyoneMessage: boolean }>("/api/me/settings", {
    method: "PATCH",
    body: JSON.stringify({ allowAnyoneMessage }),
  });
}

export function recordFriend(payload: { userId?: number; walletAddress?: string }) {
  return apiFetch<{ ok: boolean }>("/api/friends", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function searchUsers(q: string) {
  return apiFetch<{ users: ApiUser[] }>(`/api/users/search?q=${encodeURIComponent(q)}`);
}

export function userByWallet(address: string) {
  return apiFetch<{ user: ApiUser }>(`/api/users/by-wallet?address=${encodeURIComponent(address)}`);
}

export function listMessages(withUserId: number) {
  return apiFetch<{ messages: ApiMessage[] }>(`/api/messages?with=${withUserId}`);
}

export function sendMessage(toUserId: number, body: string) {
  return apiFetch<{ message: ApiMessage }>("/api/messages", {
    method: "POST",
    body: JSON.stringify({ toUserId, body }),
  });
}

export function listConversations() {
  return apiFetch<{ conversations: Conversation[] }>("/api/conversations");
}

export interface AgentCTA {
  id: number;
  kind: string;
  label: string;
  payload?: string;
  status?: string;
}

export interface AgentChatMessage {
  id: number;
  role: "user" | "assistant";
  body: string;
  state?: string;
  cta?: AgentCTA | null;
  createdAt: string;
}

export interface AgentRoutine {
  id: number;
  name: string;
  trigger: string;
  timeWindow: string;
  habitsText: string;
}

export function agentThread() {
  return apiFetch<{ messages: AgentChatMessage[] }>("/api/agent/thread");
}

export function agentChat(message: string) {
  return apiFetch<{ message: AgentChatMessage; state: string; cta?: AgentCTA | null }>(
    "/api/agent/chat",
    { method: "POST", body: JSON.stringify({ message }) },
  );
}

export function agentEvent(payload: { habitName: string; status: string; note?: string }) {
  return apiFetch<{ ok: boolean; notify: boolean; state: string; message?: AgentChatMessage }>(
    "/api/agent/event",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function agentCta(id: number, accept: boolean) {
  return apiFetch<{ ok: boolean; message: AgentChatMessage; accepted: boolean }>(
    "/api/agent/cta",
    { method: "POST", body: JSON.stringify({ id, accept }) },
  );
}

export function agentProfile() {
  return apiFetch<{
    state: string;
    routines: AgentRoutine[];
    memories: { id: number; kind: string; text: string }[];
  }>("/api/agent/profile");
}

export { ApiError };
