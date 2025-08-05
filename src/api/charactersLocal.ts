import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient,   useQuery } from "@tanstack/react-query";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("etrange_france.db");

export function useAddCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCharacter: any) => {
      const id = await Crypto.randomUUID();
      const character = { id, ...newCharacter };

      await db.execAsync(`
        INSERT INTO characters 
          (id, name, species, intelligence, force, dexterite, charisme, memoire, volonte)
        VALUES 
          ('${character.id}', '${character.name}', '${character.species}', 
          ${character.intelligence}, ${character.force}, ${character.dexterite}, 
          ${character.charisme}, ${character.memoire}, ${character.volonte});
      `);

      return character;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

        


export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await db.runAsync("DELETE FROM characters WHERE id = ?", [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useCharacters() {
  return useQuery({
    queryKey: ["characters"],
    queryFn: async () => {
      const result = await db.getAllAsync("SELECT * FROM characters");
      return result;
    },
  });
}
