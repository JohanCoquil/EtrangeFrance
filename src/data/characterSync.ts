import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system";
import { getDb } from "./db";

const API_URL = "https://api.scriptonautes.net/api/records";

export async function syncCharacters() {
  const db = getDb();
  const characters = (await db.getAllAsync(
    "SELECT * FROM characters WHERE distant_id = 0"
  )) as any[];

  const storedUser = await SecureStore.getItemAsync("user");
  const userId = storedUser ? JSON.parse(storedUser).id : null;
  if (!userId) {
    console.warn("No user ID found, skipping character sync");
    return;
  }

  for (const char of characters) {
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

    try {
      console.log("POST /characters", payload);
      const res = await fetch(`${API_URL}/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `Failed to push character ${char.id}: ${res.status} ${res.statusText} - ${errorText}`
        );
        continue;
      }
      const json = await res.json();
      const remoteId = json.id ?? json[0]?.id ?? json.records?.[0]?.id;
      if (!remoteId) continue;
      await db.runAsync(
        "UPDATE characters SET distant_id = ? WHERE id = ?",
        [remoteId, char.id]
      );

      if (char.avatar) {
        try {
          const localUri = FileSystem.documentDirectory + char.avatar;
          const remotePath = await uploadCharacterAvatar(localUri, remoteId);

          // push avatar path to remote record
          const patchRes = await fetch(`${API_URL}/characters/${remoteId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar_distant: remotePath }),
          });
          const patchText = await patchRes.text();
          console.log("PATCH /characters avatar", patchRes.status, patchText);

          if (!patchRes.ok) {
            console.error(
              `Failed to update remote avatar for ${char.id}: ${patchRes.status} ${patchRes.statusText} - ${patchText}`,
            );
          }

          await db.runAsync(
            "UPDATE characters SET avatar_distant = ? WHERE id = ?",
            [remotePath, char.id]
          );
        } catch (err) {
          console.error("Failed to upload avatar", err);
        }
      } else {
        console.log(`Character ${char.id} has no avatar to upload`);
      }

      await syncDesk(db, char.id, remoteId);
      await syncCharacterSkills(db, char.id, remoteId);
      await syncCharacterCapacites(db, char.id, remoteId);
    } catch (e) {
      console.error("Failed to push character", e);
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

async function uploadCharacterAvatar(localUri: string, characterId: number) {
  const apiUrl = `https://api.scriptonautes.net/upload.php?type=avatar&entity=characters&id=${characterId}`;
  const mimeType = getMimeType(localUri);

  console.log("Uploading avatar", { apiUrl, localUri, mimeType });

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
  remoteId: number
) {
  const rows = (await db.getAllAsync(
    "SELECT figure, cards FROM desk WHERE user_id = ?",
    [localId]
  )) as any[];
  for (const row of rows) {
    try {
      const payload = {
        user_id: remoteId,
        figure: row.figure,
        cards: row.cards,
      };
      console.log("POST /desk", payload);
      const res = await fetch(`${API_URL}/desk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `Failed to push desk row for character ${localId}: ${res.status} ${res.statusText} - ${errorText}`
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
  remoteId: number
) {
  const rows = (await db.getAllAsync(
    `SELECT cs.*, s.distant_id as skill_distant_id FROM character_skills cs JOIN skills s ON cs.skill_id = s.id WHERE cs.character_id = ? AND cs.distant_id = 0`,
    [localId]
  )) as any[];

  for (const row of rows) {
    try {
      const payload = {
        character_id: remoteId,
        skill_id: row.skill_distant_id,
        level: row.level,
      };
      console.log("POST /character_skills", payload);
      const res = await fetch(`${API_URL}/character_skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `Failed to push character_skills row for character ${localId}: ${res.status} ${res.statusText} - ${errorText}`
        );
        continue;
      }
      const json = await res.json();
      const newId = json.id ?? json[0]?.id ?? json.records?.[0]?.id;
      if (newId) {
        await db.runAsync(
          "UPDATE character_skills SET distant_id = ? WHERE character_id = ? AND skill_id = ?",
          [newId, localId, row.skill_id]
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
  remoteId: number
) {
  const rows = (await db.getAllAsync(
    `SELECT cc.*, c.distant_id as capacite_distant_id FROM character_capacites cc JOIN capacites c ON cc.capacite_id = c.id WHERE cc.character_id = ? AND cc.distant_id = 0`,
    [localId]
  )) as any[];

  for (const row of rows) {
    try {
      const payload = {
        character_id: remoteId,
        capacite_id: row.capacite_distant_id,
        level: row.level,
      };
      console.log("POST /character_capacites", payload);
      const res = await fetch(`${API_URL}/character_capacites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `Failed to push character_capacites row for character ${localId}: ${res.status} ${res.statusText} - ${errorText}`
        );
        continue;
      }
      const json = await res.json();
      const newId = json.id ?? json[0]?.id ?? json.records?.[0]?.id;
      if (newId) {
        await db.runAsync(
          "UPDATE character_capacites SET distant_id = ? WHERE character_id = ? AND capacite_id = ?",
          [newId, localId, row.capacite_id]
        );
      }
    } catch (e) {
      console.error("Failed to push character_capacites row", e);
    }
  }
}

