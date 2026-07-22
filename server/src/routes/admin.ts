import type { FastifyInstance } from 'fastify';

import { requireRole } from '../middleware/role.js';

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/api/admin/me',
    { preHandler: requireRole('moderator') },
    async (req) => {
      return { user: req.user };
    },
  );

  app.get(
    '/api/admin/stats',
    { preHandler: requireRole('developer') },
    async () => {
      return { totalAccounts: 0, livePlayers: 0, totalBanned: 0, disabledMaps: 0 };
    },
  );
}
