import * as SQLite from "expo-sqlite";
import { getDb } from "./db";

const API_URL = "https://api.scriptonautes.net/api/records";

export async function syncDatabase() {
  const db = getDb();
  await pushLocalChanges(db);
  await db.execAsync('PRAGMA foreign_keys = OFF;');
  try {
    await pullRemoteData(db);
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }
}

async function pushLocalChanges(db: SQLite.SQLiteDatabase) {
  await pushTable(db, "skills", ["name"]);
  await pushTable(db, "professions", ["name", "description", "image"]);
  await pushTable(db, "hobbies", ["name", "description"]);
  await pushProfessionSkills(db);
}

async function pushTable(
  db: SQLite.SQLiteDatabase,
  table: string,
  fields: string[]
) {
  const rows = (await db.getAllAsync(
    `SELECT * FROM ${table} WHERE distant_id = 0`
  )) as any[];
  for (const row of rows) {
    const payload: Record<string, any> = {};
    for (const f of fields) payload[f] = row[f];
    try {
      const res = await fetch(`${API_URL}/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        const newId = json.id ?? json[0]?.id;
        if (newId) {
          await db.runAsync(
            `UPDATE ${table} SET distant_id = ? WHERE id = ?`,
            [newId, row.id]
          );
        }
      }
    } catch (e) {
      console.error(`Failed to push ${table} row`, e);
    }
  }
}

async function pushProfessionSkills(db: SQLite.SQLiteDatabase) {
  const rows = (await db.getAllAsync(
    `SELECT * FROM profession_skills WHERE distant_id = 0`
  )) as any[];
  for (const row of rows) {
    try {
      const res = await fetch(`${API_URL}/profession_skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profession_id: row.profession_id,
          skill_id: row.skill_id,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const newId = json.id ?? json[0]?.id;
        if (newId) {
          await db.runAsync(
            "UPDATE profession_skills SET distant_id = ? WHERE profession_id = ? AND skill_id = ?",
            [newId, row.profession_id, row.skill_id]
          );
        }
      }
    } catch (e) {
      console.error("Failed to push profession_skills row", e);
    }
  }
}

async function pullRemoteData(db: SQLite.SQLiteDatabase) {
  await pullHobbies(db);
  await pullSkills(db);
  await pullProfessions(db);
  await pullProfessionSkills(db);
  await pullVoies(db);
  await pullCapacites(db);
  await pullVoieCapacite(db);
  await pullCapaciteRangs(db);
}

async function fetchRecords(table: string) {
  try {
    const res = await fetch(`${API_URL}/${table}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.records ?? json;
  } catch (e) {
    console.error(`Failed to fetch ${table}`, e);
    return [];
  }
}

async function pullHobbies(db: SQLite.SQLiteDatabase) {
  const records = await fetchRecords("hobbies");
  await db.runAsync("DELETE FROM hobbies");
  for (const r of records) {
    await db.runAsync(
      "INSERT INTO hobbies (id, distant_id, name, description) VALUES (?, ?, ?, ?)",
      [r.id, r.id, r.name, r.description ?? null]
    );
  }
}

async function pullSkills(db: SQLite.SQLiteDatabase) {
  const records = await fetchRecords("skills");
  await db.runAsync("DELETE FROM skills");
  for (const r of records) {
    await db.runAsync(
      "INSERT INTO skills (id, distant_id, name) VALUES (?, ?, ?)",
      [r.id, r.id, r.name]
    );
  }
}

async function pullProfessions(db: SQLite.SQLiteDatabase) {
  const records = await fetchRecords("professions");
  await db.runAsync("DELETE FROM professions");
  for (const r of records) {
    await db.runAsync(
      "INSERT INTO professions (id, distant_id, name, description, image) VALUES (?, ?, ?, ?, ?)",
      [r.id, r.id, r.name, r.description ?? null, r.image ?? ""]
    );
  }
}

async function pullProfessionSkills(db: SQLite.SQLiteDatabase) {
  const records = await fetchRecords("profession_skills");
  await db.runAsync("DELETE FROM profession_skills");
  for (const r of records) {
    await db.runAsync(
      "INSERT INTO profession_skills (profession_id, skill_id, distant_id) VALUES (?, ?, ?)",
      [r.profession_id, r.skill_id, r.id]
    );
  }
}

async function pullVoies(db: SQLite.SQLiteDatabase) {
  const records = await fetchRecords("voies_etranges");
  await db.runAsync("DELETE FROM voies_etranges");
  for (const r of records) {
    await db.runAsync(
      "INSERT INTO voies_etranges (id, distant_id, name, description, image_url) VALUES (?, ?, ?, ?, ?)",
      [r.id, r.id, r.name, r.description, r.image_url ?? null]
    );
  }
}

async function pullCapacites(db: SQLite.SQLiteDatabase) {
  const records = await fetchRecords("capacites");
  await db.runAsync("DELETE FROM capacites");
  for (const r of records) {
    await db.runAsync(
      "INSERT INTO capacites (id, distant_id, name, description, image_url) VALUES (?, ?, ?, ?, ?)",
      [r.id, r.id, r.name, r.description, r.image_url ?? null]
    );
  }
}

async function pullVoieCapacite(db: SQLite.SQLiteDatabase) {
  const records = await fetchRecords("voie_capacite");
  await db.runAsync("DELETE FROM voie_capacite");
  for (const r of records) {
    await db.runAsync(
      "INSERT INTO voie_capacite (voie_id, capacite_id, distant_id) VALUES (?, ?, ?)",
      [r.voie_id, r.capacite_id, r.id]
    );
  }
}

async function pullCapaciteRangs(db: SQLite.SQLiteDatabase) {
  const records = await fetchRecords("capacite_rangs");
  await db.runAsync("DELETE FROM capacite_rangs");
  for (const r of records) {
    await db.runAsync(
      "INSERT INTO capacite_rangs (id, distant_id, capacite_id, rang, description) VALUES (?, ?, ?, ?, ?)",
      [r.id, r.id, r.capacite_id, r.rang, r.description]
    );
  }
}

