import type { FastifyInstance } from 'fastify';

import type { HealthResponse } from '@rykochet/shared';

import { config } from '../config.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/health', async (): Promise<HealthResponse> => {
    return {
      ok: true,
      service: 'rykochet',
      version: '0.0.1',
      env: config.env,
    };
  });
}
