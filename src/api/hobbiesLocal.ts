import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDb } from "../data/db";

export function useHobbies() {
  return useQuery({
    queryKey: ["hobbies"],
    queryFn: async () => {
      const db = getDb();
      const result = await db.getAllAsync(
        "SELECT * FROM hobbies order by name",
      );
      return result;
    },
  });
}

export function useAddHobby() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description?: string;
    }) => {
      const db = getDb();
      const result = await db.runAsync(
        "INSERT INTO hobbies (name, description) VALUES (?, ?)",
        [name, description ?? null],
      );
      return result.lastInsertRowId as number;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hobbies"] });
    },
  });
}
