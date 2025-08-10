import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDb } from "../data/db";

export function useCapacitesByVoie(voieId: number) {
  return useQuery({
    queryKey: ["capacites", voieId],
    queryFn: async () => {
      const db = getDb();
      return await db.getAllAsync(
        `SELECT c.id, c.name, c.description
         FROM capacites c
         JOIN voie_capacite vc ON vc.capacite_id = c.id
         WHERE vc.voie_id = ?
         ORDER BY c.name`,
        [voieId]
      );
    },
  });
}

export function useCharacterCapacites(characterId: string) {
  return useQuery({
    queryKey: ["character_capacites", characterId],
    queryFn: async () => {
      const db = getDb();
      return await db.getAllAsync(
        `SELECT cc.capacite_id as id, c.name, c.description, cc.level
         FROM character_capacites cc
         JOIN capacites c ON cc.capacite_id = c.id
         WHERE cc.character_id = ?`,
        [characterId]
      );
    },
  });
}

export function useUpdateCharacterCapacites() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      characterId,
      capacites,
    }: {
      characterId: string;
      capacites: { capaciteId: number; level: number }[];
    }) => {
      const db = getDb();
      await db.runAsync(
        "DELETE FROM character_capacites WHERE character_id = ?",
        [characterId]
      );
      for (const cap of capacites) {
        await db.runAsync(
          "INSERT INTO character_capacites (character_id, capacite_id, level) VALUES (?, ?, ?)",
          [characterId, cap.capaciteId, cap.level]
        );
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["character_capacites", variables.characterId],
      });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}
