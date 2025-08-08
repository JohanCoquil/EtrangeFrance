import { useQuery } from "@tanstack/react-query";
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
         GROUP BY p.id`
      );
      return result.map((row: any) => ({
        ...row,
        skills: row.skills ? (row.skills as string).split(',') : [],
      }));
    },
  });
}
