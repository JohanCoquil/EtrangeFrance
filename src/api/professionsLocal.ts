import { useQuery } from "@tanstack/react-query";
import { getDb } from "../data/db";

export function useProfessions() {
  return useQuery({
    queryKey: ["professions"],
    queryFn: async () => {
      const db = getDb();
      const result = await db.getAllAsync("SELECT * FROM professions");
      return result;
    },
  });
}
