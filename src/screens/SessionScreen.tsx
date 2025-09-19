import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent, DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';
import Layout from '@/components/ui/Layout';
import Button from '@/components/ui/Button';
import CharacterSelectionModal from '@/components/CharacterSelectionModal';
import ActiveSessionScreen from './ActiveSessionScreen';
import {
  useSessionsByParty,
  useCreateSession,
  useUpdateSession,
  useJoinSession,
  useLeaveSession
} from '@/api/sessions';
import type { SessionRecord, SessionStatus, SessionParticipant } from '@/types/session';
import { apiFetch } from '@/utils/api';
import { Calendar, Clock, Users, Play, Pause, Square, Plus } from 'lucide-react-native';

const formatDateForMySQL = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

type SessionScreenProps = {
  partieId: number;
  partieName?: string;
  isMJ: boolean;
  onBack: () => void;
};

export default function SessionScreen({ partieId, partieName, isMJ, onBack }: SessionScreenProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionRecord | null>(null);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');
  const [newSessionDate, setNewSessionDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCharacterSelection, setShowCharacterSelection] = useState(false);
  const [selectedSessionForJoin, setSelectedSessionForJoin] = useState<SessionRecord | null>(null);
  const [activeSession, setActiveSession] = useState<SessionRecord | null>(null);
  const [hideCompletedSessions, setHideCompletedSessions] = useState(false);

  const { data: sessions, isLoading, error, refetch } = useSessionsByParty(partieId);

  // Filtrer les sessions selon les préférences
  const filteredSessions = sessions?.filter(session => {
    if (hideCompletedSessions && (session.status === 'completed' || session.status === 'cancelled')) {
      return false;
    }
    return true;
  }) || [];
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const joinSession = useJoinSession();
  const leaveSession = useLeaveSession();

  const fetchExistingParticipant = useCallback(
    async (sessionId: number, userId: number): Promise<SessionParticipant | null> => {
      try {
        const response = await apiFetch(
          `https://api.scriptonautes.net/api/records/session_participants?filter=session_id,eq,${sessionId}`
        );

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        const participants = (data.records ?? []) as SessionParticipant[];
        const participant = participants.find(part => String(part.user_id) === String(userId));

        return participant ?? null;
      } catch (fetchError) {
        console.error('Erreur lors de la vérification du participant existant:', fetchError);
        return null;
      }
    },
    []
  );

  const reactivateParticipant = useCallback(
    async (
      participantId: number,
      options: { characterId?: string | null; role?: SessionParticipant['role'] } = {}
    ): Promise<void> => {
      const now = new Date();
      const payload: Record<string, any> = {
        is_online: true,
        last_seen: formatDateForMySQL(now),
        left_at: null,
      };

      if (options.characterId !== undefined) {
        payload.character_id =
          options.characterId === null ? null : String(options.characterId);
      }

      if (options.role) {
        payload.role = options.role;
      }

      const response = await apiFetch(
        `https://api.scriptonautes.net/api/records/session_participants/${participantId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Impossible de mettre à jour la participation.');
      }
    },
    []
  );

  const getStatusColor = (status: SessionStatus): string => {
    switch (status) {
      case 'scheduled': return 'text-blue-400';
      case 'active': return 'text-green-400';
      case 'paused': return 'text-yellow-400';
      case 'completed': return 'text-gray-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-white';
    }
  };

  const getStatusIcon = (status: SessionStatus) => {
    switch (status) {
      case 'scheduled': return <Calendar color="#60a5fa" size={16} />;
      case 'active': return <Play color="#4ade80" size={16} />;
      case 'paused': return <Pause color="#facc15" size={16} />;
      case 'completed': return <Square color="#9ca3af" size={16} />;
      case 'cancelled': return <Square color="#ef4444" size={16} />;
      default: return <Clock color="#ffffff" size={16} />;
    }
  };

  const getStatusText = (status: SessionStatus): string => {
    switch (status) {
      case 'scheduled': return 'Programmée';
      case 'active': return 'En cours';
      case 'paused': return 'En pause';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleCreateSession = useCallback(async () => {
    if (!isMJ) {
      Alert.alert('Action non autorisée', 'Seul le MJ peut créer une session.');
      return;
    }

    if (!newSessionTitle.trim()) {
      Alert.alert('Erreur', 'Le titre de la session est requis.');
      return;
    }

    try {
      await createSession.mutateAsync({
        partie_id: partieId,
        name: newSessionTitle.trim(),
        description: newSessionDescription.trim() || undefined,
        scheduled_date: newSessionDate ? newSessionDate.toISOString() : undefined,
        status: 'scheduled',
      });

      setShowCreateModal(false);
      setShowDatePicker(false);
      setNewSessionTitle('');
      setNewSessionDescription('');
      setNewSessionDate(null);

      // Forcer le rechargement de la liste
      await refetch();
    } catch (error) {
      console.error('Erreur création session:', error);
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Impossible de créer la session.'
      );
    }
  }, [isMJ, partieId, newSessionTitle, newSessionDescription, newSessionDate, createSession, refetch]);

  const handleDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS !== 'ios') {
        return;
      }

      if (event.type === 'dismissed') {
        setShowDatePicker(false);
        return;
      }

      if (selectedDate) {
        setNewSessionDate(selectedDate);
      }

      setShowDatePicker(false);
    },
    [],
  );

  const handleShowDatePicker = useCallback(() => {
    if (Platform.OS !== 'android') {
      setShowDatePicker(true);
      return;
    }

    const initialDate = newSessionDate ?? new Date();

    DateTimePickerAndroid.open({
      value: initialDate,
      mode: 'date',
      is24Hour: true,
      onChange: (event, selectedDate) => {
        if (event.type !== 'set' || !selectedDate) {
          return;
        }

        const updatedDate = new Date(initialDate);
        updatedDate.setFullYear(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
        );

        DateTimePickerAndroid.open({
          value: updatedDate,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent, selectedTime) => {
            const dateWithNewDay = new Date(updatedDate);

            if (timeEvent.type !== 'set' || !selectedTime) {
              setNewSessionDate(dateWithNewDay);
              return;
            }

            dateWithNewDay.setHours(
              selectedTime.getHours(),
              selectedTime.getMinutes(),
              0,
              0,
            );
            setNewSessionDate(dateWithNewDay);
          },
        });
      },
    });
  }, [newSessionDate]);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setShowDatePicker(false);
  }, []);

  const handleUpdateSessionStatus = useCallback(async (session: SessionRecord, newStatus: SessionStatus) => {
    if (!isMJ) {
      Alert.alert('Action non autorisée', 'Seul le MJ peut modifier le statut d\'une session.');
      return;
    }

    try {
      const updates: any = { status: newStatus };

      if (newStatus === 'active' && !session.started_at) {
        updates.started_at = new Date().toISOString();
      } else if (newStatus === 'completed' && !session.ended_at) {
        updates.ended_at = new Date().toISOString();
      }

      await updateSession.mutateAsync({
        sessionId: session.id,
        updates,
      });

      // Forcer le rechargement de la liste
      await refetch();
    } catch (error) {
      console.error('Erreur mise à jour session:', error);
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Impossible de mettre à jour la session.'
      );
    }
  }, [isMJ, updateSession, refetch]);

  const handleJoinSession = useCallback(async (session: SessionRecord) => {
    if (isMJ) {
      // Le MJ rejoint directement sans choisir de personnage
      try {
        const storedUser = await SecureStore.getItemAsync('user');
        if (!storedUser) {
          Alert.alert('Erreur', 'Vous devez être connecté pour rejoindre une session.');
          return;
        }

        const user = JSON.parse(storedUser);
        const userId = Number(user.id);

        if (!Number.isFinite(userId)) {
          Alert.alert('Erreur', 'Identifiant utilisateur invalide.');
          return;
        }

        const existingParticipant = await fetchExistingParticipant(session.id, userId);

        if (existingParticipant) {
          await reactivateParticipant(existingParticipant.id, { role: 'master' });
        } else {
          await joinSession.mutateAsync({
            sessionId: session.id,
            userId,
            role: 'master',
            // Pas de characterId pour le MJ
          });
        }

        setActiveSession(session);
      } catch (error) {
        console.error('Erreur lors de la jonction MJ:', error);
        Alert.alert(
          'Erreur',
          error instanceof Error ? error.message : 'Impossible de rejoindre la session.'
        );
      }
    } else {
      // Les joueurs doivent choisir un personnage
      setSelectedSessionForJoin(session);
      setShowCharacterSelection(true);
    }
  }, [isMJ, joinSession, fetchExistingParticipant, reactivateParticipant]);

  const handleCharacterSelected = useCallback(async (character: any) => {
    if (!selectedSessionForJoin) return;

    const sessionToJoin = selectedSessionForJoin;

    const remoteIdCandidates = [
      character?.distant_id,
      character?.distantId,
      character?.remote_id,
      character?.remoteId,
    ];

    let remoteCharacterId: string | null = null;
    const hasRemoteIdentifier = remoteIdCandidates.some(
      (candidate) => candidate !== undefined && candidate !== null,
    );

    for (const candidate of remoteIdCandidates) {
      if (candidate === undefined || candidate === null) {
        continue;
      }

      const candidateString = String(candidate).trim();
      if (candidateString.length === 0 || candidateString === '0') {
        continue;
      }

      remoteCharacterId = candidateString;
      break;
    }

    if (!remoteCharacterId && !hasRemoteIdentifier) {
      if (character?.id !== undefined && character?.id !== null) {
        const fallback = String(character.id).trim();
        if (fallback.length > 0 && fallback !== '0') {
          remoteCharacterId = fallback;
        }
      }
    }

    if (!remoteCharacterId || remoteCharacterId === '0') {
      Alert.alert(
        'Synchronisation requise',
        "Ce personnage n'est pas encore synchronisé avec le serveur. Veuillez ouvrir la fiche du personnage et réessayer après la synchronisation.",
      );
      return;
    }

    try {
      const storedUser = await SecureStore.getItemAsync('user');
      if (!storedUser) {
        Alert.alert('Erreur', 'Vous devez être connecté pour rejoindre une session.');
        return;
      }

      const user = JSON.parse(storedUser);
      const userId = Number(user.id);

      if (!Number.isFinite(userId)) {
        Alert.alert('Erreur', 'Identifiant utilisateur invalide.');
        return;
      }

      const existingParticipant = await fetchExistingParticipant(sessionToJoin.id, userId);

      if (existingParticipant) {
        await reactivateParticipant(existingParticipant.id, {
          characterId: remoteCharacterId,
          role: 'player',
        });

        Alert.alert(
          'Succès',
          `Vous êtes de retour dans la session avec ${character.name} !`,
          [
            {
              text: 'OK',
              onPress: () => {
                setActiveSession(sessionToJoin);
              }
            }
          ]
        );
        return;
      }

      await joinSession.mutateAsync({
        sessionId: sessionToJoin.id,
        userId,
        characterId: remoteCharacterId,
        role: 'player',
      });

      Alert.alert(
        'Succès',
        `Vous avez rejoint la session avec ${character.name} !`,
        [
          {
            text: 'OK',
            onPress: () => {
              setActiveSession(sessionToJoin);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur rejoindre session:', error);
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Impossible de rejoindre la session.'
      );
    } finally {
      setShowCharacterSelection(false);
      setSelectedSessionForJoin(null);
    }
  }, [selectedSessionForJoin, joinSession, fetchExistingParticipant, reactivateParticipant]);

  const handleLeaveSession = useCallback(async (session: SessionRecord) => {
    try {
      const storedUser = await SecureStore.getItemAsync('user');
      if (!storedUser) {
        Alert.alert('Erreur', 'Vous devez être connecté pour quitter une session.');
        return;
      }

      const user = JSON.parse(storedUser);
      const userId = Number(user.id);

      if (!Number.isFinite(userId)) {
        Alert.alert('Erreur', 'Identifiant utilisateur invalide.');
        return;
      }

      await leaveSession.mutateAsync({
        sessionId: session.id,
        userId,
      });

      Alert.alert('Succès', 'Vous avez quitté la session.');
    } catch (error) {
      console.error('Erreur quitter session:', error);
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Impossible de quitter la session.'
      );
    }
  }, [leaveSession]);

  const renderSessionCard = (session: SessionRecord) => (
    <View key={session.id} className="bg-white/10 rounded-xl p-4 mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white text-lg font-semibold flex-1">
          {session.name}
        </Text>
        <View className="flex-row items-center">
          {getStatusIcon(session.status)}
          <Text className={`ml-2 text-sm ${getStatusColor(session.status)}`}>
            {getStatusText(session.status)}
          </Text>
        </View>
      </View>

      {session.description && (
        <Text className="text-white/80 text-sm mb-2">
          {session.description}
        </Text>
      )}

      {session.scheduled_date && (
        <View className="flex-row items-center mb-2">
          <Calendar color="#ffffff80" size={14} />
          <Text className="text-white/80 text-sm ml-2">
            {formatDate(session.scheduled_date)}
          </Text>
        </View>
      )}

      {session.started_at && (
        <View className="flex-row items-center mb-2">
          <Clock color="#ffffff80" size={14} />
          <Text className="text-white/80 text-sm ml-2">
            Commencée : {formatDate(session.started_at)}
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center">
          <Users color="#ffffff80" size={14} />
          <Text className="text-white/80 text-sm ml-2">
            Participants
          </Text>
        </View>

        <View className="flex-row gap-2">
          {isMJ && session.status === 'scheduled' && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => handleUpdateSessionStatus(session, 'active')}
            >
              Démarrer
            </Button>
          )}

          {isMJ && session.status === 'active' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => handleUpdateSessionStatus(session, 'paused')}
              >
                Pause
              </Button>
              <Button
                variant="primary"
                size="sm"
                onPress={() => handleUpdateSessionStatus(session, 'completed')}
              >
                Terminer
              </Button>
            </>
          )}

          {isMJ && session.status === 'paused' && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => handleUpdateSessionStatus(session, 'active')}
            >
              Reprendre
            </Button>
          )}

          {(session.status === 'active' || session.status === 'paused') && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => handleJoinSession(session)}
            >
              {isMJ ? 'Entrer en tant que MJ' : 'Entrer dans la session'}
            </Button>
          )}

          {session.status === 'scheduled' && (
            <Button
              variant="secondary"
              size="sm"
              onPress={() => handleJoinSession(session)}
            >
              {isMJ ? 'Entrer en tant que MJ' : 'Rejoindre'}
            </Button>
          )}
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <Layout backgroundColor="gradient" variant="scroll">
        <View className="flex-1 items-center justify-center p-4">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="text-white mt-4">Chargement des sessions...</Text>
        </View>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout backgroundColor="gradient" variant="scroll">
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-red-300 text-center mb-4">
            {error instanceof Error ? error.message : 'Erreur lors du chargement'}
          </Text>
          <Button variant="primary" size="md" onPress={() => refetch()}>
            Réessayer
          </Button>
        </View>
      </Layout>
    );
  }

  // Si une session est active, afficher l'écran de session active
  if (activeSession) {
    return (
      <ActiveSessionScreen
        session={activeSession}
        isMJ={isMJ}
        onBack={() => setActiveSession(null)}
      />
    );
  }

  return (
    <Layout backgroundColor="gradient" variant="scroll">
      <View className="flex-1 p-4">
        <View className={`flex-row items-center mb-6 ${isMJ ? 'justify-between' : ''}`}>
          <Button
            variant="secondary"
            size="sm"
            onPress={onBack}
          >
            ← Retour
          </Button>
          {isMJ && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => setShowCreateModal(true)}
            >
              <Plus color="#ffffff" size={16} />
              <Text className="text-white ml-1">Nouvelle session</Text>
            </Button>
          )}
        </View>

        <Text className="text-white text-2xl font-bold mb-2">
          Sessions
        </Text>
        {partieName && (
          <Text className="text-white/80 text-base mb-4">
            {partieName}
          </Text>
        )}

        {/* Filtres */}
        <View className="bg-white/10 rounded-xl p-4 mb-6">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => setHideCompletedSessions(!hideCompletedSessions)}
            activeOpacity={0.7}
          >
            <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${hideCompletedSessions ? 'bg-blue-500 border-blue-500' : 'border-white/50'
              }`}>
              {hideCompletedSessions && (
                <Text className="text-white text-xs">✓</Text>
              )}
            </View>
            <Text className="text-white text-sm">
              Cacher les sessions terminées
            </Text>
          </TouchableOpacity>
        </View>

        {sessions && sessions.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-white/80 text-center text-lg mb-4">
              Aucune session pour cette partie
            </Text>
            <Text className="text-white/60 text-center mb-6">
              {isMJ
                ? 'Créez votre première session pour commencer à jouer'
                : 'Demandez à votre MJ de planifier la prochaine session'}
            </Text>
            {isMJ && (
              <Button
                variant="primary"
                size="md"
                onPress={() => setShowCreateModal(true)}
              >
                Créer une session
              </Button>
            )}
          </View>
        ) : filteredSessions.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-white/80 text-center text-lg mb-4">
              Aucune session visible
            </Text>
            <Text className="text-white/60 text-center mb-6">
              {hideCompletedSessions
                ? "Décochez 'Cacher les sessions terminées' pour voir toutes les sessions"
                : isMJ
                  ? 'Créez votre première session pour commencer à jouer'
                  : 'Aucune session disponible pour le moment'
              }
            </Text>
            {!hideCompletedSessions && isMJ && (
              <Button
                variant="primary"
                size="md"
                onPress={() => setShowCreateModal(true)}
              >
                Créer une session
              </Button>
            )}
          </View>
        ) : (
          <ScrollView>
            {filteredSessions.map(renderSessionCard)}
          </ScrollView>
        )}

        {/* Modal de création de session */}
        {isMJ && (
          <Modal
            visible={showCreateModal}
            animationType="slide"
            presentationStyle="pageSheet"
          >
            <View className="flex-1 bg-gray-900 p-4">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">
                  Nouvelle session
                </Text>
                <TouchableOpacity onPress={closeCreateModal}>
                  <Text className="text-white text-lg">✕</Text>
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-white text-base mb-2">Titre *</Text>
                <TextInput
                  className="bg-white/10 text-white px-3 py-2 rounded-lg"
                  placeholder="Nom de la session"
                  placeholderTextColor="#ffffff80"
                  value={newSessionTitle}
                  onChangeText={setNewSessionTitle}
                />
              </View>

              <View className="mb-4">
                <Text className="text-white text-base mb-2">Description</Text>
                <TextInput
                  className="bg-white/10 text-white px-3 py-2 rounded-lg"
                  placeholder="Description optionnelle"
                  placeholderTextColor="#ffffff80"
                  value={newSessionDescription}
                  onChangeText={setNewSessionDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View className="mb-6">
                <Text className="text-white text-base mb-2">Date programmée</Text>
                <TouchableOpacity
                  className="bg-white/10 px-3 py-3 rounded-lg flex-row items-center justify-between"
                  onPress={handleShowDatePicker}
                >
                  <Text
                    className={
                      newSessionDate
                        ? 'text-white text-base'
                        : 'text-white/60 text-base'
                    }
                  >
                    {newSessionDate
                      ? formatDate(newSessionDate.toISOString())
                      : 'Sélectionner une date et une heure (optionnel)'}
                  </Text>
                  <Calendar color="#ffffff" size={16} />
                </TouchableOpacity>
                {newSessionDate && (
                  <TouchableOpacity
                    className="mt-2 self-start"
                    onPress={() => setNewSessionDate(null)}
                  >
                    <Text className="text-red-300 text-sm">Effacer la date</Text>
                  </TouchableOpacity>
                )}
                {Platform.OS === 'ios' && showDatePicker && (
                  <DateTimePicker
                    value={newSessionDate ?? new Date()}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={handleDateChange}
                  />
                )}
              </View>

              <View className="flex-row gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onPress={closeCreateModal}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onPress={handleCreateSession}
                  disabled={createSession.isPending}
                >
                  {createSession.isPending ? 'Création...' : 'Créer'}
                </Button>
              </View>
            </View>
          </Modal>
        )}

        {/* Modal de sélection de personnage */}
        {!isMJ && (
          <CharacterSelectionModal
            visible={showCharacterSelection}
            onClose={() => {
              setShowCharacterSelection(false);
              setSelectedSessionForJoin(null);
            }}
            onSelectCharacter={handleCharacterSelected}
            title="Rejoindre la session"
            subtitle={`Choisissez le personnage avec lequel vous voulez rejoindre "${selectedSessionForJoin?.name}"`}
          />
        )}
      </View>
    </Layout>
  );
}
