const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
  return match && match[1] ? match[1] : null;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Cannot reach the API at ${API_BASE}. Start the backend (port 4000) and refresh.`
    );
  }

  if (res.status === 401) {
    // Token expired — redirect to login
    if (typeof window !== "undefined") {
      document.cookie = "access_token=; path=/; max-age=0";
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
  }

  if (!res.ok) {
    const err = data.error;
    const message =
      (typeof err === "string" && err) ||
      (typeof err === "object" && err !== null && "message" in err && String((err as { message: string }).message)) ||
      (typeof data.detail === "object" && data.detail !== null && "error" in (data.detail as object)
        ? String((data.detail as { error: { message?: string } }).error?.message || (data.detail as { error: string }).error)
        : null) ||
      (typeof data.detail === "string" ? data.detail : null) ||
      (res.status === 404 ? `API route not found: ${endpoint}` : null) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}
