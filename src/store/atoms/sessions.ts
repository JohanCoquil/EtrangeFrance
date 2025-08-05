import { atom } from 'jotai';
import { Session } from '../../types/session';

// Atom pour la session active
export const activeSessionAtom = atom<Session | null>(null);

// Atom pour la liste des sessions
export const sessionsAtom = atom<Session[]>([]);

// Atom pour l'état de connexion à une session
export const sessionConnectionAtom = atom<boolean>(false);

// Atom pour les erreurs liées aux sessions
export const sessionErrorAtom = atom<string | null>(null); 