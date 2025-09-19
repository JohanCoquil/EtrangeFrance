import { atom } from 'jotai';
import { SessionRecord } from '../../types/session';

// Atom pour la session active
export const activeSessionAtom = atom<SessionRecord | null>(null);

// Atom pour la liste des sessions
export const sessionsAtom = atom<SessionRecord[]>([]);

// Atom pour l'état de connexion à une session
export const sessionConnectionAtom = atom<boolean>(false);

// Atom pour les erreurs liées aux sessions
export const sessionErrorAtom = atom<string | null>(null); 
