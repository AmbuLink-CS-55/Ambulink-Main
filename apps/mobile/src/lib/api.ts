import { env } from "../../env";

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
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
  }

  return (await response.json()) as T;
}
