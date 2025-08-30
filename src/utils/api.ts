export function logApiCall(url: string, method: string, body?: any) {
  if (body !== undefined) {
    console.log(`[API] ${method} ${url}`, body);
  } else {
    console.log(`[API] ${method} ${url}`);
  }
}

export async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const method = options.method ?? "GET";
  let body: any = options.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      // body is not JSON
    }
  }
  logApiCall(url, method, body);
  return fetch(url, options);
}

export function extractRecordId(data: any): string | undefined {
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return extractRecordId(parsed);
    } catch {
      const match = data.match(/[0-9a-fA-F-]{8,}/);
      return match ? match[0] : undefined;
    }
  }
  if (typeof data === "number") {
    return String(data);
  }
  const id =
    data?.id ??
    data?.distant_id ??
    data?.record?.id ??
    data?.record?.distant_id ??
    data?.records?.id ??
    data?.records?.distant_id ??
    data?.data?.id ??
    data?.data?.distant_id ??
    data?.[0]?.id ??
    data?.[0]?.distant_id ??
    data?.records?.[0]?.id ??
    data?.records?.[0]?.distant_id;
  if (id === undefined) return undefined;
  return String(id);
}
