import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export const getDb = () => {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return db;
};

export const initDb = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync("etrange_france.db");
  }
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      species TEXT,
      intelligence INTEGER DEFAULT 1,
      force INTEGER DEFAULT 1,
      dexterite INTEGER DEFAULT 1,
      charisme INTEGER DEFAULT 1,
      memoire INTEGER DEFAULT 1,
      volonte INTEGER DEFAULT 1,
      creation_step INTEGER DEFAULT 1
    );
  `);
};

export const closeDb = async () => {
  if (db) {
    await db.closeAsync();
    db = null; // important pour réinit
  }
};
