import { useQuery } from "@tanstack/react-query";
import { getDb } from "../data/db";

export type StrangePath = {
  id: number;
  name: string;
  description: string;
  image_url?: string | null;
};

export function useStrangePaths() {
  return useQuery<StrangePath[]>({
    queryKey: ["strange_paths"],
    queryFn: async () => {
      const db = getDb();
      const result = await db.getAllAsync(
        "SELECT id, name, description, image_url FROM voies_etranges ORDER BY name"
      );
      return result as StrangePath[];
    },
  });
}
