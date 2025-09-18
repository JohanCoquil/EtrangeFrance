import React, { useCallback, useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import * as MailComposer from "expo-mail-composer";
import * as FileSystem from "expo-file-system";
import * as Brightness from "expo-brightness";
import * as Sharing from "expo-sharing";
import QRCode from 'react-native-qrcode-svg';
import Layout from "@/components/ui/Layout";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/utils/api";
import { getDb } from "@/data/db";

type PartyRecord = {
  id: number;
  [key: string]: any;
};

type ScreenView = "menu" | "player" | "mj";

type NormalizedQrCode = {
  displayUri: string;
  base64: string;
  mimeType: string;
  extension: string;
};

type AccordionSectionsState = Record<number, {
  qr: boolean;
  participants: boolean;
}>;

type PartyParticipantsState = {
  pseudos: string[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
};

type ParticipantsByPartyState = Record<number, PartyParticipantsState>;

const QR_CODE_FIELD_KEYS = [
  "qr_code",
  "qrCode",
  "qr_code_data",
  "qrData",
  "code_qr",
];

// Fonction pour générer un QR code à partir de texte (UUID)
async function generateQRCodeFromText(text: string): Promise<NormalizedQrCode | null> {
  try {
    // Utiliser directement QR Server (plus fiable que Google Charts)
    const qrServerUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&ecc=M&margin=10&data=${encodeURIComponent(text)}`;

    console.log('Génération QR code pour:', text);
    console.log('URL QR Server:', qrServerUrl);

    // Télécharger l'image et la sauvegarder temporairement
    const tempUri = `${FileSystem.cacheDirectory}temp_qr_${Date.now()}.png`;
    const downloadResult = await FileSystem.downloadAsync(qrServerUrl, tempUri);

    if (!downloadResult.uri) {
      throw new Error('Failed to download QR code from QR Server');
    }

    console.log('QR code téléchargé vers:', downloadResult.uri);

    // Lire le fichier en base64
    const base64Data = await FileSystem.readAsStringAsync(tempUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Nettoyer le fichier temporaire
    await FileSystem.deleteAsync(tempUri, { idempotent: true });

    // Vérifier que le base64 est valide
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Invalid base64 data from QR Server');
    }

    console.log('QR Code base64 length:', base64Data.length);
    console.log('QR Code base64 preview:', base64Data.substring(0, 50) + '...');

    return {
      displayUri: `data:image/png;base64,${base64Data}`,
      base64: base64Data,
      mimeType: "image/png",
      extension: "png",
    };
  } catch (error) {
    console.error('Erreur génération QR code:', error);
    return null;
  }
}


// Fonction simplifiée : génère toujours un QR code à partir du texte
async function generateQRCodeFromUUID(uuid: string): Promise<NormalizedQrCode | null> {
  if (!uuid || typeof uuid !== "string") {
    return null;
  }

  const trimmed = uuid.trim();
  if (!trimmed) {
    return null;
  }

  // Générer directement le QR code à partir du texte
  return await generateQRCodeFromText(trimmed);
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

function formatDateToFrench(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const pad = (input: number) => String(input).padStart(2, "0");
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${day}/${month}/${year} ${hours}h${minutes}`;
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
  const [qrCodeCache, setQrCodeCache] = useState<Record<string, NormalizedQrCode>>({});
  const [fullScreenQR, setFullScreenQR] = useState<string | null>(null);
  const [originalBrightness, setOriginalBrightness] = useState<number>(0.5);
  const [tempFiles, setTempFiles] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<AccordionSectionsState>({});
  const [participantsState, setParticipantsState] = useState<ParticipantsByPartyState>({});

  // Restaurer la luminosité et nettoyer les fichiers temporaires quand le composant se démonte
  useEffect(() => {
    return () => {
      if (originalBrightness !== 0.5) {
        Brightness.setBrightnessAsync(originalBrightness).catch(console.error);
      }

      // Nettoyer tous les fichiers temporaires
      tempFiles.forEach(async (fileUri) => {
        try {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        } catch (error) {
          console.warn("Unable to clean temporary file:", fileUri, error);
        }
      });
    };
  }, [originalBrightness, tempFiles]);

  // Fonction pour afficher le QR code en plein écran avec luminosité maximale
  const showQRCodeFullScreen = useCallback(async (qrCodeText: string) => {
    try {
      // Sauvegarder la luminosité actuelle
      const currentBrightness = await Brightness.getBrightnessAsync();
      setOriginalBrightness(currentBrightness);

      // Mettre la luminosité au maximum
      await Brightness.setBrightnessAsync(1.0);

      // Afficher le QR code en plein écran
      setFullScreenQR(qrCodeText);
    } catch (error) {
      console.error('Erreur lors de l\'affichage plein écran:', error);
    }
  }, []);

  // Fonction pour fermer l'affichage plein écran et restaurer la luminosité
  const hideQRCodeFullScreen = useCallback(async () => {
    try {
      // Restaurer la luminosité originale
      await Brightness.setBrightnessAsync(originalBrightness);

      // Fermer l'affichage plein écran
      setFullScreenQR(null);
    } catch (error) {
      console.error('Erreur lors de la fermeture plein écran:', error);
    }
  }, [originalBrightness]);

  // Composant pour afficher un QR code avec génération asynchrone
  const QRCodeDisplay = ({ party }: { party: PartyRecord }) => {
    const [loading, setLoading] = useState(true);
    const [qrCodeText, setQrCodeText] = useState<string | null>(null);

    useEffect(() => {
      const loadQRCode = async () => {
        const qrCodeRaw = extractQrCodeRawValue(party);
        if (qrCodeRaw) {
          setQrCodeText(String(qrCodeRaw));
        }
        setLoading(false);
      };
      loadQRCode();
    }, [party]);

    if (loading) {
      return (
        <View className="items-center mt-4 mb-2">
          <ActivityIndicator size="small" color="#ffffff" />
          <Text className="text-white/60 text-sm mt-2">Génération du QR code...</Text>
        </View>
      );
    }

    if (!qrCodeText) return null;

    return (
      <View className="items-center mt-4 mb-2">
        <TouchableOpacity
          onPress={() => showQRCodeFullScreen(qrCodeText)}
          activeOpacity={0.8}
        >
          <QRCode
            value={qrCodeText}
            size={200}
            color="#000000"
            backgroundColor="#FFFFFF"
          />
        </TouchableOpacity>
        <Text className="text-white/60 text-xs mt-2 text-center">
          Appuyez sur le QR code pour l'afficher en plein écran
        </Text>
      </View>
    );
  };

  // Fonction simplifiée pour générer un QR code à partir d'un UUID
  const getOrGenerateQRCode = useCallback(async (rawValue: unknown): Promise<NormalizedQrCode | null> => {
    if (!rawValue) return null;

    const textValue = String(rawValue);

    // Vérifier le cache d'abord
    if (qrCodeCache[textValue]) {
      return qrCodeCache[textValue];
    }

    // Générer le QR code à partir du texte
    try {
      const generated = await generateQRCodeFromUUID(textValue);
      if (generated) {
        // Mettre en cache
        setQrCodeCache(prev => ({ ...prev, [textValue]: generated }));
        return generated;
      }
    } catch (error) {
      console.error('Erreur génération QR code:', error);
    }

    return null;
  }, [qrCodeCache]);

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
    setExpandedSections({});
    setParticipantsState({});

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
      const normalizedQr = await generateQRCodeFromText(String(qrCodeRaw));

      if (!normalizedQr) {
        Alert.alert(
          "QR Code indisponible",
          "Aucun QR Code n'est associé à cette partie.",
        );
        return;
      }

      setEmailSending((prev) => ({ ...prev, [partyId]: true }));

      let qrCodeFileUri: string | null = null;

      try {
        const isAvailable = await MailComposer.isAvailableAsync();
        if (!isAvailable) {
          throw new Error("mail_composer_unavailable");
        }

        // Récupérer le login de l'utilisateur connecté
        const storedUser = await SecureStore.getItemAsync("user");
        let userLogin = "Un maître de jeu";
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            userLogin = parsedUser?.login || parsedUser?.username || "Un maître de jeu";
          } catch (error) {
            console.warn("Erreur parsing utilisateur:", error);
          }
        }

        // Récupérer le nom du scénario
        const scenarioId = extractScenarioId(party);
        const scenarioName = scenarioId ? scenarioTitles[scenarioId] : null;

        // Créer le fichier QR code pour la pièce jointe
        const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
        if (!directory) {
          throw new Error("file_system_unavailable");
        }

        qrCodeFileUri = `${directory}qrcode_${partyId}.png`;
        await FileSystem.writeAsStringAsync(qrCodeFileUri, normalizedQr.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Ajouter le fichier à la liste des fichiers temporaires pour nettoyage ultérieur
        setTempFiles(prev => [...prev, qrCodeFileUri!]);
        console.log('Fichier QR code créé et ajouté à la liste temporaire:', qrCodeFileUri);

        // Contenu HTML de l'email
        const htmlBody = `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                            
              <p>Bonjour,</p>
              <br/><br/>
              <p><strong><b>${userLogin}</b></strong> vous invite à rejoindre une partie de jeu de rôle <strong><b>"Étrange France"</b></strong> !</p>
              <br/><br/>
              ${scenarioName ? `<p><strong><b>Scénario :</b></strong> ${scenarioName}</p>` : ''}
              <br/><br/>
                           
              <div style="background-color: #e8f4fd; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #2c3e50; margin-top: 0;"><b>Instructions :</b></h3><br/>
                <ol style="margin: 0; padding-left: 20px;">
                  <li> • Ouvrez l'application <strong><b>"Étrange France"</b></strong> sur votre mobile</li>
                  <li> • Scannez le QR Code en pièce jointe</li>
                  <li> • Vous serez automatiquement connecté(e) à la partie</li>
                </ol>
              </div>
              <br/><br/>
              <p style="text-align: center; font-style: italic; color: #7f8c8d; margin-top: 30px;">
                Bonne aventure dans l'Étrange France !<br>
              </p>
              
             
            </body>
          </html>
        `;

        const result = await MailComposer.composeAsync({
          recipients,
          subject: "🎲 Invitation - JdR Etrange France",
          body: htmlBody,
          isHtml: true,
          attachments: [qrCodeFileUri],
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

        // Les fichiers temporaires seront nettoyés à la fermeture de l'écran
      }
    },
    [emailValues, scenarioTitles, tempFiles],
  );


  const shareQrCodeImage = useCallback(
    async (party: PartyRecord) => {
      try {
        const qrCodeRaw = extractQrCodeRawValue(party);
        const normalizedQr = await generateQRCodeFromText(String(qrCodeRaw));

        if (!normalizedQr) {
          Alert.alert(
            "QR Code indisponible",
            "Aucun QR Code n'est associé à cette partie.",
          );
          return;
        }

        // Créer le fichier QR code temporaire
        const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
        if (!directory) {
          throw new Error("file_system_unavailable");
        }

        const qrCodeFileUri = `${directory}qrcode_share_${party.id}.png`;
        await FileSystem.writeAsStringAsync(qrCodeFileUri, normalizedQr.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Ajouter le fichier à la liste des fichiers temporaires
        setTempFiles(prev => [...prev, qrCodeFileUri]);

        // Vérifier si le partage est disponible
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert(
            "Fonctionnalité indisponible",
            "Le partage n'est pas supporté sur cet appareil.",
          );
          return;
        }

        // Partager l'image QR code
        await Sharing.shareAsync(qrCodeFileUri, {
          mimeType: "image/png",
          dialogTitle: "Partager le QR Code de la partie",
        });

      } catch (error) {
        console.error("Erreur partage QR code:", error);
        Alert.alert(
          "Erreur",
          "Impossible de partager le QR Code pour le moment.",
        );
      }
    },
    [tempFiles],
  );

  const fetchParticipantsForParty = useCallback(
    async (partyId: number) => {
      const existingState = participantsState[partyId];
      if (existingState?.loading || existingState?.loaded) {
        return;
      }

      setParticipantsState((prev) => ({
        ...prev,
        [partyId]: {
          pseudos: prev[partyId]?.pseudos ?? [],
          loading: true,
          error: null,
          loaded: false,
        },
      }));

      try {
        const res = await apiFetch(
          `https://api.scriptonautes.net/api/records/participants?filter=partie_id,eq,${encodeURIComponent(
            String(partyId),
          )}`,
        );

        const rawText = await res.text();

        if (!res.ok) {
          throw new Error(
            rawText || "Impossible de récupérer les participants pour le moment.",
          );
        }

        let parsed: any = null;

        if (rawText) {
          try {
            parsed = JSON.parse(rawText);
          } catch (parseError) {
            console.warn("Unable to parse participants response", parseError);
          }
        }

        let records: any[] = [];
        const candidateLists: any[] = [];

        if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.records)) {
            candidateLists.push(parsed.records);
          }
          if (Array.isArray(parsed.data)) {
            candidateLists.push(parsed.data);
          }
        }

        if (Array.isArray(parsed)) {
          candidateLists.push(parsed);
        }

        for (const candidate of candidateLists) {
          if (Array.isArray(candidate)) {
            records = candidate;
            break;
          }
        }

        if (!Array.isArray(records)) {
          records = [];
        }

        const pseudos = records.map((entry: any) => {
          const pseudoCandidates = [
            entry?.pseudo,
            entry?.pseudo_participant,
            entry?.pseudo_user,
            entry?.user?.pseudo,
            entry?.user?.login,
            entry?.user?.username,
            entry?.login,
            entry?.username,
            entry?.display_name,
            entry?.name,
          ];

          for (const candidate of pseudoCandidates) {
            if (typeof candidate === "string") {
              const trimmed = candidate.trim();
              if (trimmed.length > 0) {
                return trimmed;
              }
            }
          }

          const userId = entry?.user_id ?? entry?.userId;
          if (Number.isFinite(Number(userId))) {
            return `Utilisateur #${Number(userId)}`;
          }

          const participantId = entry?.id ?? entry?.participant_id ?? entry?.participantId;
          if (Number.isFinite(Number(participantId))) {
            return `Participant #${Number(participantId)}`;
          }

          return "Participant";
        });

        setParticipantsState((prev) => ({
          ...prev,
          [partyId]: {
            pseudos,
            loading: false,
            error: null,
            loaded: true,
          },
        }));
      } catch (err) {
        console.error("Failed to load participants", err);
        setParticipantsState((prev) => ({
          ...prev,
          [partyId]: {
            pseudos: prev[partyId]?.pseudos ?? [],
            loading: false,
            error:
              err instanceof Error
                ? err.message
                : "Impossible de récupérer les participants pour le moment.",
            loaded: false,
          },
        }));
      }
    },
    [participantsState],
  );

  const AccordionSection = ({
    label,
    isOpen,
    onToggle,
    children,
  }: {
    label: string;
    isOpen: boolean;
    onToggle: () => void;
    children: ReactNode;
  }) => (
    <View className="mt-4 border-t border-white/10 pt-3">
      <TouchableOpacity
        className="flex-row items-center justify-between"
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <Text className="text-white text-base font-semibold">{label}</Text>
        <Text className="text-white text-lg">{isOpen ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {isOpen && <View className="mt-3">{children}</View>}
    </View>
  );

  const toggleSection = useCallback(
    (partyId: number, section: keyof AccordionSectionsState[number]) => {
      const previousState = expandedSections[partyId] ?? { qr: false, participants: false };
      const wasParticipantsOpen = previousState.participants ?? false;

      setExpandedSections((prev) => {
        const current = prev[partyId] ?? { qr: false, participants: false };

        return {
          ...prev,
          [partyId]: {
            ...current,
            [section]: !current[section],
          },
        };
      });

      if (section === "participants" && !wasParticipantsOpen) {
        void fetchParticipantsForParty(partyId);
      }
    },
    [expandedSections, fetchParticipantsForParty],
  );

  const deleteParty = useCallback(
    async (party: PartyRecord) => {
      // Demander confirmation avant suppression
      Alert.alert(
        "Confirmer la suppression",
        `Êtes-vous sûr de vouloir supprimer la partie "${getPartyDisplayName(party)}" ?\n\nCette action est irréversible.`,
        [
          {
            text: "Annuler",
            style: "cancel",
          },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => {
              try {
                setLoading(true);

                const res = await apiFetch(
                  `https://api.scriptonautes.net/api/records/parties/${party.id}`,
                  {
                    method: "DELETE",
                  }
                );

                if (!res.ok) {
                  const errorText = await res.text();
                  throw new Error(errorText || "Impossible de supprimer la partie.");
                }

                Alert.alert(
                  "Partie supprimée",
                  "La partie a été supprimée avec succès.",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        // Recharger la liste des parties
                        void handleShowMjParties();
                      },
                    },
                  ]
                );
              } catch (error) {
                console.error("Erreur suppression partie:", error);
                Alert.alert(
                  "Erreur",
                  error instanceof Error
                    ? error.message
                    : "Impossible de supprimer la partie pour le moment."
                );
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    },
    [handleShowMjParties],
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
          const createdAtRaw = extractStringField(party, [
            "created_at",
            "createdAt",
            "creation_date",
          ]);
          const createdAt = formatDateToFrench(createdAtRaw) ?? createdAtRaw;
          const isEmailSending = Boolean(emailSending[party.id]);
          const emailValue = emailValues[party.id] ?? "";
          const isQrExpanded = expandedSections[party.id]?.qr ?? false;
          const isParticipantsExpanded = expandedSections[party.id]?.participants ?? false;
          const participantsInfo = participantsState[party.id];
          const participantsLoading = participantsInfo?.loading ?? !participantsInfo;
          const participantsError = participantsInfo?.error ?? null;
          const participantNames = participantsInfo?.pseudos ?? [];

          return (
            <View
              key={party.id}
              className="bg-white/10 rounded-xl p-4 mb-4"
            >
              <Text className="text-white text-lg font-semibold mb-1">
                Partie #{party.id}
              </Text>
              {scenarioLabel && (
                <Text className="text-white/80 text-sm mb-1">
                  Scénario : {scenarioLabel}
                </Text>
              )}
              {createdAt && (
                <Text className="text-white/80 text-sm">
                  Créée le : {createdAt}
                </Text>
              )}

              <AccordionSection
                label="QR Code"
                isOpen={isQrExpanded}
                onToggle={() => toggleSection(party.id, "qr")}
              >
                {code && (
                  <Text className="text-white/80 text-sm mb-1">Code : {code}</Text>
                )}
                {status && (
                  <Text className="text-white/80 text-sm mb-1">
                    Statut : {status}
                  </Text>
                )}
                <QRCodeDisplay party={party} />
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
                    disabled={isEmailSending}
                  >
                    {isEmailSending ? "Envoi..." : "Envoyer par mail"}
                  </Button>
                </View>

                <View className="mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-2 self-start"
                    onPress={() => {
                      void shareQrCodeImage(party);
                    }}
                  >
                    Partager QR Code
                  </Button>
                </View>

                <View className="mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2 self-start"
                    onPress={() => {
                      void deleteParty(party);
                    }}
                  >
                    🗑️ Supprimer la partie
                  </Button>
                </View>
              </AccordionSection>

              <AccordionSection
                label="Participants"
                isOpen={isParticipantsExpanded}
                onToggle={() => toggleSection(party.id, "participants")}
              >
                {participantsLoading && (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-white/80 text-sm ml-2">
                      Chargement des participants...
                    </Text>
                  </View>
                )}

                {!participantsLoading && participantsError && (
                  <View>
                    <Text className="text-red-300 text-sm mb-2">
                      {participantsError}
                    </Text>
                    <Button
                      variant="secondary"
                      size="sm"
                      onPress={() => {
                        void fetchParticipantsForParty(party.id);
                      }}
                    >
                      Réessayer
                    </Button>
                  </View>
                )}

                {!participantsLoading && !participantsError &&
                  participantNames.length === 0 && (
                    <Text className="text-white/80 text-sm">
                      Aucun participant pour le moment.
                    </Text>
                  )}

                {!participantsLoading && !participantsError &&
                  participantNames.length > 0 && (
                    <View>
                      {participantNames.map((pseudo, index) => (
                        <Text
                          key={`${party.id}-participant-${index}`}
                          className="text-white/80 text-sm mb-1"
                        >
                          • {pseudo}
                        </Text>
                      ))}
                    </View>
                  )}
              </AccordionSection>
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

      {/* Modal plein écran pour le QR code */}
      <Modal
        visible={!!fullScreenQR}
        transparent
        animationType="fade"
        onRequestClose={hideQRCodeFullScreen}
      >
        <TouchableOpacity
          className="flex-1 bg-black justify-center items-center"
          onPress={hideQRCodeFullScreen}
          activeOpacity={1}
        >
          <View className="items-center p-8">
            <QRCode
              value={fullScreenQR || ""}
              size={300}
              color="#000000"
              backgroundColor="#FFFFFF"
            />
            <Text className="text-white text-center mt-6 text-lg">
              Appuyez n'importe où pour fermer
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </Layout>
  );
}
