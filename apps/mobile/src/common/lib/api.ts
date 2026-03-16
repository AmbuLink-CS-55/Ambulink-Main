import { env } from "../../../env";
import { getAuthAccessToken } from "@/common/hooks/AuthContext";

type QueryValue = string | number | boolean | null | undefined;

export async function apiGet<T>(path: string, query?: Record<string, QueryValue>): Promise<T> {
  const url = new URL(path, env.EXPO_PUBLIC_API_SERVER_URL);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(getAuthAccessToken() ? { Authorization: `Bearer ${getAuthAccessToken()}` } : {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function apiPost<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  query?: Record<string, QueryValue>
): Promise<TResponse> {
  const url = new URL(path, env.EXPO_PUBLIC_API_SERVER_URL);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(getAuthAccessToken() ? { Authorization: `Bearer ${getAuthAccessToken()}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
  }

  if (response.status === 204) {
    return {} as TResponse;
  }

  return (await response.json()) as TResponse;
}

export async function apiPostForm<TResponse>(
  path: string,
  formData: FormData,
  query?: Record<string, QueryValue>
): Promise<TResponse> {
  const url = new URL(path, env.EXPO_PUBLIC_API_SERVER_URL);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(getAuthAccessToken() ? { Authorization: `Bearer ${getAuthAccessToken()}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
  }

  if (response.status === 204) {
    return {} as TResponse;
  }

  return (await response.json()) as TResponse;
}
