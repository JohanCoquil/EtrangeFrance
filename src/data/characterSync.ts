import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system";
import * as Crypto from "expo-crypto";
import { getDb } from "./db";
import { apiFetch, logApiCall, extractRecordId } from "../utils/api";

const API_URL = "https://api.scriptonautes.net/api/records";

export async function syncCharacters() {
  console.log("Starting syncCharacters");
  const db = getDb();
  const characters = (await db.getAllAsync(
    "SELECT * FROM characters",
  )) as any[];
  console.log("Characters found:", characters.length);

  const storedUser = await SecureStore.getItemAsync("user");
  const userId = storedUser ? JSON.parse(storedUser).id : null;
  if (!userId) {
    console.warn("No user ID found, skipping character sync");
    return;
  }

  for (const char of characters) {
    console.log(`Syncing character ${char.id}`);
    let remoteId = char.distant_id ? String(char.distant_id) : "";
    const isNew = !remoteId;

    if (isNew) {
      const payload: Record<string, any> = {
        id: char.id,
        user_id: userId,
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
      };

      const payloadString = JSON.stringify(payload);
      console.log(`Payload for character ${char.id}:`, payloadString);

      try {
        const res = await apiFetch(`${API_URL}/characters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payloadString,
        });
        console.log(`POST /characters status: ${res.status}`);
        if (!res.ok) {
          const errorText = await res.text();
          console.error(
            `Failed to push character ${char.id}: ${res.status} ${res.statusText} - ${errorText}\nPayload: ${payloadString}`,
          );
          continue;
        }
        const text = await res.text();
        const extractedId = extractRecordId(text);
        console.log(`Remote ID for character ${char.id}:`, extractedId);
        if (!extractedId) continue;
        remoteId = extractedId;
        await db.runAsync("UPDATE characters SET distant_id = ? WHERE id = ?", [
          remoteId,
          char.id,
        ]);
        await syncDesk(db, char.id, remoteId);
      } catch (e) {
        console.error("Failed to push character", e, `Payload: ${payloadString}`);
        continue;
      }
    }

    if (remoteId) {
      if (char.avatar && (!char.avatar_distant || char.avatar_distant === "")) {
        try {
          console.log(`Uploading avatar for character ${char.id}`);
          const localUri = FileSystem.documentDirectory + char.avatar;
          const remotePath = await uploadCharacterAvatar(localUri, remoteId);
          console.log(
            `Avatar uploaded for character ${char.id}: ${remotePath}`,
          );

          await db.runAsync(
            "UPDATE characters SET avatar_distant = ? WHERE id = ?",
            [remotePath, char.id],
          );
        } catch (err) {
          console.error("Failed to upload avatar", err);
        }
      }

      await syncCharacterSkills(db, char.id, remoteId);
      await syncCharacterCapacites(db, char.id, remoteId);
      console.log(`Finished syncing character ${char.id}`);
    }
  }
}

function getMimeType(uri: string) {
  const ext = uri.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    default:
      return "image/jpeg";
  }
}

async function uploadCharacterAvatar(localUri: string, characterId: string) {
  const apiUrl = `https://api.scriptonautes.net/upload.php?type=avatar&entity=characters&id=${characterId}`;
  const mimeType = getMimeType(localUri);

  logApiCall(apiUrl, "POST");

  console.log("Uploading avatar", localUri, "to", apiUrl);
  const uploadRes = await FileSystem.uploadAsync(apiUrl, localUri, {
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: "file",
    mimeType,
  });

  console.log("Upload avatar response", uploadRes.status, uploadRes.body);

  let json: any = {};
  try {
    json = JSON.parse(uploadRes.body);
  } catch (e) {
    console.warn("Avatar upload response is not JSON", e);
  }

  if (uploadRes.status < 200 || uploadRes.status >= 300)
    throw new Error(json.error || "Upload failed");
  if (!json.path) throw new Error("Upload response missing path");
  return json.path as string;
}

async function syncDesk(
  db: SQLite.SQLiteDatabase,
  localId: string,
  remoteId: string,
) {
  console.log(`syncDesk for character ${localId}`);
  const rows = (await db.getAllAsync(
    "SELECT figure, cards FROM desk WHERE character_id = ?",
    [localId],
  )) as any[];
  console.log(`Found ${rows.length} desk rows for character ${localId}`);
  for (const row of rows) {
    try {
      const payload = {
        character_id: remoteId,
        figure: row.figure,
        cards: row.cards,
      };
      const res = await apiFetch(`${API_URL}/desk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log(`POST /desk status: ${res.status}`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `Failed to push desk row for character ${localId}: ${res.status} ${res.statusText} - ${errorText}`,
        );
      }
    } catch (e) {
      console.error("Failed to push desk row", e);
    }
  }
}

async function syncCharacterSkills(
  db: SQLite.SQLiteDatabase,
  localId: string,
  remoteId: string,
) {
  console.log(`syncCharacterSkills for character ${localId}`);
  const rows = (await db.getAllAsync(
    `SELECT cs.*, s.distant_id as skill_distant_id FROM character_skills cs JOIN skills s ON cs.skill_id = s.id WHERE cs.character_id = ? AND cs.distant_id = 0`,
    [localId],
  )) as any[];
  console.log(`Found ${rows.length} skill rows for character ${localId}`);

  for (const row of rows) {
    try {
      const payload = {
        character_id: remoteId,
        skill_id: row.skill_distant_id,
        level: row.level,
      };
      const res = await apiFetch(`${API_URL}/character_skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log(`POST /character_skills status: ${res.status}`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `Failed to push character_skills row for character ${localId}: ${res.status} ${res.statusText} - ${errorText}`,
        );
        continue;
      }
      const text = await res.text();
      const newId = extractRecordId(text);
      if (newId) {
        await db.runAsync(
          "UPDATE character_skills SET distant_id = ? WHERE character_id = ? AND skill_id = ?",
          [newId, localId, row.skill_id],
        );
      }
    } catch (e) {
      console.error("Failed to push character_skills row", e);
    }
  }
}

async function syncCharacterCapacites(
  db: SQLite.SQLiteDatabase,
  localId: string,
  remoteId: string,
) {
  console.log(`syncCharacterCapacites for character ${localId}`);
  const rows = (await db.getAllAsync(
    `SELECT cc.*, c.distant_id as capacite_distant_id FROM character_capacites cc JOIN capacites c ON cc.capacite_id = c.id WHERE cc.character_id = ? AND cc.distant_id = 0`,
    [localId],
  )) as any[];
  console.log(`Found ${rows.length} capacite rows for character ${localId}`);

  for (const row of rows) {
    try {
      const payload = {
        character_id: remoteId,
        capacite_id: row.capacite_distant_id,
        level: row.level,
      };
      const res = await apiFetch(`${API_URL}/character_capacites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload, ["character_id", "capacite_id", "level"]),
      });
      console.log(`POST /character_capacites status: ${res.status}`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `Failed to push character_capacites row for character ${localId}: ${res.status} ${res.statusText} - ${errorText}`,
        );
        continue;
      }
      const text = await res.text();
      const newId = extractRecordId(text);
      if (newId) {
        await db.runAsync(
          "UPDATE character_capacites SET distant_id = ? WHERE character_id = ? AND capacite_id = ?",
          [newId, localId, row.capacite_id],
        );
      }
    } catch (e) {
      console.error("Failed to push character_capacites row", e);
    }
  }
}

export async function importRemoteCharacters() {
  console.log("Importing remote characters");
  const db = getDb();
  const storedUser = await SecureStore.getItemAsync("user");
  const userId = storedUser ? JSON.parse(storedUser).id : null;
  if (!userId) {
    console.warn("No user ID found, skipping remote import");
    return;
  }

  try {
    const res = await apiFetch(
      `${API_URL}/characters?filter=user_id,eq,${userId}`,
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("Failed to fetch remote characters", err);
      return;
    }
    const json = await res.json();
    const remoteChars = json.records ?? json;
    for (const rc of remoteChars) {
      const existing = (await db.getAllAsync(
        "SELECT id FROM characters WHERE distant_id = ?",
        [rc.id],
      )) as any[];
      if (existing.length > 0) continue;

      const localId = await Crypto.randomUUID();
      const triggerEffects =
        rc.trigger_effects === null || rc.trigger_effects === undefined
          ? null
          : typeof rc.trigger_effects === "string"
          ? rc.trigger_effects
          : JSON.stringify(rc.trigger_effects);
      const bonuses =
        rc.bonuses === null || rc.bonuses === undefined
          ? null
          : typeof rc.bonuses === "string"
          ? rc.bonuses
          : JSON.stringify(rc.bonuses);

      await db.runAsync(
        `INSERT INTO characters (id, distant_id, name, profession, profession_id, profession_score, hobby_id, hobby_score, divinity_id, voie_id, voie_score, intelligence, force, dexterite, charisme, memoire, volonte, sante, degats, origines, rencontres, notes, equipement, fetiches, trigger_effects, bonuses, avatar, avatar_distant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          localId,
          rc.id,
          rc.name,
          rc.profession ?? null,
          rc.profession_id ?? null,
          rc.profession_score ?? 0,
          rc.hobby_id ?? null,
          rc.hobby_score ?? 0,
          rc.divinity_id ?? null,
          rc.voie_id ?? null,
          rc.voie_score ?? 0,
          rc.intelligence ?? 1,
          rc.force ?? 1,
          rc.dexterite ?? 1,
          rc.charisme ?? 1,
          rc.memoire ?? 1,
          rc.volonte ?? 1,
          rc.sante ?? 0,
          rc.degats ?? 0,
          rc.origines ?? null,
          rc.rencontres ?? null,
          rc.notes ?? null,
          rc.equipement ?? null,
          rc.fetiches ?? null,
          triggerEffects,
          bonuses,
          null,
          rc.avatar_distant ?? null,
        ],
      );

      await importDesk(db, localId, rc.id);
      await importCharacterSkills(db, localId, rc.id);
      await importCharacterCapacites(db, localId, rc.id);
    }
  } catch (e) {
    console.error("Failed to import remote characters", e);
  }
}

async function importDesk(
  db: SQLite.SQLiteDatabase,
  localId: string,
  remoteId: string,
) {
  try {
    const res = await apiFetch(
      `${API_URL}/desk?filter=character_id,eq,${remoteId}`,
    );
    if (!res.ok) return;
    const json = await res.json();
    const rows = json.records ?? json;
    for (const row of rows) {
      await db.runAsync(
        "INSERT INTO desk (character_id, figure, cards) VALUES (?, ?, ?)",
        [localId, row.figure, row.cards],
      );
    }
  } catch (e) {
    console.error("Failed to import desk", e);
  }
}

async function importCharacterSkills(
  db: SQLite.SQLiteDatabase,
  localId: string,
  remoteId: string,
) {
  try {
    const res = await apiFetch(
      `${API_URL}/character_skills?filter=character_id,eq,${remoteId}`,
    );
    if (!res.ok) return;
    const json = await res.json();
    const rows = json.records ?? json;
    for (const row of rows) {
      const skill = (await db.getAllAsync(
        "SELECT id FROM skills WHERE distant_id = ?",
        [row.skill_id],
      )) as any[];
      if (skill.length === 0) continue;
      await db.runAsync(
        "INSERT INTO character_skills (character_id, skill_id, level, distant_id) VALUES (?, ?, ?, ?)",
        [localId, skill[0].id, row.level, row.id],
      );
    }
  } catch (e) {
    console.error("Failed to import character_skills", e);
  }
}

async function importCharacterCapacites(
  db: SQLite.SQLiteDatabase,
  localId: string,
  remoteId: string,
) {
  try {
    const res = await apiFetch(
      `${API_URL}/character_capacites?filter=character_id,eq,${remoteId}`,
    );
    if (!res.ok) return;
    const json = await res.json();
    const rows = json.records ?? json;
    for (const row of rows) {
      const cap = (await db.getAllAsync(
        "SELECT id FROM capacites WHERE distant_id = ?",
        [row.capacite_id],
      )) as any[];
      if (cap.length === 0) continue;
      await db.runAsync(
        "INSERT INTO character_capacites (character_id, capacite_id, level, distant_id) VALUES (?, ?, ?, ?)",
        [localId, cap[0].id, row.level, row.id],
      );
    }
  } catch (e) {
    console.error("Failed to import character_capacites", e);
  }
}
