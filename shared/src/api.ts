import type { Role } from './roles.js';
import type { AccountSettings } from './settings.js';

export interface HealthResponse {
  ok: true;
  service: 'rykochet';
  version: string;
  env: 'production' | 'development';
}

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
}

/* ---------- Avatar recipe ---------- */

export interface AvatarRecipe {
  baseColor: string;
  layers: Record<string, string | null>;
}

export interface AvatarSlot {
  slot: number;
  recipe: AvatarRecipe | null;
}

/* ---------- Full account payload ---------- */

export interface MapSummary {
  id: string;
  name: string;
  createdAt: string;
}

export interface FriendSummary {
  id: string;
  username: string;
  level: number;
  online: boolean;
}

export interface AuthAccount {
  id: string;
  username: string;
  role: Role;
  level: number;
  xp: number;
  coins: number;
  selectedAvatar: number;
  avatars: AvatarSlot[];
  createdMaps: MapSummary[];
  favoriteMaps: MapSummary[];
  ownedCosmetics: string[];
  friends: FriendSummary[];
  settings: AccountSettings;
  createdAt: string;
}

/* ---------- Auth request bodies ---------- */

export interface SignupRequest {
  username: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
  rememberMe: boolean;
  fingerprint?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe: boolean;
  fingerprint?: string;
}

export interface RecoverStartRequest { username: string }
export interface RecoverStartResponse { securityQuestion: string }

export interface RecoverVerifyRequest {
  username: string;
  securityAnswer: string;
  newPassword: string;
}

export interface ApiError { error: string; message: string }
