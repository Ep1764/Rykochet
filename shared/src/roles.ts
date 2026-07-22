export const ROLES = ['player', 'moderator', 'admin', 'community_manager', 'developer'] as const;

export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = {
  player: 0,
  moderator: 1,
  admin: 2,
  community_manager: 3,
  developer: 4,
};

export function hasAtLeast(role: Role, minimum: Role): boolean {
  return RANK[role] >= RANK[minimum];
}

export function rankOf(role: Role): number {
  return RANK[role];
}
