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

export function extractRecordId(data: any): number | undefined {
  if (typeof data === "number" || typeof data === "string") {
    const digits = String(data).replace(/\D+/g, "");
    const num = Number(digits);
    return Number.isNaN(num) ? undefined : num;
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
  const digits = String(id).replace(/\D+/g, "");
  const num = Number(digits);
  return Number.isNaN(num) ? undefined : num;
}
