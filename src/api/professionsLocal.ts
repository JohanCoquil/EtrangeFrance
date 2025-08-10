import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDb } from "../data/db";

export function useProfessions() {
  return useQuery({
    queryKey: ["professions"],
    queryFn: async () => {
      const db = getDb();
      const result = await db.getAllAsync(
        `SELECT p.*, GROUP_CONCAT(s.name, ',') as skills
         FROM professions p
         LEFT JOIN profession_skills ps ON ps.profession_id = p.id
         LEFT JOIN skills s ON s.id = ps.skill_id
         GROUP BY p.id
         ORDER BY p.name`
      );
      return result.map((row: any) => ({
        ...row,
        skills: row.skills ? (row.skills as string).split(',') : [],
      }));
    },
  });
}

export function useAddProfession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      skills,
    }: {
      name: string;
      skills: string[];
    }) => {
      const db = getDb();
      const result = await db.runAsync(
        "INSERT INTO professions (name, description, image) VALUES (?, NULL, '')",
        [name]
      );
      const professionId = result.lastInsertRowId as number;

      for (const skillName of skills) {
        const existing = (await db.getAllAsync(
          "SELECT id FROM skills WHERE name = ?",
          [skillName]
        )) as any[];
        let skillId: number;
        if (existing.length > 0) {
          skillId = existing[0].id as number;
        } else {
          const skillResult = await db.runAsync(
            "INSERT INTO skills (name) VALUES (?)",
            [skillName]
          );
          skillId = skillResult.lastInsertRowId as number;
        }
        await db.runAsync(
          "INSERT INTO profession_skills (profession_id, skill_id) VALUES (?, ?)",
          [professionId, skillId]
        );
      }

      return professionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professions"] });
    },
  });
}
