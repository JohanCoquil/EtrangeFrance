export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
  sessionId?: string;
}

// Types d'authentification
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'player' | 'master' | 'admin';
  createdAt: Date;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
} 