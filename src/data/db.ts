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
      distant_id INTEGER DEFAULT 0,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS capacites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distant_id INTEGER DEFAULT 0,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS voie_capacite (
      voie_id INTEGER NOT NULL,
      capacite_id INTEGER NOT NULL,
      distant_id INTEGER DEFAULT 0,
      PRIMARY KEY (voie_id, capacite_id),
      FOREIGN KEY (voie_id) REFERENCES voies_etranges(id) ON DELETE CASCADE,
      FOREIGN KEY (capacite_id) REFERENCES capacites(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_voie_capacite_voie_id ON voie_capacite(voie_id);

    CREATE TABLE IF NOT EXISTS capacite_rangs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distant_id INTEGER DEFAULT 0,
      capacite_id INTEGER NOT NULL,
      rang INTEGER NOT NULL CHECK (rang >= 1),
      description TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (capacite_id) REFERENCES capacites(id) ON DELETE CASCADE,
      UNIQUE (capacite_id, rang)
    );

    CREATE TABLE IF NOT EXISTS character_capacites (
      distant_id INTEGER DEFAULT 0,
      character_id TEXT NOT NULL,
      capacite_id INTEGER NOT NULL,
      level INTEGER NOT NULL,
      PRIMARY KEY (character_id, capacite_id),
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
      FOREIGN KEY (capacite_id) REFERENCES capacites(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_character_capacites_character_id ON character_capacites(character_id);

    CREATE TABLE IF NOT EXISTS hobbies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distant_id INTEGER DEFAULT 0,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distant_id INTEGER DEFAULT 0,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS professions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distant_id INTEGER DEFAULT 0,
      name TEXT NOT NULL,
      description TEXT,
      image TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profession_skills (
      distant_id INTEGER DEFAULT 0,
      profession_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      PRIMARY KEY (profession_id, skill_id),
      FOREIGN KEY (profession_id) REFERENCES professions(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_profession_skills_skill_id ON profession_skills(skill_id);

    CREATE TABLE IF NOT EXISTS druide_divinites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      domaine TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      distant_id INTEGER DEFAULT 0,
      name TEXT NOT NULL,
      profession TEXT,
      profession_id INTEGER,
      profession_score INTEGER DEFAULT 0,
      hobby_id INTEGER,
      hobby_score INTEGER DEFAULT 0,
      divinity_id INTEGER,
      voie_id INTEGER,
      voie_score INTEGER DEFAULT 0,
      intelligence INTEGER DEFAULT 1,
      force INTEGER DEFAULT 1,
      dexterite INTEGER DEFAULT 1,
      charisme INTEGER DEFAULT 1,
      memoire INTEGER DEFAULT 1,
      volonte INTEGER DEFAULT 1,
      sante INTEGER DEFAULT 0,
      origines TEXT,
      rencontres TEXT,
      notes TEXT,
      equipement TEXT,
      fetiches TEXT,
      FOREIGN KEY (profession_id) REFERENCES professions(id),
      FOREIGN KEY (hobby_id) REFERENCES hobbies(id),
      FOREIGN KEY (divinity_id) REFERENCES druide_divinites(id),
      FOREIGN KEY (voie_id) REFERENCES voies_etranges(id)
    );

  `);
  
  // Ensure new columns exist for older databases
  const voieCapaciteCols = await database.getAllAsync("PRAGMA table_info(voie_capacite);");
  const hasVcDistantId = voieCapaciteCols.some((c: any) => c.name === "distant_id");
  if (!hasVcDistantId) {
    await database.execAsync(
      "ALTER TABLE voie_capacite ADD COLUMN distant_id INTEGER DEFAULT 0;"
    );
  }

  const columns = await database.getAllAsync("PRAGMA table_info(characters);");
  const hasProfessionId = columns.some((c: any) => c.name === "profession_id");
  if (!hasProfessionId) {
    await database.execAsync(
      "ALTER TABLE characters ADD COLUMN profession_id INTEGER;"
    );
  }

  const hasDivinityId = columns.some((c: any) => c.name === "divinity_id");
  if (!hasDivinityId) {
    await database.execAsync(
      "ALTER TABLE characters ADD COLUMN divinity_id INTEGER;"
    );
  }

  const hasSante = columns.some((c: any) => c.name === "sante");
  if (!hasSante) {
    await database.execAsync(
      "ALTER TABLE characters ADD COLUMN sante INTEGER DEFAULT 0;"
    );
  }
  const hasOrigines = columns.some((c: any) => c.name === "origines");
  if (!hasOrigines) {
    await database.execAsync(
      "ALTER TABLE characters ADD COLUMN origines TEXT;",
    );
  }

  const hasRencontres = columns.some((c: any) => c.name === "rencontres");
  if (!hasRencontres) {
    await database.execAsync(
      "ALTER TABLE characters ADD COLUMN rencontres TEXT;",
    );
  }

  const hasNotes = columns.some((c: any) => c.name === "notes");
  if (!hasNotes) {
    await database.execAsync(
      "ALTER TABLE characters ADD COLUMN notes TEXT;",
    );
  }

  const hasEquipement = columns.some((c: any) => c.name === "equipement");
  if (!hasEquipement) {
    await database.execAsync(
      "ALTER TABLE characters ADD COLUMN equipement TEXT;",
    );
  }

  const hasFetiches = columns.some((c: any) => c.name === "fetiches");
  if (!hasFetiches) {
    await database.execAsync(
      "ALTER TABLE characters ADD COLUMN fetiches TEXT;",
    );
  }

  await database.execAsync(
    "CREATE INDEX IF NOT EXISTS idx_characters_profession_id ON characters(profession_id);"
  );
  await database.execAsync(
    "CREATE INDEX IF NOT EXISTS idx_characters_divinity_id ON characters(divinity_id);"
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

