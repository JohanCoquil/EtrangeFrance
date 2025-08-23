import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { getDb } from "../data/db";

export function useAddCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
      mutationFn: async (newCharacter: any) => {
        const id = await Crypto.randomUUID();
        const character = { id, ...newCharacter };
        character.sante = (character.force + character.volonte) * 2;

        const db = getDb();
        await db.execAsync(`
          INSERT INTO characters
            (id, name, profession_id, profession_score, hobby_id, hobby_score, voie_id, voie_score, intelligence, force, dexterite, charisme, memoire, volonte, sante)
          VALUES
            ('${character.id}', '${character.name}', ${
              character.profession_id ?? "NULL"
            },
            ${character.profession_score ?? 0}, ${
              character.hobby_id ?? "NULL"
            }, ${character.hobby_score ?? 0}, ${character.voie_id ?? "NULL"}, ${character.voie_score ?? 0},
            ${character.intelligence}, ${character.force}, ${character.dexterite},
            ${character.charisme}, ${character.memoire}, ${character.volonte}, ${character.sante});
        `);

        return character;
      },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useUpdateProfession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      professionId,
      professionScore,
    }: {
      id: string;
      professionId: number;
      professionScore: number;
    }) => {
      const db = getDb();
      await db.runAsync(
        "UPDATE characters SET profession_id = ?, profession_score = ? WHERE id = ?",
        [professionId, professionScore, id]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useUpdateHobby() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      hobbyId,
      hobbyScore,
    }: {
      id: string;
      hobbyId: number;
      hobbyScore: number;
    }) => {
      const db = getDb();
      await db.runAsync(
        "UPDATE characters SET hobby_id = ?, hobby_score = ? WHERE id = ?",
        [hobbyId, hobbyScore, id]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useUpdateStrangePath() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      voieId,
      voieScore,
    }: {
      id: string;
      voieId: number;
      voieScore: number;
    }) => {
      const db = getDb();
      await db.runAsync(
        "UPDATE characters SET voie_id = ?, voie_score = ? WHERE id = ?",
        [voieId, voieScore, id]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useUpdateDivinity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      divinityId,
    }: {
      id: string;
      divinityId: number;
    }) => {
      const db = getDb();
      await db.runAsync(
        "UPDATE characters SET divinity_id = ? WHERE id = ?",
        [divinityId, id]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useUpdateCharacterSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      origines,
      rencontres,
      notes,
      equipement,
      fetiches,
    }: {
      id: string;
      origines: string;
      rencontres: string;
      notes: string;
      equipement: string;
      fetiches: string;
    }) => {
      const db = getDb();
      await db.runAsync(
        "UPDATE characters SET origines = ?, rencontres = ?, notes = ?, equipement = ?, fetiches = ? WHERE id = ?",
        [origines, rencontres, notes, equipement, fetiches, id]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const db = getDb();
      await db.runAsync("DELETE FROM characters WHERE id = ?", [String(id)]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useCharacters() {
  return useQuery({
    queryKey: ["characters"],
    queryFn: async () => {
      const db = getDb();
      const result = await db.getAllAsync(`
        SELECT c.*, p.name AS profession_name, h.name AS hobby_name, v.name AS voie_name
        , d.name AS divinity_name, d.domaine AS divinity_domaine
        FROM characters c
        LEFT JOIN professions p ON c.profession_id = p.id
        LEFT JOIN hobbies h ON c.hobby_id = h.id
        LEFT JOIN voies_etranges v ON c.voie_id = v.id
        LEFT JOIN druide_divinites d ON c.divinity_id = d.id
      `);
      return result;
    },
  });
}

