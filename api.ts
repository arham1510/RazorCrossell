export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = typeof payload === "object" && payload !== null && "detail" in payload ? (payload as { detail: unknown }).detail : payload;
    const message = typeof detail === "string" ? detail : typeof detail === "object" && detail !== null && "message" in detail ? String((detail as { message: unknown }).message) : "Request failed";
    throw new ApiError(response.status, message);
  }
  return payload as T;
}

export const apiGet = <T>(path: string) => request<T>(path);

export const apiPost = <T, Body>(path: string, body: Body) => request<T>(path, { method: "POST", body: JSON.stringify(body) });
