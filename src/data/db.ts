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
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS voies_etranges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS capacites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voie_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (voie_id) REFERENCES voies_etranges(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_capacites_voie_id ON capacites(voie_id);

    CREATE TABLE IF NOT EXISTS capacite_rangs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      capacite_id INTEGER NOT NULL,
      rang INTEGER NOT NULL CHECK (rang >= 1),
      description TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (capacite_id) REFERENCES capacites(id) ON DELETE CASCADE,
      UNIQUE (capacite_id, rang)
    );

    CREATE TABLE IF NOT EXISTS hobbies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS professions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      image TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profession_skills (
      profession_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      PRIMARY KEY (profession_id, skill_id),
      FOREIGN KEY (profession_id) REFERENCES professions(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_profession_skills_skill_id ON profession_skills(skill_id);

    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      profession TEXT,
      profession_id INTEGER,
      intelligence INTEGER DEFAULT 1,
      force INTEGER DEFAULT 1,
      dexterite INTEGER DEFAULT 1,
      charisme INTEGER DEFAULT 1,
      memoire INTEGER DEFAULT 1,
      volonte INTEGER DEFAULT 1,
      FOREIGN KEY (profession_id) REFERENCES professions(id)
    );
  `);

  // Ensure profession_id column exists for older databases
  const columns = await database.getAllAsync("PRAGMA table_info(characters);");
  const hasProfessionId = columns.some((c: any) => c.name === "profession_id");
  if (!hasProfessionId) {
    await database.execAsync(
      "ALTER TABLE characters ADD COLUMN profession_id INTEGER;"
    );
  }

  await database.execAsync(
    "CREATE INDEX IF NOT EXISTS idx_characters_profession_id ON characters(profession_id);"
  );
};

export const resetDb = async () => {
  if (db) {
    await db.closeAsync();
    db = null;
  }
  await SQLite.deleteDatabaseAsync("etrange_france.db");
  await initDb();
};

