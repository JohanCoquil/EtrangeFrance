import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export const getDb = () => {
  if (!db) {
    db = SQLite.openDatabaseSync("etrange_france.db");
  }
  return db;
};

export const initDb = async () => {
  const database = getDb();
  await database.execAsync(`
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

export const resetDb = async () => {
  if (db) {
    await db.closeAsync();
    db = null;
  }
  await SQLite.deleteDatabaseAsync("etrange_france.db");
  await initDb();
};

