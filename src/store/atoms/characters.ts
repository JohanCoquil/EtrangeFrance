import { atom } from 'jotai';
import { Character } from '../../types/character';

// Atom pour le personnage sélectionné
export const selectedCharacterAtom = atom<string | null>(null);

// Atom pour la liste des personnages
export const charactersAtom = atom<Character[]>([]);

// Atom pour le personnage actuellement en cours de création/édition
export const currentCharacterAtom = atom<Partial<Character> | null>(null);

// Atom pour l'état de chargement des personnages
export const charactersLoadingAtom = atom<boolean>(false);

// Atom pour les erreurs liées aux personnages
export const charactersErrorAtom = atom<string | null>(null); 