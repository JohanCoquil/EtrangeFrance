import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Layout from '@/components/ui/Layout';
import Button from '@/components/ui/Button';
import {
  useSessionDetails,
  useUpdatePresence,
  useLeaveSession,
  useUpdateSession
} from '@/api/sessions';
import { useCharacters } from '@/api/charactersLocal';
import type { SessionRecord, SessionParticipant } from '@/types/session';
import {
  Users,
  MessageCircle,
  LogOut,
  Play,
  Pause,
  User,
  Heart,
} from 'lucide-react-native';

type ActiveSessionScreenProps = {
  session: SessionRecord;
  isMJ: boolean;
  onBack: () => void;
};

type ChatMessage = {
  id: string;
  type: 'mj' | 'player' | 'system';
  sender: string;
  message: string;
  timestamp: string;
  characterName?: string;
};

const normalizeOnlineStatus = (
  value: SessionParticipant['is_online'] | null | undefined
): boolean => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    if (value === '1') {
      return true;
    }
    if (value === '0') {
      return false;
    }
    return value.toLowerCase() === 'true';
  }

  return false;
};

export default function ActiveSessionScreen({ session, isMJ, onBack }: ActiveSessionScreenProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentCharacter, setCurrentCharacter] = useState<any>(null);
  const [isMj, setIsMj] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(true);

  const { data: sessionDetails, isLoading, error, refetch } = useSessionDetails(session.id);
  const { data: characters } = useCharacters();
  const updatePresence = useUpdatePresence();
  const leaveSession = useLeaveSession();
  const updateSession = useUpdateSession();


  // Initialisation de l'utilisateur et du personnage
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);

          // Utiliser la prop isMJ passée depuis SessionScreen
          setIsMj(isMJ);

          // Trouver le personnage utilisé dans cette session
          const participant = sessionDetails?.participants?.find(
            (p: any) => p.user_id === user.id
          );

          if (participant?.character_id && characters) {
            const character = characters.find((c: any) => c.id === participant.character_id);
            setCurrentCharacter(character);
          }
        }
      } catch (error) {
        console.error('Erreur initialisation utilisateur:', error);
      }
    };

    if (sessionDetails) {
      initializeUser();
    }
  }, [sessionDetails, characters]);

  // Heartbeat pour maintenir la présence
  useEffect(() => {
    if (!currentUser || !isConnected) return;

    const heartbeatInterval = setInterval(async () => {
      try {
        await updatePresence.mutateAsync({
          sessionId: session.id,
          userId: currentUser.id,
        });
      } catch (error) {
        console.error('Erreur heartbeat:', error);
        setIsConnected(false);
      }
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(heartbeatInterval);
  }, [currentUser, session.id, updatePresence, isConnected]);

  // Messages de chat simulés (en attendant les WebSockets)
  useEffect(() => {
    const initialMessages: ChatMessage[] = [
      {
        id: '1',
        type: 'system',
        sender: 'Système',
        message: `Session "${session.name}" démarrée`,
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'mj',
        sender: 'MJ',
        message: 'Bienvenue dans cette nouvelle session !',
        timestamp: new Date().toISOString(),
      },
    ];
    setChatMessages(initialMessages);
  }, [session.name]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !currentUser) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      type: isMj ? 'mj' : 'player',
      sender: isMj ? 'MJ' : currentUser.login || currentUser.username || 'Joueur',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      characterName: currentCharacter?.name,
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  }, [newMessage, currentUser, isMj, currentCharacter]);

  const handleLeaveSession = useCallback(async () => {
    Alert.alert(
      'Quitter la session',
      'Êtes-vous sûr de vouloir quitter cette session ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              if (currentUser) {
                await leaveSession.mutateAsync({
                  sessionId: session.id,
                  userId: currentUser.id,
                });
              }
              onBack();
            } catch (error) {
              console.error('Erreur quitter session:', error);
              Alert.alert('Erreur', 'Impossible de quitter la session.');
            }
          },
        },
      ]
    );
  }, [session.id, currentUser, leaveSession, onBack]);

  const handleGameAction = useCallback((action: string) => {
    if (!currentUser) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'player',
      sender: currentUser.login || currentUser.username || 'Joueur',
      message: `🎲 ${action}`,
      timestamp: new Date().toISOString(),
      characterName: currentCharacter?.name,
    };

    setChatMessages(prev => [...prev, message]);
  }, [currentUser, currentCharacter]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageStyle = (type: ChatMessage['type']) => {
    switch (type) {
      case 'mj':
        return 'bg-blue-500/20 border-l-4 border-blue-400';
      case 'system':
        return 'bg-gray-500/20 border-l-4 border-gray-400';
      default:
        return 'bg-white/10 border-l-4 border-white/30';
    }
  };

  const renderChatMessage = (message: ChatMessage) => (
    <View key={message.id} className={`p-3 mb-2 rounded-r-lg ${getMessageStyle(message.type)}`}>
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-white font-semibold text-sm">
          {message.sender}
          {message.characterName && (
            <Text className="text-white/80 text-xs"> ({message.characterName})</Text>
          )}
        </Text>
        <Text className="text-white/60 text-xs">
          {formatTime(message.timestamp)}
        </Text>
      </View>
      <Text className="text-white text-sm">
        {message.message}
      </Text>
    </View>
  );

  const handlePauseResume = useCallback(async () => {
    if (!sessionDetails) return;

    try {
      const newStatus = sessionDetails.status === 'active' ? 'paused' : 'active';
      await updateSession.mutateAsync({
        sessionId: session.id,
        updates: { status: newStatus }
      });

      // Ajouter un message système
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        sender: 'Système',
        message: `Session ${newStatus === 'paused' ? 'mise en pause' : 'reprise'} par le MJ`,
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      console.error('Erreur pause/reprise:', error);
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Impossible de modifier le statut de la session.'
      );
    }
  }, [sessionDetails, updateSession, session.id]);

  const renderCharacterStats = () => {
    if (!currentCharacter) return null;

    return (
      <View className="bg-white/10 rounded-xl p-4 mb-4">
        <Text className="text-white text-lg font-semibold mb-3">
          {currentCharacter.name}
        </Text>

        <View className="flex-row justify-between mb-3">
          <View className="flex-row gap-4">
            <View className="items-center">
              <Text className="text-white/80 text-xs">INT</Text>
              <Text className="text-white text-sm font-semibold">
                {currentCharacter.intelligence}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-white/80 text-xs">FOR</Text>
              <Text className="text-white text-sm font-semibold">
                {currentCharacter.force}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-white/80 text-xs">DEX</Text>
              <Text className="text-white text-sm font-semibold">
                {currentCharacter.dexterite}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-white/80 text-xs">CHA</Text>
              <Text className="text-white text-sm font-semibold">
                {currentCharacter.charisme}
              </Text>
            </View>
          </View>

          <View className="items-center">
            <Heart color="#ef4444" size={16} />
            <Text className="text-white text-sm font-semibold">
              {currentCharacter.sante - currentCharacter.degats}/{currentCharacter.sante}
            </Text>
          </View>
        </View>

        {currentCharacter.profession_name && (
          <Text className="text-white/80 text-sm">
            {currentCharacter.profession_name}
            {currentCharacter.hobby_name && ` • ${currentCharacter.hobby_name}`}
            {currentCharacter.voie_name && ` • ${currentCharacter.voie_name}`}
          </Text>
        )}
      </View>
    );
  };

  const renderParticipants = () => {
    if (!sessionDetails?.participants) return null;

    const participants = sessionDetails.participants as SessionParticipant[];
    const totalParticipants = participants.length;

    const onlineCount = participants.filter(participant => {
      const isCurrentUserParticipant = participant.user_id === currentUser?.id;
      return (
        normalizeOnlineStatus(participant.is_online) ||
        (isCurrentUserParticipant && isConnected)
      );
    }).length;

    return (
      <View className="bg-white/10 rounded-xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Users color="#ffffff" size={16} />
            <Text className="text-white font-semibold ml-2">
              {`Participants (${onlineCount}/${totalParticipants})`}
            </Text>
          </View>
          <View className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-3">
            {participants.map(participant => {
              const character = characters?.find((c: any) => c.id === participant.character_id) as any;
              const isCurrentUserParticipant = participant.user_id === currentUser?.id;
              const isMasterParticipant =
                participant.role === 'master' ||
                participant.user_id === sessionDetails?.partie?.mj_id ||
                (isCurrentUserParticipant && isMj);
              const isOnline =
                normalizeOnlineStatus(participant.is_online) ||
                (isCurrentUserParticipant && isConnected);
              const statusText = isOnline ? 'En ligne' : 'Hors ligne';
              const primaryText = isMasterParticipant
                ? 'Maître du jeu'
                : character?.name || 'Sans personnage';
              const baseRoleLabel =
                participant.role === 'spectator'
                  ? 'Spectateur'
                  : isMasterParticipant
                    ? 'MJ'
                    : 'Joueur';
              const footerText = isCurrentUserParticipant
                ? isMasterParticipant
                  ? 'Vous (MJ)'
                  : 'Vous'
                : baseRoleLabel;

              return (
                <View
                  key={participant.id}
                  className={`p-3 rounded-lg min-w-[140px] ${isOnline ? 'bg-green-500/20' : 'bg-gray-500/20'}`}
                >
                  <View className="flex-row items-center mb-1">
                    <User color={isOnline ? '#4ade80' : '#9ca3af'} size={12} />
                    <Text className="text-white text-xs ml-1">
                      {statusText}
                    </Text>
                  </View>
                  <Text className="text-white text-sm font-semibold">
                    {primaryText}
                  </Text>
                  <Text className="text-white/80 text-xs">
                    {footerText}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderGameActions = () => (
    <View className="bg-white/10 rounded-xl p-4 mb-4">
      <Text className="text-white font-semibold mb-3">Actions rapides</Text>
      <View className="flex-row flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onPress={() => handleGameAction('Tire une carte')}
        >
          🃏 Carte
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onPress={() => handleGameAction('Utilise une capacité')}
        >
          ⚡ Capacité
        </Button>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <Layout backgroundColor="dark" variant="scroll" className="bg-black">
        <View className="flex-1 items-center justify-center p-4">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="text-white mt-4">Chargement de la session...</Text>
        </View>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout backgroundColor="dark" variant="scroll" className="bg-black">
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

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
      <View className="flex-1 bg-black">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="flex-1 p-4">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold">
                    {session.name}
                  </Text>
                  <Text className="text-white/80 text-sm">
                    {isMj ? 'Maître de jeu' : 'Joueur'}
                  </Text>
                </View>
                <View className="flex-row items-center space-x-3">
                  <TouchableOpacity
                    onPress={onBack}
                    className="bg-white/20 px-3 py-2 rounded-lg"
                  >
                    <Text className="text-white text-sm">← Retour</Text>
                  </TouchableOpacity>
                  {/* Bouton pause/reprendre pour le MJ */}
                  {isMj && sessionDetails && (
                    <TouchableOpacity
                      onPress={handlePauseResume}
                      className="bg-white/20 px-3 py-2 rounded-lg"
                    >
                      {sessionDetails.status === 'active' ? (
                        <Pause color="#ffffff" size={16} />
                      ) : (
                        <Play color="#ffffff" size={16} />
                      )}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={handleLeaveSession}>
                    <LogOut color="#ffffff" size={24} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Personnage actuel */}
              {renderCharacterStats()}

              {/* Participants */}
              {renderParticipants()}

              {/* Actions de jeu */}
              {renderGameActions()}

              {/* Chat */}
              <View className="flex-1 bg-white/10 rounded-xl p-4">
                <View className="flex-row items-center mb-3">
                  <MessageCircle color="#ffffff" size={16} />
                  <Text className="text-white font-semibold ml-2">Chat</Text>
                </View>

                <ScrollView className="flex-1 mb-3" showsVerticalScrollIndicator={false}>
                  {chatMessages.map(renderChatMessage)}
                </ScrollView>

                <View className="flex-row gap-2">
                  <TextInput
                    className="flex-1 bg-white/20 text-white px-3 py-2 rounded-lg"
                    placeholder="Tapez votre message..."
                    placeholderTextColor="#ffffff80"
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={500}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    Envoyer
                  </Button>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
