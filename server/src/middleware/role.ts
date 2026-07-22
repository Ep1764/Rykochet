import type { FastifyReply, FastifyRequest } from 'fastify';

import { hasAtLeast, type Role } from '@rykochet/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; username: string; role: Role };
  }
}

export function requireRole(minimum: Role) {
  return async function (req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = req.user;
    if (!user) {
      await reply.code(401).send({ error: 'unauthenticated' });
      return;
    }
    if (!hasAtLeast(user.role, minimum)) {
      await reply.code(403).send({ error: 'forbidden' });
      return;
    }
  };
}
