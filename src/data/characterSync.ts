import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system";
import * as Crypto from "expo-crypto";
import { getDb } from "./db";
import { apiFetch, logApiCall, extractRecordId } from "../utils/api";

const API_URL = "https://api.scriptonautes.net/api/records";

/**
 * Send a full update for a character to the remote API.
 *
 * The API does not support PATCH, so we send a complete payload using PUT
 * to satisfy NOT NULL constraints on the backend.
 */
export async function pushCharacterUpdate(
  localId: string,
  changes: Record<string, any>,
) {
  const db = getDb();
  const row = (await db.getFirstAsync(
    "SELECT * FROM characters WHERE id = ?",
    [localId],
  )) as any;
  const remoteId = row?.distant_id;
  if (!remoteId) {
    console.warn(`No remote id for character ${localId}, skipping update`);
    return;
  }

  const storedUser = await SecureStore.getItemAsync("user");
  const userId = storedUser ? JSON.parse(storedUser).id : null;
  if (!userId) {
    console.warn("No user ID found, skipping character update");
    return;
  }

  const payload: Record<string, any> = {
    user_id: userId,
    name: row.name,
    profession_id: row.profession_id ?? null,
    profession_score: row.profession_score ?? 0,
    hobby_id: row.hobby_id ?? null,
    hobby_score: row.hobby_score ?? 0,
    divinity_id: row.divinity_id ?? null,
    voie_id: row.voie_id ?? null,
    voie_score: row.voie_score ?? 0,
    intelligence: row.intelligence,
    force: row.force,
    dexterite: row.dexterite,
    charisme: row.charisme,
    memoire: row.memoire,
    volonte: row.volonte,
    sante: row.sante,
    degats: row.degats,
    origines: row.origines ?? null,
    rencontres: row.rencontres ?? null,
    notes: row.notes ?? null,
    equipement: row.equipement ?? null,
    fetiches: row.fetiches ?? null,
    trigger_effects: row.trigger_effects ?? null,
    bonuses: row.bonuses ?? null,
  };

  Object.assign(payload, changes);
  const payloadString = JSON.stringify(payload);
  try {
    const res = await apiFetch(`${API_URL}/characters/${remoteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: payloadString,
    });
    console.log(`PUT /characters/${remoteId} status: ${res.status}`);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `Failed to update character ${localId}: ${res.status} ${res.statusText} - ${errorText}`,
      );
      return;
    }
    await db.runAsync(
      "UPDATE characters SET last_sync_at = CURRENT_TIMESTAMP WHERE id = ?",
      [localId],
    );
  } catch (e) {
    console.error("Failed to push character update", e, `Payload: ${payloadString}`);
  }
}

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
        await db.runAsync(
          "UPDATE characters SET distant_id = ?, last_sync_at = CURRENT_TIMESTAMP WHERE id = ?",
          [remoteId, char.id],
        );
        await syncDesk(db, char.id, remoteId);
      } catch (e) {
        console.error("Failed to push character", e, `Payload: ${payloadString}`);
        continue;
      }
    }

    if (remoteId) {
      await syncCharacterSkills(db, char.id, remoteId);
      await syncCharacterCapacites(db, char.id, remoteId);

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
      await db.runAsync(
        "UPDATE characters SET last_sync_at = CURRENT_TIMESTAMP WHERE id = ?",
        [char.id],
      );
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
      } else {
        await db.runAsync(
          "UPDATE desk SET last_sync_at = CURRENT_TIMESTAMP WHERE character_id = ? AND figure = ?",
          [localId, row.figure],
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
          "UPDATE character_skills SET distant_id = ?, last_sync_at = CURRENT_TIMESTAMP WHERE character_id = ? AND skill_id = ?",
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
          "UPDATE character_capacites SET distant_id = ?, last_sync_at = CURRENT_TIMESTAMP WHERE character_id = ? AND capacite_id = ?",
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
    const charactersUrl = `${API_URL}/characters?filter=user_id,eq,${userId}`;
    logApiCall(charactersUrl, "GET");
    const res = await apiFetch(charactersUrl);
    if (!res.ok) {
      const err = await res.text();
      console.error("Failed to fetch remote characters", err);
      return;
    }
    const json = await res.json();
    const remoteChars = json.records ?? json;
    for (const rc of remoteChars) {
      const remoteId = rc.id;
      if (!remoteId) {
        console.warn("Skipping remote character without id", rc);
        continue;
      }

      const existing = (await db.getAllAsync(
        "SELECT id, avatar, avatar_distant FROM characters WHERE distant_id = ?",
        [remoteId],
      )) as any[];
      const hasExisting = existing.length > 0;
      const localId = hasExisting ? existing[0].id : await Crypto.randomUUID();

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

      const remoteAvatar = rc.avatar_distant || rc.avatar || null;
      let avatarLocal = hasExisting ? existing[0].avatar ?? null : null;
      const existingRemoteAvatar = hasExisting
        ? existing[0].avatar_distant ?? null
        : null;

      if (remoteAvatar) {
        const shouldDownload =
          !avatarLocal || !existingRemoteAvatar || existingRemoteAvatar !== remoteAvatar;
        if (shouldDownload) {
          try {
            const remoteUrl = remoteAvatar.startsWith("http")
              ? remoteAvatar
              : `https://api.scriptonautes.net/${remoteAvatar.replace(/^\//, "")}`;
            const dir = FileSystem.documentDirectory + "avatars";
            await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
            const ext = remoteUrl.split(".").pop()?.split("?")[0] || "jpg";
            const fileName = `${localId}.${ext}`;
            avatarLocal = `avatars/${fileName}`;
            logApiCall(remoteUrl, "GET");
            const downloadRes = await FileSystem.downloadAsync(
              remoteUrl,
              FileSystem.documentDirectory + avatarLocal,
            );
            console.log(
              `[API] response GET ${remoteUrl} -> ${downloadRes.status}`,
            );
          } catch (e) {
            console.error("Failed to download avatar", e);
          }
        }
      } else {
        avatarLocal = null;
      }

      const baseValues: any[] = [
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
        avatarLocal,
        remoteAvatar,
        rc.last_sync_at ?? new Date().toISOString(),
      ];

      if (hasExisting) {
        console.log(`Updating local character ${localId} from remote ${remoteId}`);
        await db.runAsync(
          `UPDATE characters SET distant_id = ?, name = ?, profession = ?, profession_id = ?, profession_score = ?, hobby_id = ?, hobby_score = ?, divinity_id = ?, voie_id = ?, voie_score = ?, intelligence = ?, force = ?, dexterite = ?, charisme = ?, memoire = ?, volonte = ?, sante = ?, degats = ?, origines = ?, rencontres = ?, notes = ?, equipement = ?, fetiches = ?, trigger_effects = ?, bonuses = ?, avatar = ?, avatar_distant = ?, last_sync_at = ? WHERE id = ?`,
          [remoteId, ...baseValues, localId],
        );
      } else {
        console.log(`Creating local character ${localId} from remote ${remoteId}`);
        await db.runAsync(
          `INSERT INTO characters (id, distant_id, name, profession, profession_id, profession_score, hobby_id, hobby_score, divinity_id, voie_id, voie_score, intelligence, force, dexterite, charisme, memoire, volonte, sante, degats, origines, rencontres, notes, equipement, fetiches, trigger_effects, bonuses, avatar, avatar_distant, last_sync_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [localId, remoteId, ...baseValues],
        );
      }

      await importDesk(db, localId, remoteId);
      await importCharacterSkills(db, localId, remoteId);
      await importCharacterCapacites(db, localId, remoteId);
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
    await db.runAsync("DELETE FROM desk WHERE character_id = ?", [localId]);
    const res = await apiFetch(
      `${API_URL}/desk?filter=character_id,eq,${remoteId}`,
    );
    if (!res.ok) return;
    const json = await res.json();
    const rows = json.records ?? json;
    for (const row of rows) {
      await db.runAsync(
        "INSERT INTO desk (character_id, figure, cards, last_sync_at) VALUES (?, ?, ?, ?)",
        [localId, row.figure, row.cards, row.last_sync_at ?? new Date().toISOString()],
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
    await db.runAsync(
      "DELETE FROM character_skills WHERE character_id = ?",
      [localId],
    );
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
        "INSERT INTO character_skills (character_id, skill_id, level, distant_id, last_sync_at) VALUES (?, ?, ?, ?, ?)",
        [
          localId,
          skill[0].id,
          row.level,
          row.id,
          row.last_sync_at ?? new Date().toISOString(),
        ],
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
    await db.runAsync(
      "DELETE FROM character_capacites WHERE character_id = ?",
      [localId],
    );
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
        "INSERT INTO character_capacites (character_id, capacite_id, level, distant_id, last_sync_at) VALUES (?, ?, ?, ?, ?)",
        [
          localId,
          cap[0].id,
          row.level,
          row.id,
          row.last_sync_at ?? new Date().toISOString(),
        ],
      );
    }
  } catch (e) {
    console.error("Failed to import character_capacites", e);
  }
}
