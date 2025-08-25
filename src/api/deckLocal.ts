import { useQuery } from "@tanstack/react-query";
import { getDb } from "../data/db";

export function useDeck(userId: string) {
  return useQuery({
    queryKey: ["desk", userId],
    queryFn: async () => {
      const db = getDb();
      return await db.getAllAsync(
        "SELECT figure, cards FROM desk WHERE user_id = ?",
        [userId]
      );
    },
  });
}
