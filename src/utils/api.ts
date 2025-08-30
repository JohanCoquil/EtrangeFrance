export function logApiCall(url: string, method: string, body?: any) {
  if (body !== undefined) {
    console.log(`[API] ${method} ${url}`, body);
  } else {
    console.log(`[API] ${method} ${url}`);
  }
}

export async function apiFetch(
  url: string,
  options: RequestInit = {}
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

export function extractRecordId(json: any): number | undefined {
  const id =
    json?.id ??
    json?.record?.id ??
    json?.records?.id ??
    json?.data?.id ??
    json?.[0]?.id ??
    json?.records?.[0]?.id;
  return id !== undefined ? Number(id) : undefined;
}
