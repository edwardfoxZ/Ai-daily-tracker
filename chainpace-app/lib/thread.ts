async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || "Request failed");
  return data as T;
}

export function threadLink(withId: number) {
  return apiFetch<{ path: string; id: number; sig: string }>(`/api/thread-link?with=${withId}`);
}

export function threadOpen(id: number, sig: string) {
  return apiFetch<{ peer: { id: number; username: string }; kind: string }>(
    `/api/thread-open?id=${id}&sig=${encodeURIComponent(sig)}`,
  );
}
