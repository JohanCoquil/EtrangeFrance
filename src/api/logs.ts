import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDb } from '@/data/db';
import { queryClient } from '@/api/queryClient';

export type LogEntry = {
  id: number;
  date: string;
  url: string;
  method: string;
  request_json: string | null;
  response_json: string | null;
  success: number; // 0 ou 1
};

export type LogEntryInput = {
  url: string;
  method: string;
  request: any;
  response: any;
  success: boolean;
};

export async function addLogEntry({
  url,
  method,
  request,
  response,
  success,
}: LogEntryInput) {
  const db = getDb();
  
  // Insérer le nouveau log
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

  // Limiter à 250 enregistrements maximum
  await db.runAsync(`
    DELETE FROM log 
    WHERE id NOT IN (
      SELECT id FROM log 
      ORDER BY date DESC 
      LIMIT 250
    )
  `);

  queryClient.invalidateQueries({ queryKey: ['logs'] });
}

export function useLogs(endpointFilter?: string, failuresOnly?: boolean) {
  return useQuery({
    queryKey: ['logs', endpointFilter, failuresOnly],
    queryFn: async () => {
      const db = getDb();
      let query = 'SELECT * FROM log';
      let params: any[] = [];
      let conditions: string[] = [];
      
      if (endpointFilter && endpointFilter.trim()) {
        conditions.push('url LIKE ?');
        params.push(`%${endpointFilter.trim()}%`);
      }
      
      if (failuresOnly) {
        conditions.push('success = 0');
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY date DESC';
      
      return await db.getAllAsync(query, params) as LogEntry[];
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
