export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

const TOKEN_KEY = "auth_token"

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token)
  } else {
    window.localStorage.removeItem(TOKEN_KEY)
  }
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown
  auth?: boolean
}

export async function apiFetch<T>(
  path: string,
  { body, auth = false, headers, ...rest }: RequestOptions = {}
): Promise<T> {
  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  }

  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json"
  }

  if (auth) {
    const token = getStoredToken()
    if (token) finalHeaders.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError("Unable to reach the server", 0)
  }

  const text = await res.text()
  const data = text ? safeParse(text) : null

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : null) || `Request failed with status ${res.status}`
    throw new ApiError(message, res.status)
  }

  return data as T
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
