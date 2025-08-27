import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDb } from "../data/db";

export function useSkillsByProfession(professionId: number) {
  return useQuery({
    queryKey: ["profession_skills", professionId],
    queryFn: async () => {
      const db = getDb();
      return await db.getAllAsync(
        `SELECT s.id, s.name
         FROM profession_skills ps
         JOIN skills s ON ps.skill_id = s.id
         WHERE ps.profession_id = ?
         ORDER BY s.name`,
        [professionId]
      );
    },
    enabled: professionId > 0,
  });
}

export function useCharacterSkills(characterId: string) {
  return useQuery({
    queryKey: ["character_skills", characterId],
    queryFn: async () => {
      const db = getDb();
      return await db.getAllAsync(
        `SELECT cs.skill_id as id, s.name, cs.level
         FROM character_skills cs
         JOIN skills s ON cs.skill_id = s.id
         WHERE cs.character_id = ?`,
        [characterId]
      );
    },
  });
}

export function useUpdateCharacterSkills() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      characterId,
      skills,
    }: {
      characterId: string;
      skills: { skillId: number; level: number }[];
    }) => {
      const db = getDb();
      await db.runAsync(
        "DELETE FROM character_skills WHERE character_id = ?",
        [characterId]
      );
      for (const skill of skills) {
        await db.runAsync(
          "INSERT INTO character_skills (character_id, skill_id, level) VALUES (?, ?, ?)",
          [characterId, skill.skillId, skill.level]
        );
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["character_skills", variables.characterId],
      });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}
