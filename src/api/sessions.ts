import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/utils/api';
import { addLogEntry } from './logs';
import type { 
  SessionRecord, 
  SessionWithDetails, 
  CreateSessionInput, 
  UpdateSessionInput,
  SessionParticipant,
  SessionPresence 
} from '@/types/session';

// Fonction utilitaire pour formater les dates au format MySQL
function formatDateForMySQL(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// Récupérer les sessions d'une partie
export function useSessionsByParty(partieId: number) {
  return useQuery({
    queryKey: ['sessions', 'by-party', partieId],
    queryFn: async (): Promise<SessionRecord[]> => {
      const response = await apiFetch(
        `https://api.scriptonautes.net/api/records/sessions?filter=partie_id,eq,${partieId}&order=created_at,desc`
      );

      if (!response.ok) {
        const errorText = await response.text();
        await addLogEntry({
          url: `sessions?filter=partie_id,eq,${partieId}`,
          method: 'GET',
          request: { partieId },
          response: errorText,
          success: false,
        });
        throw new Error(errorText || 'Impossible de récupérer les sessions');
      }

      const data = await response.json();
      await addLogEntry({
        url: `sessions?filter=partie_id,eq,${partieId}`,
        method: 'GET',
        request: { partieId },
        response: data,
        success: true,
      });

      return data.records || [];
    },
    enabled: !!partieId,
  });
}

// Récupérer une session avec ses détails
export function useSessionDetails(sessionId: number) {
  return useQuery({
    queryKey: ['sessions', 'details', sessionId],
    queryFn: async (): Promise<SessionWithDetails | null> => {
      const response = await apiFetch(
        `https://api.scriptonautes.net/api/records/sessions/${sessionId}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        await addLogEntry({
          url: `sessions/${sessionId}`,
          method: 'GET',
          request: { sessionId },
          response: errorText,
          success: false,
        });
        throw new Error(errorText || 'Impossible de récupérer la session');
      }

      const session = await response.json();
      await addLogEntry({
        url: `sessions/${sessionId}`,
        method: 'GET',
        request: { sessionId },
        response: session,
        success: true,
      });

      // Récupérer les participants de la session
      const participantsResponse = await apiFetch(
        `https://api.scriptonautes.net/api/records/session_participants?filter=session_id,eq,${sessionId}`
      );

      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        session.participants = participantsData.records || [];
        session.online_count = session.participants.filter((p: SessionParticipant) => p.is_online).length;
        session.total_participants = session.participants.length;
      }

      return session;
    },
    enabled: !!sessionId,
  });
}

// Créer une nouvelle session
export function useCreateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateSessionInput): Promise<SessionRecord> => {
      // S'assurer que le statut est défini et formater les dates
      const sessionData = {
        ...input,
        status: input.status || 'scheduled'
      };

      // Formater les dates au format MySQL
      if (sessionData.scheduled_date) {
        sessionData.scheduled_date = formatDateForMySQL(sessionData.scheduled_date);
      }
      if (sessionData.started_at) {
        sessionData.started_at = formatDateForMySQL(sessionData.started_at);
      }
      if (sessionData.ended_at) {
        sessionData.ended_at = formatDateForMySQL(sessionData.ended_at);
      }

      const response = await apiFetch(
        'https://api.scriptonautes.net/api/records/sessions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        await addLogEntry({
          url: 'sessions',
          method: 'POST',
          request: sessionData,
          response: errorText,
          success: false,
        });
        throw new Error(errorText || 'Impossible de créer la session');
      }

      const newSession = await response.json();
      await addLogEntry({
        url: 'sessions',
        method: 'POST',
        request: sessionData,
        response: newSession,
        success: true,
      });

      return newSession;
    },
    onSuccess: (data) => {
      // Invalider les caches des sessions pour cette partie
      queryClient.invalidateQueries({ queryKey: ['sessions', 'by-party', data.partie_id] });
      // Invalider aussi toutes les requêtes de sessions pour être sûr
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

// Mettre à jour une session
export function useUpdateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sessionId, 
      updates 
    }: { 
      sessionId: number; 
      updates: UpdateSessionInput 
    }): Promise<SessionRecord> => {
      // Formater les dates au format MySQL
      const formattedUpdates = { ...updates };
      if (formattedUpdates.scheduled_date) {
        formattedUpdates.scheduled_date = formatDateForMySQL(formattedUpdates.scheduled_date);
      }
      if (formattedUpdates.started_at) {
        formattedUpdates.started_at = formatDateForMySQL(formattedUpdates.started_at);
      }
      if (formattedUpdates.ended_at) {
        formattedUpdates.ended_at = formatDateForMySQL(formattedUpdates.ended_at);
      }

      const response = await apiFetch(
        `https://api.scriptonautes.net/api/records/sessions/${sessionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedUpdates),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        await addLogEntry({
          url: `sessions/${sessionId}`,
          method: 'PUT',
          request: formattedUpdates,
          response: errorText,
          success: false,
        });
        throw new Error(errorText || 'Impossible de mettre à jour la session');
      }

      const updatedSession = await response.json();
      await addLogEntry({
        url: `sessions/${sessionId}`,
        method: 'PUT',
        request: formattedUpdates,
        response: updatedSession,
        success: true,
      });

      return updatedSession;
    },
    onSuccess: (data) => {
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ['sessions', 'by-party', data.partie_id] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'details', data.id] });
      // Invalider aussi toutes les requêtes de sessions pour être sûr
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

// Rejoindre une session
export function useJoinSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      userId,
      characterId,
      role
    }: {
      sessionId: number | string;
      userId: number;
      characterId?: string | number | null;
      role?: SessionParticipant['role'];
    }): Promise<SessionParticipant> => {
      const normalizedSessionId =
        typeof sessionId === 'number'
          ? sessionId
          : (() => {
              const sessionIdString = String(sessionId);
              const trimmed = sessionIdString.trim();
              return trimmed.length > 0 ? trimmed : sessionIdString;
            })();

      const normalizedCharacterId =
        characterId !== undefined && characterId !== null && String(characterId).trim().length > 0
          ? String(characterId)
          : null;

      const payload = {
        session_id: normalizedSessionId,
        user_id: userId,
        character_id: normalizedCharacterId,
        role: role ?? (normalizedCharacterId ? 'player' : 'master'),
        is_online: true,
        last_seen: formatDateForMySQL(new Date()),
        joined_at: formatDateForMySQL(new Date()),
      };

      const response = await apiFetch(
        'https://api.scriptonautes.net/api/records/session_participants',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        await addLogEntry({
          url: 'session_participants',
          method: 'POST',
          request: payload,
          response: errorText,
          success: false,
        });
        throw new Error(errorText || 'Impossible de rejoindre la session');
      }

      const participant = await response.json();
      console.log('Participant created:', participant);
      console.log('Join session data:', payload);

      await addLogEntry({
        url: 'session_participants',
        method: 'POST',
        request: payload,
        response: participant,
        success: true,
      });

      return participant;
    },
    onSuccess: (data) => {
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ['sessions', 'details', data.session_id] });
    },
  });
}

// Quitter une session
export function useLeaveSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sessionId, 
      userId 
    }: { 
      sessionId: number; 
      userId: number 
    }): Promise<void> => {
      // Récupérer d'abord l'ID du participant
      // Note: Le filtre avec 'and' ne fonctionne pas correctement, on filtre côté client
      const participantsResponse = await apiFetch(
        `https://api.scriptonautes.net/api/records/session_participants?filter=session_id,eq,${sessionId}`
      );

      if (!participantsResponse.ok) {
        throw new Error('Impossible de trouver la participation');
      }

      const participantsData = await participantsResponse.json();
      console.log('Participants data:', participantsData);
      console.log('Looking for sessionId:', sessionId, 'userId:', userId);
      console.log('Response status:', participantsResponse.status);
      console.log('Response headers:', participantsResponse.headers);
      
      // Filtrer côté client pour trouver le bon participant
      const participant = participantsData.records?.find((p: any) => p.user_id === userId);

      if (!participant) {
        console.error('No participant found for sessionId:', sessionId, 'userId:', userId);
        console.error('Available participants:', participantsData.records);
        console.error('Full response:', participantsData);
        throw new Error('Participation non trouvée');
      }

      // Mettre à jour la participation pour marquer comme déconnecté
      const response = await apiFetch(
        `https://api.scriptonautes.net/api/records/session_participants/${participant.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_online: false,
            left_at: formatDateForMySQL(new Date()),
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        await addLogEntry({
          url: `session_participants/${participant.id}`,
          method: 'PUT',
          request: { is_online: false, left_at: formatDateForMySQL(new Date()) },
          response: errorText,
          success: false,
        });
        throw new Error(errorText || 'Impossible de quitter la session');
      }

      await addLogEntry({
        url: `session_participants/${participant.id}`,
        method: 'PUT',
        request: { is_online: false, left_at: formatDateForMySQL(new Date()) },
        response: await response.json(),
        success: true,
      });
    },
    onSuccess: (_, variables) => {
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ['sessions', 'details', variables.sessionId] });
    },
  });
}

// Mettre à jour la présence (heartbeat)
export function useUpdatePresence() {
  return useMutation({
    mutationFn: async ({ 
      sessionId, 
      userId 
    }: { 
      sessionId: number; 
      userId: number 
    }): Promise<void> => {
      // Récupérer d'abord l'ID du participant
      const participantsResponse = await apiFetch(
        `https://api.scriptonautes.net/api/records/session_participants?filter=session_id,eq,${sessionId};and,user_id,eq,${userId}`
      );

      if (!participantsResponse.ok) {
        return; // Silencieux pour les heartbeats
      }

      const participantsData = await participantsResponse.json();
      const participant = participantsData.records?.[0];

      if (!participant) {
        return; // Silencieux pour les heartbeats
      }

      // Mettre à jour le last_seen
      await apiFetch(
        `https://api.scriptonautes.net/api/records/session_participants/${participant.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            last_seen: formatDateForMySQL(new Date()),
          }),
        }
      );
    },
  });
}
