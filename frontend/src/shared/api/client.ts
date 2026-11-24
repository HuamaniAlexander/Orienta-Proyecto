import { useCallback, useEffect, useState } from "react";
const BASE = (
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000"
).replace(/\/$/, "");
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      typeof body?.detail === "string"
        ? body.detail
        : "No pudimos completar la consulta. Intenta nuevamente.",
      response.status,
    );
  }
  return response.json() as Promise<T>;
}
export function useApi<T>(path: string, load = api<T>) {
  const [state, setState] = useState<{
    data?: T;
    loading: boolean;
    error?: string;
    status?: number;
  }>({ loading: true });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    load(path, { signal: controller.signal }).then(
      (data) => {
        if (!controller.signal.aborted) setState({ data, loading: false });
      },
      (error) => {
        if (!controller.signal.aborted)
          setState({
            loading: false,
            status: error instanceof ApiError ? error.status : undefined,
            error:
              error instanceof Error
                ? error.message
                : "No pudimos conectar con ORIENTA.",
          });
      },
    );
    return () => controller.abort();
  }, [path, attempt, load]);
  return { ...state, retry };
}
