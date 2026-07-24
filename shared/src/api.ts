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

/* ---------- Avatar recipe ----------
 * layers is an ORDERED array. Index 0 renders first (bottom of the stack).
 * The last element renders last (on top). */

export interface AvatarLayer {
  id: string;              // client-generated uuid, unique within the recipe
  stickerId: string;       // references a sticker in the manifest
  x: number;               // -256..256, offset from center
  y: number;               // -256..256, offset from center
  scale: number;           // 0.1..3, uniform scale
  rotation: number;        // 0..360, degrees
  opacity: number;         // 0..1
  color: string | null;    // hex string to tint 'currentColor' fills, or null for no override
}

export interface AvatarEquipment {
  trail: string | null;
  bulletTrail: string | null;
  deathAnimation: string | null;
  spawnEffect: string | null;
}

export interface AvatarRecipe {
  baseColor: string;              // hex, always the color of the underlying ball
  layers: AvatarLayer[];
  equipment: AvatarEquipment;
}

export interface AvatarSlot {
  slot: number;                   // 0..4
  name: string;                   // "Avatar 1", "Avatar 2", ... (renamable)
  selected: boolean;              // exactly one slot has this true
  recipe: AvatarRecipe;           // never null — new slots seed with default
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
  ownedCosmetics: OwnedCosmetic[];
  friends: FriendSummary[];
  settings: AccountSettings;
  createdAt: string;
}

export interface OwnedCosmetic {
  id: string;
  category: 'trail' | 'bulletTrail' | 'deathAnimation' | 'spawnEffect';
  name: string;
  acquiredAt: string;
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

/* ---------- Avatar API bodies ---------- */

export interface SaveSlotRequest {
  recipe: AvatarRecipe;
  name?: string;
}

export interface PublicAvatarResponse {
  username: string;
  recipe: AvatarRecipe;
}

export interface ApiError { error: string; message: string }
