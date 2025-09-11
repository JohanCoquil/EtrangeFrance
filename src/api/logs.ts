import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDb } from '@/data/db';

export async function addLogEntry({
  url,
  method,
  request,
  response,
  success,
}: {
  url: string;
  method: string;
  request: any;
  response: any;
  success: boolean;
}) {
  const db = getDb();
  await db.runAsync(
    'INSERT INTO log (date, url, method, request_json, response_json, success) VALUES (?, ?, ?, ?, ?, ?)',
    [
      new Date().toISOString(),
      url,
      method,
      JSON.stringify(request ?? null),
      JSON.stringify(response ?? null),
      success ? 1 : 0,
    ],
  );
}

export function useLogs() {
  return useQuery({
    queryKey: ['logs'],
    queryFn: async () => {
      const db = getDb();
      return await db.getAllAsync('SELECT * FROM log ORDER BY date DESC');
    },
  });
}

export function useClearLogs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const db = getDb();
      await db.execAsync('DELETE FROM log');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
}
