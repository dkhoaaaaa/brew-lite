
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    console.error("API ERROR:", {
      url: `${API_URL}${path}`,
      status: response.status,
      response: errorText,
    });

    throw new Error(
      `API ${response.status}: ${errorText}`
    );
  }

  return response.json() as Promise<T>;
}
