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
          (id, name, profession_id, intelligence, force, dexterite, charisme, memoire, volonte)
        VALUES
          ('${character.id}', '${character.name}', ${
            character.profession_id ?? "NULL"
          },
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
    }: {
      id: string;
      professionId: number;
    }) => {
      const db = getDb();
      await db.runAsync(
        "UPDATE characters SET profession_id = ? WHERE id = ?",
        [professionId, id]
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
        SELECT c.*, p.name AS profession_name
        FROM characters c
        LEFT JOIN professions p ON c.profession_id = p.id
      `);
      return result;
    },
  });
}

