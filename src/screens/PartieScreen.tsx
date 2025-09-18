import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TextInput,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import * as MailComposer from "expo-mail-composer";
import * as FileSystem from "expo-file-system";
import Layout from "@/components/ui/Layout";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/utils/api";
import { getDb } from "@/data/db";

type PartyRecord = {
  id: number;
  [key: string]: any;
};

type ScreenView = "menu" | "player" | "mj";

type NormalizedQrCode =
  | {
      type: "base64";
      displayUri: string;
      base64: string;
      mimeType: string;
      extension: string;
    }
  | {
      type: "remote";
      displayUri: string;
      remoteUri: string;
      extension: string;
    };

const QR_CODE_FIELD_KEYS = [
  "qr_code",
  "qrCode",
  "qr_code_data",
  "qrData",
  "code_qr",
];

const DIRECTUS_ASSET_BASE_URL = "https://api.scriptonautes.net";
const DIRECTUS_ASSET_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildRemoteQrCode(url: string): NormalizedQrCode {
  const withoutParams = url.split(/[?#]/)[0];
  const parts = withoutParams.split(".");
  const potentialExt = parts.length > 1 ? parts.pop() : null;
  const extension =
    potentialExt && /^[a-z0-9]+$/i.test(potentialExt)
      ? potentialExt.toLowerCase()
      : "png";

  return {
    type: "remote",
    displayUri: url,
    remoteUri: url,
    extension,
  };
}

function extractFromParsedQrValue(
  value: unknown,
  seen: Set<string>,
): NormalizedQrCode | null {
  if (typeof value === "string") {
    return normalizeQrCodeValue(value, seen);
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalized = extractFromParsedQrValue(entry, seen);
      if (normalized) {
        return normalized;
      }
    }
    return null;
  }

  if (value && typeof value === "object") {
    const candidates: unknown[] = [];

    const record = value as Record<string, unknown>;
    const potentialKeys = [
      "qr_code",
      "qrCode",
      "qr_code_data",
      "qrData",
      "data",
      "base64",
      "value",
      "url",
      "uri",
      "remoteUri",
      "asset",
      "asset_id",
      "file",
      "fileId",
      "directusId",
      "id",
      "path",
    ];

    for (const key of potentialKeys) {
      if (!(key in record)) {
        continue;
      }
      const candidateValue = record[key];
      if (candidateValue == null) {
        continue;
      }
      if (candidateValue === value) {
        continue;
      }
      candidates.push(candidateValue);
    }

    for (const candidate of candidates) {
      const normalized = extractFromParsedQrValue(candidate, seen);
      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
}

function guessExtensionFromMimeType(mimeType: string | null): string {
  if (!mimeType) {
    return "png";
  }

  const normalized = mimeType.toLowerCase();

  if (normalized.includes("jpeg") || normalized.includes("jpg")) {
    return "jpg";
  }
  if (normalized.includes("gif")) {
    return "gif";
  }
  if (normalized.includes("webp")) {
    return "webp";
  }
  if (normalized.includes("svg")) {
    return "svg";
  }
  if (normalized.includes("bmp")) {
    return "bmp";
  }
  if (normalized.includes("png")) {
    return "png";
  }

  const subtype = normalized.split("/")[1];
  if (subtype) {
    return subtype.split("+")[0];
  }

  return "png";
}

function normalizeQrCodeValue(
  rawValue: unknown,
  seen?: Set<string>,
): NormalizedQrCode | null {
  if (rawValue == null) {
    return null;
  }

  if (typeof rawValue !== "string") {
    const visited = seen ?? new Set<string>();
    return extractFromParsedQrValue(rawValue, visited);
  }

  const visited = seen ?? new Set<string>();
  if (visited.has(rawValue)) {
    return null;
  }
  visited.add(rawValue);

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  if (
    trimmed.startsWith("{") ||
    trimmed.startsWith("[") ||
    trimmed.startsWith("\"")
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      const normalizedFromParsed = extractFromParsedQrValue(parsed, visited);
      if (normalizedFromParsed) {
        return normalizedFromParsed;
      }
    } catch {
      // Ignore JSON parsing errors and continue with the raw string value
    }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return buildRemoteQrCode(trimmed);
  }

  if (DIRECTUS_ASSET_ID_REGEX.test(trimmed)) {
    return buildRemoteQrCode(`${DIRECTUS_ASSET_BASE_URL}/assets/${trimmed}`);
  }

  const withoutLeadingSlashes = trimmed.replace(/^\/+/, "");
  if (withoutLeadingSlashes.toLowerCase().startsWith("assets/")) {
    return buildRemoteQrCode(
      `${DIRECTUS_ASSET_BASE_URL}/${withoutLeadingSlashes}`,
    );
  }

  if (trimmed.startsWith("data:")) {
    const mimeMatch = trimmed.match(/^data:([^;]+);/i);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
    const base64Index = trimmed.indexOf("base64,");
    const base64Data =
      base64Index >= 0
        ? trimmed.slice(base64Index + "base64,".length)
        : trimmed.split(",").pop() ?? "";

    if (!base64Data) {
      return null;
    }

    return {
      type: "base64",
      displayUri: trimmed,
      base64: base64Data,
      mimeType,
      extension: guessExtensionFromMimeType(mimeType),
    };
  }

  return {
    type: "base64",
    displayUri: `data:image/png;base64,${trimmed}`,
    base64: trimmed,
    mimeType: "image/png",
    extension: "png",
  };
}

function parsePartiesResponse(rawText: string): PartyRecord[] {
  if (!rawText) return [];

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    console.warn("Failed to parse parties response as JSON", error);
    return [];
  }

  const candidates: any[] = [];
  if (parsed && typeof parsed === "object") {
    if (Array.isArray(parsed.records)) {
      candidates.push(parsed.records);
    }
    if (Array.isArray(parsed.data)) {
      candidates.push(parsed.data);
    }
  }
  if (Array.isArray(parsed)) {
    candidates.push(parsed);
  }

  for (const candidate of candidates) {
    const normalized = candidate
      .filter(
        (item: any): item is PartyRecord =>
          item &&
          typeof item === "object" &&
          Number.isFinite(Number((item as any).id)),
      )
      .map((item: any) => ({
        ...item,
        id: Number(item.id),
      }));

    if (normalized.length > 0 || candidate.length === 0) {
      return normalized;
    }
  }

  return [];
}

function extractScenarioId(party: PartyRecord): number | null {
  const candidates = [
    party.scenario_id,
    party.scenarioId,
    party.scenario,
    party.scenarioID,
    party.scenario_distant_id,
  ];

  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getPartyDisplayName(party: PartyRecord): string {
  const candidates = [
    typeof party.nom === "string" ? party.nom : null,
    typeof party.name === "string" ? party.name : null,
    typeof party.title === "string" ? party.title : null,
    typeof party.titre === "string" ? party.titre : null,
    typeof party.label === "string" ? party.label : null,
  ];

  for (const value of candidates) {
    if (value) {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return `Partie #${party.id}`;
}

function extractStringField(party: PartyRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = party[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return null;
}

function extractQrCodeRawValue(party: PartyRecord): unknown {
  for (const key of QR_CODE_FIELD_KEYS) {
    if (!(key in party)) {
      continue;
    }

    const value = party[key];
    if (value === null || value === undefined) {
      continue;
    }

    return value;
  }

  return null;
}

export default function PartieScreen() {
  const [view, setView] = useState<ScreenView>("menu");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mjParties, setMjParties] = useState<PartyRecord[]>([]);
  const [scenarioTitles, setScenarioTitles] = useState<Record<number, string>>({});
  const [emailValues, setEmailValues] = useState<Record<number, string>>({});
  const [emailSending, setEmailSending] = useState<Record<number, boolean>>({});

  const handleBackToMenu = useCallback(() => {
    setView("menu");
    setError(null);
  }, []);

  const handleShowPlayerParties = useCallback(() => {
    setView("player");
    setError(null);
  }, []);

  const handleShowMjParties = useCallback(async () => {
    setError(null);
    const storedUser = await SecureStore.getItemAsync("user");
    if (!storedUser) {
      Alert.alert(
        "Connexion requise",
        "Vous devez être connecté pour consulter vos parties en tant que MJ.",
      );
      return;
    }

    let parsedUser: any = null;
    try {
      parsedUser = JSON.parse(storedUser);
    } catch (parseError) {
      console.error("Unable to parse stored user", parseError);
      Alert.alert(
        "Erreur",
        "Impossible de récupérer vos informations utilisateur.",
      );
      return;
    }

    const userId = Number(parsedUser?.id);
    if (!Number.isFinite(userId)) {
      Alert.alert("Erreur", "Identifiant utilisateur invalide.");
      return;
    }

    setView("mj");
    setLoading(true);
    setMjParties([]);
    setScenarioTitles({});

    try {
      const res = await apiFetch(
        `https://api.scriptonautes.net/api/records/parties?filter=mj_id,eq,${encodeURIComponent(
          String(userId),
        )}`,
      );

      const rawText = await res.text();
      if (!res.ok) {
        throw new Error(
          rawText || "Impossible de récupérer vos parties pour le moment.",
        );
      }

      const partiesData = parsePartiesResponse(rawText);
      setMjParties(partiesData);

      if (partiesData.length > 0) {
        const scenarioIds = Array.from(
          new Set(
            partiesData
              .map(extractScenarioId)
              .filter((value): value is number => value !== null),
          ),
        );

        if (scenarioIds.length > 0) {
          const db = getDb();
          const titles: Record<number, string> = {};

          for (const id of scenarioIds) {
            try {
              const row = (await db.getFirstAsync(
                "SELECT titre FROM scenarios WHERE id = ?",
                [id],
              )) as { titre?: string } | null;
              const title = row?.titre;
              if (typeof title === "string" && title.trim().length > 0) {
                titles[id] = title.trim();
              }
            } catch (dbError) {
              console.warn(`Failed to load scenario ${id}`, dbError);
            }
          }

          setScenarioTitles(titles);
        }
      }
    } catch (err) {
      console.error("Failed to load MJ parties", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer vos parties pour le moment.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEmailChange = useCallback((partyId: number, value: string) => {
    setEmailValues((prev) => ({
      ...prev,
      [partyId]: value,
    }));
  }, []);

  const sendQrCodeByEmail = useCallback(
    async (party: PartyRecord) => {
      const partyId = party.id;
      const emailInput = emailValues[partyId]?.trim() ?? "";

      if (!emailInput) {
        Alert.alert(
          "Adresse email requise",
          "Veuillez saisir au moins une adresse email pour envoyer le QR Code.",
        );
        return;
      }

      const recipients = emailInput
        .split(/[;,\s]+/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);

      if (recipients.length === 0) {
        Alert.alert(
          "Adresse email invalide",
          "Le champ ne contient aucune adresse email valide.",
        );
        return;
      }

      const qrCodeRaw = extractQrCodeRawValue(party);
      const normalizedQr = normalizeQrCodeValue(qrCodeRaw);

      if (!normalizedQr) {
        Alert.alert(
          "QR Code indisponible",
          "Aucun QR Code n'est associé à cette partie.",
        );
        return;
      }

      setEmailSending((prev) => ({ ...prev, [partyId]: true }));

      let tempFileUri: string | null = null;

      try {
        const isAvailable = await MailComposer.isAvailableAsync();
        if (!isAvailable) {
          throw new Error("mail_composer_unavailable");
        }

        const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
        if (!directory) {
          throw new Error("file_system_unavailable");
        }

        if (normalizedQr.type === "remote") {
          const targetUri = `${directory}party-${partyId}-qr.${normalizedQr.extension}`;
          const downloadResult = await FileSystem.downloadAsync(
            normalizedQr.remoteUri,
            targetUri,
          );
          tempFileUri = downloadResult.uri;
        } else {
          const targetUri = `${directory}party-${partyId}-qr.${normalizedQr.extension}`;
          await FileSystem.writeAsStringAsync(targetUri, normalizedQr.base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          tempFileUri = targetUri;
        }

        if (!tempFileUri) {
          throw new Error("attachment_creation_failed");
        }

        const result = await MailComposer.composeAsync({
          recipients,
          subject: `QR Code - ${getPartyDisplayName(party)}`,
          body: `Bonjour,\n\nVeuillez trouver ci-joint le QR Code de la partie ${getPartyDisplayName(
            party,
          )}.\n\nÀ bientôt !`,
          attachments: [tempFileUri],
        });

        if (result.status === MailComposer.MailComposerStatus.SENT) {
          Alert.alert("Email envoyé", "Votre message a été envoyé avec succès.");
        } else if (result.status === MailComposer.MailComposerStatus.SAVED) {
          Alert.alert(
            "Email enregistré",
            "Votre message a été enregistré dans les brouillons.",
          );
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === "mail_composer_unavailable") {
            Alert.alert(
              "Fonctionnalité indisponible",
              "L'envoi d'email n'est pas supporté sur cet appareil.",
            );
          } else if (err.message === "file_system_unavailable") {
            Alert.alert(
              "Stockage indisponible",
              "Impossible d'accéder au stockage temporaire pour créer la pièce jointe.",
            );
          } else {
            console.error("Failed to send QR code email", err);
            Alert.alert(
              "Erreur",
              "Impossible de préparer l'envoi du QR Code pour le moment.",
            );
          }
        } else {
          console.error("Failed to send QR code email", err);
          Alert.alert(
            "Erreur",
            "Impossible de préparer l'envoi du QR Code pour le moment.",
          );
        }
      } finally {
        setEmailSending((prev) => {
          const updated = { ...prev };
          delete updated[partyId];
          return updated;
        });

        if (tempFileUri) {
          try {
            await FileSystem.deleteAsync(tempFileUri, { idempotent: true });
          } catch (cleanupError) {
            console.warn("Unable to clean temporary QR code file", cleanupError);
          }
        }
      }
    },
    [emailValues],
  );

  const renderMjContent = () => {
    if (loading) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      );
    }

    if (error) {
      return (
        <View>
          <Text className="text-red-300 text-base mb-4">{error}</Text>
          <Button variant="primary" size="md" onPress={handleShowMjParties}>
            Réessayer
          </Button>
        </View>
      );
    }

    if (mjParties.length === 0) {
      return (
        <View>
          <Text className="text-white text-base">
            Aucune partie trouvée pour le moment.
          </Text>
          <Button
            variant="secondary"
            size="md"
            className="mt-4"
            onPress={handleShowMjParties}
          >
            Actualiser la liste
          </Button>
        </View>
      );
    }

    return (
      <View>
        {mjParties.map((party) => {
          const scenarioId = extractScenarioId(party);
          const scenarioLabel =
            scenarioId !== null
              ? scenarioTitles[scenarioId] ?? `Scénario #${scenarioId}`
              : null;
          const code = extractStringField(party, [
            "code",
            "code_partie",
            "codePartie",
          ]);
          const status = extractStringField(party, [
            "status",
            "etat",
            "state",
          ]);
          const createdAt = extractStringField(party, [
            "created_at",
            "createdAt",
            "creation_date",
          ]);
          const qrCodeValue = extractQrCodeRawValue(party);
          const normalizedQrCode = normalizeQrCodeValue(qrCodeValue);
          const isSending = Boolean(emailSending[party.id]);
          const emailValue = emailValues[party.id] ?? "";

          return (
            <View
              key={party.id}
              className="bg-white/10 rounded-xl p-4 mb-4"
            >
              <Text className="text-white text-lg font-semibold mb-1">
                {getPartyDisplayName(party)}
              </Text>
              {scenarioLabel && (
                <Text className="text-white/80 text-sm mb-1">
                  Scénario : {scenarioLabel}
                </Text>
              )}
              {code && (
                <Text className="text-white/80 text-sm mb-1">Code : {code}</Text>
              )}
              {status && (
                <Text className="text-white/80 text-sm mb-1">
                  Statut : {status}
                </Text>
              )}
              {createdAt && (
                <Text className="text-white/80 text-sm">
                  Créée le : {createdAt}
                </Text>
              )}
              {normalizedQrCode && (
                <View className="items-center mt-4 mb-2">
                  <Image
                    source={{ uri: normalizedQrCode.displayUri }}
                    style={{ width: 200, height: 200 }}
                    resizeMode="contain"
                  />
                </View>
              )}
              <View className="mt-2">
                <Text className="text-white/80 text-sm mb-2">
                  Envoyer par mail
                </Text>
                <TextInput
                  className="bg-white text-black px-3 py-2 rounded-lg"
                  placeholder="Saisissez les adresses email"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={emailValue}
                  onChangeText={(text) => handleEmailChange(party.id, text)}
                />
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3 self-start"
                  onPress={() => {
                    void sendQrCodeByEmail(party);
                  }}
                  disabled={isSending}
                >
                  {isSending ? "Envoi..." : "Envoyer par mail"}
                </Button>
              </View>
            </View>
          );
        })}
        <Button
          variant="secondary"
          size="md"
          className="mt-2"
          onPress={handleShowMjParties}
        >
          Actualiser
        </Button>
      </View>
    );
  };

  return (
    <Layout backgroundColor="gradient" variant="scroll">
      <View className="flex-1 p-4">
        {view === "menu" && (
          <View>
            <Text className="text-white text-2xl font-bold text-center mb-6">
              Gestion des parties
            </Text>
            <Button
              variant="primary"
              size="md"
              className="mb-4"
              onPress={handleShowPlayerParties}
            >
              Mes Parties (Joueur)
            </Button>
            <Button
              variant="secondary"
              size="md"
              onPress={handleShowMjParties}
            >
              Mes Parties (MJ)
            </Button>
          </View>
        )}

        {view === "player" && (
          <View className="flex-1">
            <Button
              variant="secondary"
              size="sm"
              className="self-start mb-4"
              onPress={handleBackToMenu}
            >
              ← Retour
            </Button>
            <Text className="text-white text-base leading-6">
              Retrouvez ici vos parties en tant que joueur prochainement. En
              attendant, vous pouvez rejoindre une partie depuis l'onglet
              "Scénarios" ou via un code partagé par votre MJ.
            </Text>
          </View>
        )}

        {view === "mj" && (
          <View className="flex-1">
            <Button
              variant="secondary"
              size="sm"
              className="self-start mb-4"
              onPress={handleBackToMenu}
            >
              ← Retour
            </Button>
            {renderMjContent()}
          </View>
        )}
      </View>
    </Layout>
  );
}
