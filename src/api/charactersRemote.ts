import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/utils/api';
import { getDb } from '@/data/db';

const API_BASE_URL = 'https://api.scriptonautes.net/api/records';

export type RemoteCharacterRecord = {
  id: string;
  distant_id?: number | string;
  remote_id?: number | string;
  name: string;
  profession_name?: string | null;
  profession_id?: number | string | null;
  profession_score?: number | null;
  hobby_name?: string | null;
  hobby_id?: number | string | null;
  hobby_score?: number | null;
  voie_name?: string | null;
  voie_id?: number | string | null;
  voie_score?: number | null;
  divinity_name?: string | null;
  divinity_id?: number | string | null;
  divinity_domaine?: string | null;
  intelligence?: number | null;
  force?: number | null;
  dexterite?: number | null;
  charisme?: number | null;
  memoire?: number | null;
  volonte?: number | null;
  sante?: number | null;
  degats?: number | null;
  origines?: string | null;
  rencontres?: string | null;
  notes?: string | null;
  equipement?: string | null;
  fetiches?: string | null;
  trigger_effects?: string | null;
  bonuses?: string | null;
  avatar?: string | null;
  avatar_distant?: string | null;
  [key: string]: unknown;
};

export type RemoteCharacterDetails = {
  character: RemoteCharacterRecord;
  skills: {
    id: number | string;
    remote_id: number | string | null;
    name: string;
    level: number;
  }[];
  capacites: {
    id: number | string;
    remote_id: number | string | null;
    name: string;
    level: number;
  }[];
};

const resolveJson = async (response: Response, errorMessage: string) => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || errorMessage);
  }
  return response.json();
};

const normalizeRecord = (data: any) => {
  if (!data) return null;
  if (data.record) return data.record;
  if (Array.isArray(data.records)) {
    return data.records[0] ?? null;
  }
  return data;
};

const extractRecords = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.records)) return data.records;
  if (data.records) return [data.records];
  if (Array.isArray(data.record)) return data.record;
  if (data.record) return [data.record];
  return [data];
};

const sanitizeNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sanitizeJsonField = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

const buildAssetUrl = (value: string | null | undefined) => {
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return `https://api.scriptonautes.net/${value.replace(/^\//, '')}`;
};

const fetchSingleValue = async (
  query: string,
  params: (string | number)[],
): Promise<any | null> => {
  const db = getDb();
  const rows = (await db.getAllAsync(query, params)) as any[];
  if (rows.length === 0) {
    return null;
  }
  return rows[0];
};

const resolveProfessionName = async (remoteId: any): Promise<string | null> => {
  if (remoteId === null || remoteId === undefined) return null;
  const row = await fetchSingleValue(
    'SELECT name FROM professions WHERE distant_id = ? LIMIT 1',
    [remoteId],
  );
  return (row?.name as string | undefined) ?? null;
};

const resolveHobbyName = async (remoteId: any): Promise<string | null> => {
  if (remoteId === null || remoteId === undefined) return null;
  const row = await fetchSingleValue(
    'SELECT name FROM hobbies WHERE distant_id = ? LIMIT 1',
    [remoteId],
  );
  return (row?.name as string | undefined) ?? null;
};

const resolveVoieName = async (remoteId: any): Promise<string | null> => {
  if (remoteId === null || remoteId === undefined) return null;
  const row = await fetchSingleValue(
    'SELECT name FROM voies_etranges WHERE distant_id = ? LIMIT 1',
    [remoteId],
  );
  return (row?.name as string | undefined) ?? null;
};

const resolveDivinity = async (
  remoteId: any,
): Promise<{ name: string | null; domaine: string | null }> => {
  if (remoteId === null || remoteId === undefined) {
    return { name: null, domaine: null };
  }
  const row = await fetchSingleValue(
    'SELECT name, domaine FROM druide_divinites WHERE distant_id = ? LIMIT 1',
    [remoteId],
  );
  if (!row) {
    return { name: null, domaine: null };
  }
  return {
    name: (row?.name as string | undefined) ?? null,
    domaine: (row?.domaine as string | undefined) ?? null,
  };
};

export const fetchRemoteCharacterRecord = async (
  characterId: string | number,
): Promise<RemoteCharacterRecord> => {
  const response = await apiFetch(`${API_BASE_URL}/characters/${characterId}`);
  const data = await resolveJson(
    response,
    "Impossible de récupérer le personnage distant.",
  );
  const record = normalizeRecord(data);
  if (!record) {
    throw new Error('Personnage distant introuvable.');
  }

  const remoteId = record.id ?? record.distant_id ?? characterId;
  const professionName =
    record.profession_name ??
    record.profession ??
    (await resolveProfessionName(record.profession_id));
  const hobbyName =
    record.hobby_name ??
    record.hobby ??
    (await resolveHobbyName(record.hobby_id));
  const voieName =
    record.voie_name ??
    record.voie ??
    (await resolveVoieName(record.voie_id));
  const divinity = await resolveDivinity(record.divinity_id);

  const triggerEffects = sanitizeJsonField(record.trigger_effects);
  const bonuses = sanitizeJsonField(record.bonuses);

  const normalized: RemoteCharacterRecord = {
    ...record,
    id: String(remoteId),
    distant_id: record.distant_id ?? remoteId,
    remote_id: remoteId,
    profession_name: professionName ?? null,
    hobby_name: hobbyName ?? null,
    voie_name: voieName ?? null,
    divinity_name: record.divinity_name ?? divinity.name ?? null,
    divinity_domaine:
      record.divinity_domaine ?? record.divinity_domain ?? divinity.domaine ?? null,
    intelligence: sanitizeNumber(record.intelligence, 1),
    force: sanitizeNumber(record.force, 1),
    dexterite: sanitizeNumber(record.dexterite, 1),
    charisme: sanitizeNumber(record.charisme, 1),
    memoire: sanitizeNumber(record.memoire, 1),
    volonte: sanitizeNumber(record.volonte, 1),
    sante: sanitizeNumber(record.sante, 0),
    degats: sanitizeNumber(record.degats, 0),
    trigger_effects: triggerEffects,
    bonuses,
    avatar_distant: buildAssetUrl(record.avatar_distant ?? record.avatar ?? null),
  };

  return normalized;
};

const mapSkillName = async (remoteId: any) => {
  if (remoteId === null || remoteId === undefined) {
    return { id: null, name: null };
  }
  const row = await fetchSingleValue(
    'SELECT id, name FROM skills WHERE distant_id = ? LIMIT 1',
    [remoteId],
  );
  if (!row) {
    return { id: null, name: null };
  }
  return { id: row.id, name: row.name };
};

const mapCapacityName = async (remoteId: any) => {
  if (remoteId === null || remoteId === undefined) {
    return { id: null, name: null };
  }
  const row = await fetchSingleValue(
    'SELECT id, name FROM capacites WHERE distant_id = ? LIMIT 1',
    [remoteId],
  );
  if (!row) {
    return { id: null, name: null };
  }
  return { id: row.id, name: row.name };
};

export const fetchRemoteCharacterSkills = async (
  characterId: string | number,
) => {
  const response = await apiFetch(
    `${API_BASE_URL}/character_skills?filter=character_id,eq,${characterId}`,
  );
  const data = await resolveJson(response, 'Impossible de récupérer les compétences.');
  const records = extractRecords(data);
  const list: {
    id: number | string;
    remote_id: number | string | null;
    name: string;
    level: number;
  }[] = [];

  for (let index = 0; index < records.length; index++) {
    const row: any = records[index];
    const remoteId = row?.skill_id ?? row?.skill ?? row?.id ?? null;
    const { id: localId, name: localName } = await mapSkillName(remoteId);
    const parsedRemoteId = remoteId !== null ? Number(remoteId) : null;
    const skillId =
      localId ??
      (Number.isFinite(parsedRemoteId) ? Number(parsedRemoteId) : `remote-skill-${index}`);
    const name =
      localName ??
      row?.skill_name ??
      (remoteId !== null ? `Compétence #${remoteId}` : 'Compétence');
    list.push({
      id: skillId,
      remote_id: remoteId,
      name,
      level: sanitizeNumber(row?.level, 0),
    });
  }

  return list;
};

export const fetchRemoteCharacterCapacites = async (
  characterId: string | number,
) => {
  const response = await apiFetch(
    `${API_BASE_URL}/character_capacites?filter=character_id,eq,${characterId}`,
  );
  const data = await resolveJson(response, 'Impossible de récupérer les capacités.');
  const records = extractRecords(data);
  const list: {
    id: number | string;
    remote_id: number | string | null;
    name: string;
    level: number;
  }[] = [];

  for (let index = 0; index < records.length; index++) {
    const row: any = records[index];
    const remoteId = row?.capacite_id ?? row?.capacity_id ?? row?.id ?? null;
    const { id: localId, name: localName } = await mapCapacityName(remoteId);
    const parsedRemoteId = remoteId !== null ? Number(remoteId) : null;
    const capacityId =
      localId ??
      (Number.isFinite(parsedRemoteId) ? Number(parsedRemoteId) : `remote-capacity-${index}`);
    const name =
      localName ??
      row?.capacite_name ??
      (remoteId !== null ? `Capacité #${remoteId}` : 'Capacité');
    list.push({
      id: capacityId,
      remote_id: remoteId,
      name,
      level: sanitizeNumber(row?.level, 0),
    });
  }

  return list;
};

export const fetchRemoteCharacterDetails = async (
  characterId: string | number,
): Promise<RemoteCharacterDetails> => {
  const [character, skills, capacites] = await Promise.all([
    fetchRemoteCharacterRecord(characterId),
    fetchRemoteCharacterSkills(characterId).catch(() => []),
    fetchRemoteCharacterCapacites(characterId).catch(() => []),
  ]);

  return {
    character,
    skills,
    capacites,
  };
};

export const useRemoteCharacter = (characterId?: string | number) => {
  return useQuery<RemoteCharacterDetails>({
    queryKey: ['remote-character', characterId],
    enabled: !!characterId,
    queryFn: () => fetchRemoteCharacterDetails(characterId as string | number),
  });
};
