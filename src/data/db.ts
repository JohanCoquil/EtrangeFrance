import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("etrange_france.db");

export const initDb = async () => {
  await db.execAsync(`
   CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  profession TEXT,
  intelligence INTEGER DEFAULT 1,
  force INTEGER DEFAULT 1,
  dexterite INTEGER DEFAULT 1,
  charisme INTEGER DEFAULT 1,
  memoire INTEGER DEFAULT 1,
  volonte INTEGER DEFAULT 1
);
  `);
};
