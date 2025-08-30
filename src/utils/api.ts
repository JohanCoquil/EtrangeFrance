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
  if (typeof json === "number" || typeof json === "string") {
    const num = Number(json);
    return Number.isNaN(num) ? undefined : num;
  }
  const id =
    json?.id ??
    json?.distant_id ??
    json?.record?.id ??
    json?.record?.distant_id ??
    json?.records?.id ??
    json?.records?.distant_id ??
    json?.data?.id ??
    json?.data?.distant_id ??
    json?.[0]?.id ??
    json?.[0]?.distant_id ??
    json?.records?.[0]?.id ??
    json?.records?.[0]?.distant_id;
  return id !== undefined ? Number(id) : undefined;
}
