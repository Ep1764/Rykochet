import type { Role } from './roles.js';

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
