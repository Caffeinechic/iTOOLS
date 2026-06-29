const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export type AuthMode = "signin" | "signup";

export interface AuthResult {
  ok: boolean;
  token?: string;
  error?: string;
}

function parseAuthError(
  err: string | { message?: string } | undefined,
  mode: AuthMode
): string {
  if (typeof err === "string") {
    if (err === "Invalid credentials") {
      return "Invalid email or password. If this is a fresh install, run seed on the backend database.";
    }
    return err;
  }
  return (
    err?.message ||
    (mode === "signin" ? "Invalid email or password." : "Registration failed.")
  );
}

export function setAccessToken(token: string): void {
  document.cookie = `access_token=${token}; path=/; max-age=900`;
}

export async function authenticateWithGoogle(credential: string): Promise<AuthResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }

  let data: { token?: string; error?: string | { message?: string } } = {};
  try {
    data = await res.json();
  } catch {
    return {
      ok: false,
      error: "Cannot reach the server. Check that the backend is running.",
    };
  }

  if (res.ok && data.token) {
    return { ok: true, token: data.token };
  }

  const err = data.error;
  return {
    ok: false,
    error: typeof err === "string" ? err : err?.message || "Google sign-in failed.",
  };
}

export async function authenticate(
  mode: AuthMode,
  payload: { email: string; password: string; name?: string }
): Promise<AuthResult> {
  const endpoint = mode === "signin" ? "/auth/login" : "/auth/register";
  const body =
    mode === "signin"
      ? { email: payload.email, password: payload.password }
      : { name: payload.name, email: payload.email, password: payload.password };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }

  let data: { token?: string; error?: string | { message?: string } } = {};
  try {
    data = await res.json();
  } catch {
    return {
      ok: false,
      error: "Cannot reach the server. Check that the backend is running.",
    };
  }

  if (res.ok && data.token) {
    return { ok: true, token: data.token };
  }

  return { ok: false, error: parseAuthError(data.error, mode) };
}

export function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
