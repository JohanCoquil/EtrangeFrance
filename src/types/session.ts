export interface Session {
  id: string;
  name: string;
  description: string;
  gameDate: Date;
  
  // Participants
  masterId: string;
  playerIds: string[];
  characterIds: string[];
  
  // État de la session
  status: 'pending' | 'active' | 'paused' | 'completed';
  
  // Communication
  chatMessages: ChatMessage[];
  diceRolls: DiceRoll[];
  
  // Paramètres
  settings: {
    allowPrivateMessages: boolean;
    allowPlayerDiceRolls: boolean;
    voiceChannelId?: string;
  };
  
  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'dice' | 'system' | 'private';
  targetId?: string; // Pour les messages privés
  timestamp: Date;
}

export interface DiceRoll {
  id: string;
  sessionId: string;
  playerId: string;
  playerName: string;
  diceType: string; // 'D10', 'D100', etc.
  result: number;
  modifier: number;
  total: number;
  reason: string;
  timestamp: Date;
}

export interface PNJ {
  id: string;
  name: string;
  description: string;
  species: string;
  profession: string;
  characteristics: Record<string, number>;
  notes: string;
  sessionId?: string;
  createdBy: string;
  createdAt: Date;
} 