import AsyncStorage from '@react-native-async-storage/async-storage';
import { addLogEntry } from '@/api/logs';

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

  // Log request
  logApiCall(url, method, body);

  const res = await fetch(url, options);

  // Attempt to log response body
  try {
    const text = await res.clone().text();
    let parsed: any = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      // response is not JSON
    }
    console.log(`[API] response ${method} ${url} -> ${res.status}`, parsed);

    const debug = await AsyncStorage.getItem('debugMode');
    if (debug === 'true') {
      try {
        await addLogEntry({
          url,
          method,
          request: body,
          response: parsed,
          success: res.ok,
        });
      } catch {
        // ignore
      }
    }
  } catch (e) {
    console.log(`[API] response ${method} ${url} -> ${res.status}`);
  }

  return res;
}

export function extractRecordId(data: any): string | undefined {
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return extractRecordId(parsed);
    } catch {
      const num = parseInt(data, 10);
      if (!isNaN(num)) return String(num);
      const match = data.match(/[0-9a-fA-F-]+/);
      return match ? match[0] : undefined;
    }
  }
  if (typeof data === "number") {
    return String(data);
  }
  const id =
    data?.distant_id ??
    data?.id ??
    data?.record?.distant_id ??
    data?.record?.id ??
    data?.records?.distant_id ??
    data?.records?.id ??
    data?.data?.distant_id ??
    data?.data?.id ??
    data?.[0]?.distant_id ??
    data?.[0]?.id ??
    data?.records?.[0]?.distant_id ??
    data?.records?.[0]?.id;
  if (id === undefined) return undefined;
  return String(id);
}
