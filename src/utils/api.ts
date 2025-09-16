import AsyncStorage from '@react-native-async-storage/async-storage';
import { addLogEntry } from '@/api/logs';

export function logApiCall(url: string, method: string, body?: any) {
  if (body !== undefined) {
    console.log(`[API] ${method} ${url}`, body);
  } else {
    console.log(`[API] ${method} ${url}`);
  }
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return { error: error.message };
  }
  try {
    return { error: JSON.stringify(error) };
  } catch {
    return { error: String(error) };
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

  const debugEnabled = (await AsyncStorage.getItem("debugMode")) === "true";

  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (error) {
    console.log(`[API] response ${method} ${url} -> network error`, error);
    if (debugEnabled) {
      try {
        await addLogEntry({
          url,
          method,
          request: body,
          response: formatError(error),
          success: false,
        });
      } catch (logError) {
        console.warn("Failed to record API log entry", logError);
      }
    }
    throw error;
  }

  let parsed: any = null;
  let rawText: string | null = null;

  // Attempt to log response body
  try {
    const text = await res.clone().text();
    rawText = text;
    parsed = text;
    if (text.length > 0) {
      try {
        parsed = JSON.parse(text);
      } catch {
        // response is not JSON
      }
    } else {
      parsed = null;
    }
    console.log(`[API] response ${method} ${url} -> ${res.status}`, parsed);
  } catch (e) {
    console.log(`[API] response ${method} ${url} -> ${res.status}`);
  }

  if (debugEnabled) {
    const responseToLog = parsed ?? rawText ?? null;
    try {
      await addLogEntry({
        url,
        method,
        request: body,
        response: responseToLog,
        success: res.ok,
      });
    } catch (logError) {
      console.warn("Failed to record API log entry", logError);
    }
  }

  return res;
}

export function extractRecordId(data: any): string | undefined {
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return extractRecordId(parsed);
    } catch {
      const trimmed = data.trim();
      if (/^\d+$/.test(trimmed)) {
        return trimmed;
      }
      const match = trimmed.match(/[0-9a-fA-F-]+/);
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
