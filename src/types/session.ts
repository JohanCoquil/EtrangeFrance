export type SessionStatus = 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';

export type SessionRecord = {
  id: number;
  partie_id: number;
  name: string;
  description?: string;
  status: SessionStatus;
  scheduled_date?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  summary?: string;
  notes?: string;
};

export type SessionParticipant = {
  id: number;
  session_id: number;
  user_id: number;
  character_id?: string;
  joined_at: string;
  left_at?: string;
  is_online: boolean;
  last_seen: string;
};

export type SessionPresence = {
  id: number;
  session_id: number;
  user_id: number;
  character_id?: string;
  is_online: boolean;
  last_seen: string;
  joined_at: string;
  left_at?: string;
};

export type SessionWithDetails = SessionRecord & {
  partie?: {
    id: number;
    nom?: string;
    scenario_id?: number;
    mj_id: number;
  };
  participants?: SessionParticipant[];
  online_count?: number;
  total_participants?: number;
};

export type CreateSessionInput = {
  partie_id: number;
  name: string;
  description?: string;
  scheduled_date?: string;
  started_at?: string;
  ended_at?: string;
  status: SessionStatus;
};

export type UpdateSessionInput = {
  name?: string;
  description?: string;
  status?: SessionStatus;
  scheduled_date?: string;
  started_at?: string;
  ended_at?: string;
  summary?: string;
  notes?: string;
};