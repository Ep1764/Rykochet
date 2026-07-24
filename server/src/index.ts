import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import Fastify from 'fastify';

import { config } from './config.js';
import { ping } from './db.js';
import { sessionPlugin } from './middleware/session.js';
import { adminRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';
import { healthRoutes } from './routes/health.js';

async function main(): Promise<void> {
  const app = Fastify({
    logger: config.isProd
      ? true
      : { transport: { target: 'pino-pretty', options: { colorize: true } } },
    trustProxy: config.trustProxy,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cookie, { secret: config.sessionSecret });
  await app.register(cors, { origin: true, credentials: true });

  await app.register(sessionPlugin);
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(adminRoutes);

  try {
    await ping();
    app.log.info('database connection ok');
  } catch (err) {
    app.log.warn({ err }, 'database ping failed (continuing)');
  }

  await app.listen({ port: config.port, host: '127.0.0.1' });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
