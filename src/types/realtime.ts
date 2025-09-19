export interface RealtimeIdentity {
  id: string;
  name: string;
}

export interface ChatMessagePayload {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
}

export interface ChatMessage extends ChatMessagePayload {
  timestamp: number;
}

export interface ImageBroadcastPayload {
  id: string;
  senderId: string;
  senderName?: string;
  imageUrl?: string;
  base64?: string;
  mimeType?: string;
  caption?: string;
}

export interface ImageBroadcast extends ImageBroadcastPayload {
  timestamp: number;
}

export interface DrawResultPayload {
  id: string;
  actorId: string;
  actorName?: string;
  label: string;
  diceSize: number;
  rolls: number[];
  modifier?: number;
  total: number;
}

export interface DrawResult extends DrawResultPayload {
  timestamp: number;
}
