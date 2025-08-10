import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDb } from "../data/db";

export function useCapacitesByVoie(voieId: number) {
  return useQuery({
    queryKey: ["capacites", voieId],
    queryFn: async () => {
      const db = getDb();
      const rows = await db.getAllAsync(
        `SELECT c.id, c.name, c.description, cr.rang, cr.description as rang_description
         FROM capacites c
         JOIN voie_capacite vc ON vc.capacite_id = c.id
         LEFT JOIN capacite_rangs cr ON cr.capacite_id = c.id
         WHERE vc.voie_id = ?
         ORDER BY c.name, cr.rang`,
        [voieId]
      );

      const capacites: {
        id: number;
        name: string;
        description: string;
        rangs: Record<number, string>;
      }[] = [];
      const map = new Map<
        number,
        {
          id: number;
          name: string;
          description: string;
          rangs: Record<number, string>;
        }
      >();

      for (const row of rows as any[]) {
        if (!map.has(row.id)) {
          const item = {
            id: row.id as number,
            name: row.name as string,
            description: row.description as string,
            rangs: {} as Record<number, string>,
          };
          map.set(row.id, item);
          capacites.push(item);
        }
        if (row.rang) {
          map.get(row.id)!.rangs[row.rang] = row.rang_description as string;
        }
      }

      return capacites;
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
