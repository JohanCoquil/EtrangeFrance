import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { getDb } from "../data/db";

export function useAddCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCharacter: any) => {
      const id = await Crypto.randomUUID();
      const character = { id, ...newCharacter };

      const db = getDb();
      await db.execAsync(`
        INSERT INTO characters
          (id, name, profession_id, profession_score, hobby_id, hobby_score, intelligence, force, dexterite, charisme, memoire, volonte)
        VALUES
          ('${character.id}', '${character.name}', ${
            character.profession_id ?? "NULL"
          },
          ${character.profession_score ?? 0}, ${
            character.hobby_id ?? "NULL"
          }, ${character.hobby_score ?? 0},
          ${character.intelligence}, ${character.force}, ${character.dexterite},
          ${character.charisme}, ${character.memoire}, ${character.volonte});
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
        SELECT c.*, p.name AS profession_name, h.name AS hobby_name
        FROM characters c
        LEFT JOIN professions p ON c.profession_id = p.id
        LEFT JOIN hobbies h ON c.hobby_id = h.id
      `);
      return result;
    },
  });
}

