import * as SQLite from "expo-sqlite";
import { getDb } from "./db";

const API_URL = "https://api.scriptonautes.net/api/records";

export async function syncCharacters() {
  const db = getDb();
  const characters = (await db.getAllAsync(
    "SELECT * FROM characters WHERE distant_id = 0"
  )) as any[];

  for (const char of characters) {
    const payload: Record<string, any> = {
      name: char.name,
      profession_id: char.profession_id ?? null,
      profession_score: char.profession_score ?? 0,
      hobby_id: char.hobby_id ?? null,
      hobby_score: char.hobby_score ?? 0,
      divinity_id: char.divinity_id ?? null,
      voie_id: char.voie_id ?? null,
      voie_score: char.voie_score ?? 0,
      intelligence: char.intelligence,
      force: char.force,
      dexterite: char.dexterite,
      charisme: char.charisme,
      memoire: char.memoire,
      volonte: char.volonte,
      sante: char.sante,
      degats: char.degats,
      origines: char.origines ?? null,
      rencontres: char.rencontres ?? null,
      notes: char.notes ?? null,
      equipement: char.equipement ?? null,
      fetiches: char.fetiches ?? null,
      trigger_effects: char.trigger_effects ?? null,
      bonuses: char.bonuses ?? null,
      avatar: char.avatar ?? null,
    };

    try {
      const res = await fetch(`${API_URL}/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) continue;
      const json = await res.json();
      const remoteId = json.id ?? json[0]?.id;
      if (!remoteId) continue;
      await db.runAsync(
        "UPDATE characters SET distant_id = ? WHERE id = ?",
        [remoteId, char.id]
      );
      await syncDesk(db, char.id, remoteId);
      await syncCharacterSkills(db, char.id, remoteId);
      await syncCharacterCapacites(db, char.id, remoteId);
    } catch (e) {
      console.error("Failed to push character", e);
    }
  }
}

async function syncDesk(
  db: SQLite.SQLiteDatabase,
  localId: string,
  remoteId: number
) {
  const rows = (await db.getAllAsync(
    "SELECT figure, cards FROM desk WHERE user_id = ?",
    [localId]
  )) as any[];
  for (const row of rows) {
    try {
      await fetch(`${API_URL}/desk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: remoteId,
          figure: row.figure,
          cards: row.cards,
        }),
      });
    } catch (e) {
      console.error("Failed to push desk row", e);
    }
  }
}

async function syncCharacterSkills(
  db: SQLite.SQLiteDatabase,
  localId: string,
  remoteId: number
) {
  const rows = (await db.getAllAsync(
    `SELECT cs.*, s.distant_id as skill_distant_id FROM character_skills cs JOIN skills s ON cs.skill_id = s.id WHERE cs.character_id = ? AND cs.distant_id = 0`,
    [localId]
  )) as any[];

  for (const row of rows) {
    try {
      const res = await fetch(`${API_URL}/character_skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_id: remoteId,
          skill_id: row.skill_distant_id,
          level: row.level,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const newId = json.id ?? json[0]?.id;
        if (newId) {
          await db.runAsync(
            "UPDATE character_skills SET distant_id = ? WHERE character_id = ? AND skill_id = ?",
            [newId, localId, row.skill_id]
          );
        }
      }
    } catch (e) {
      console.error("Failed to push character_skills row", e);
    }
  }
}

async function syncCharacterCapacites(
  db: SQLite.SQLiteDatabase,
  localId: string,
  remoteId: number
) {
  const rows = (await db.getAllAsync(
    `SELECT cc.*, c.distant_id as capacite_distant_id FROM character_capacites cc JOIN capacites c ON cc.capacite_id = c.id WHERE cc.character_id = ? AND cc.distant_id = 0`,
    [localId]
  )) as any[];

  for (const row of rows) {
    try {
      const res = await fetch(`${API_URL}/character_capacites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_id: remoteId,
          capacite_id: row.capacite_distant_id,
          level: row.level,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const newId = json.id ?? json[0]?.id;
        if (newId) {
          await db.runAsync(
            "UPDATE character_capacites SET distant_id = ? WHERE character_id = ? AND capacite_id = ?",
            [newId, localId, row.capacite_id]
          );
        }
      }
    } catch (e) {
      console.error("Failed to push character_capacites row", e);
    }
  }
}

