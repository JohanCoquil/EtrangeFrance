import { useQuery } from "@tanstack/react-query";
import { getDb } from "../data/db";

export function useHobbies() {
  return useQuery({
    queryKey: ["hobbies"],
    queryFn: async () => {
      const db = getDb();
      const result = await db.getAllAsync("SELECT * FROM hobbies");
      return result;
    },
  });
}
