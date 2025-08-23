import { useQuery } from "@tanstack/react-query";
import { getDb } from "../data/db";

export type Divinity = {
  id: number;
  name: string;
  domaine: string | null;
  description: string | null;
};

export function useDivinities() {
  return useQuery<Divinity[]>({
    queryKey: ["druide_divinites"],
    queryFn: async () => {
      const db = getDb();
      const rows = await db.getAllAsync(
        "SELECT id, name, domaine, description FROM druide_divinites ORDER BY name"
      );
      return rows as Divinity[];
    },
  });
}
