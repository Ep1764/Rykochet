import type { FastifyInstance, FastifyReply } from 'fastify';

import type {
  ApiError,
  AvatarRecipe,
  PublicAvatarResponse,
  SaveSlotRequest,
} from '@rykochet/shared';

import {
  loadAccount,
  loadPublicActiveAvatar,
  saveAvatarSlot,
  selectAvatarSlot,
} from '../db-account.js';

function bad(reply: FastifyReply, status: number, code: string, message: string): ApiError {
  void reply.code(status);
  return { error: code, message };
}

function validSlotIndex(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 4) return null;
  return n;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function validateRecipe(input: unknown): AvatarRecipe | null {
  if (!input || typeof input !== 'object') return null;
  const r = input as Partial<AvatarRecipe>;
  if (typeof r.baseColor !== 'string' || !HEX_RE.test(r.baseColor)) return null;
  if (!Array.isArray(r.layers) || r.layers.length > 32) return null;
  const layers = [];
  for (const layerRaw of r.layers) {
    if (!layerRaw || typeof layerRaw !== 'object') return null;
    const l = layerRaw as Record<string, unknown>;
    if (typeof l['id'] !== 'string' || typeof l['stickerId'] !== 'string') return null;
    if (typeof l['x'] !== 'number' || typeof l['y'] !== 'number') return null;
    if (typeof l['scale'] !== 'number' || typeof l['rotation'] !== 'number') return null;
    if (typeof l['opacity'] !== 'number') return null;
    const color = l['color'];
    if (color !== null && (typeof color !== 'string' || !HEX_RE.test(color))) return null;
    layers.push({
      id: l['id'],
      stickerId: l['stickerId'],
      x: clamp(l['x'], -256, 256),
      y: clamp(l['y'], -256, 256),
      scale: clamp(l['scale'], 0.1, 3),
      rotation: ((l['rotation'] % 360) + 360) % 360,
      opacity: clamp(l['opacity'], 0, 1),
      color: color as string | null,
    });
  }
  const eq = (r.equipment ?? {}) as Record<string, unknown>;
  return {
    baseColor: r.baseColor,
    layers,
    equipment: {
      trail: typeof eq['trail'] === 'string' ? eq['trail'] : null,
      bulletTrail: typeof eq['bulletTrail'] === 'string' ? eq['bulletTrail'] : null,
      deathAnimation: typeof eq['deathAnimation'] === 'string' ? eq['deathAnimation'] : null,
      spawnEffect: typeof eq['spawnEffect'] === 'string' ? eq['spawnEffect'] : null,
    },
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export async function avatarRoutes(app: FastifyInstance): Promise<void> {
  // Save (or overwrite) a slot's recipe.
  app.put('/api/avatar/slot/:index', async (req, reply) => {
    if (!req.user) return bad(reply, 401, 'unauthenticated', 'Not logged in.');
    const idx = validSlotIndex((req.params as { index?: string }).index);
    if (idx === null) return bad(reply, 400, 'bad_slot', 'Slot must be 0-4.');
    const body = req.body as Partial<SaveSlotRequest> | undefined;
    if (!body) return bad(reply, 400, 'bad_body', 'Missing body.');
    const recipe = validateRecipe(body.recipe);
    if (!recipe) return bad(reply, 400, 'bad_recipe', 'Recipe failed validation.');
    const name =
      typeof body.name === 'string' && body.name.trim().length > 0
        ? body.name.trim().slice(0, 40)
        : null;
    await saveAvatarSlot(req.user.id, idx, recipe, name);
    const account = await loadAccount(req.user.id);
    if (!account) return bad(reply, 500, 'load_failed', 'Saved but reload failed.');
    return account;
  });

  // Mark a slot as the active/selected one.
  app.post('/api/avatar/slot/:index/select', async (req, reply) => {
    if (!req.user) return bad(reply, 401, 'unauthenticated', 'Not logged in.');
    const idx = validSlotIndex((req.params as { index?: string }).index);
    if (idx === null) return bad(reply, 400, 'bad_slot', 'Slot must be 0-4.');
    await selectAvatarSlot(req.user.id, idx);
    const account = await loadAccount(req.user.id);
    if (!account) return bad(reply, 500, 'load_failed', 'Selected but reload failed.');
    return account;
  });

  // Public: get another player's active avatar recipe so it can be composed anywhere.
  app.get('/api/avatar/user/:id', async (req, reply): Promise<PublicAvatarResponse | ApiError> => {
    const raw = (req.params as { id?: string }).id;
    if (!raw || !/^\d+$/.test(raw)) return bad(reply, 400, 'bad_id', 'Bad account id.');
    const result = await loadPublicActiveAvatar(raw);
    if (!result) return bad(reply, 404, 'not_found', 'No such account.');
    return { username: result.username, recipe: result.recipe };
  });
}
