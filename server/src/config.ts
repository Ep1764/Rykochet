import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const env = process.env['NODE_ENV'] === 'production' ? 'production' : 'development';

export const config = {
  env,
  isProd: env === 'production',
  port: Number(process.env['SERVER_PORT'] ?? 3000),
  databaseUrl:
    env === 'production'
      ? required('DATABASE_URL')
      : (process.env['DATABASE_URL_DEV'] ?? required('DATABASE_URL')),
  sessionSecret: required('SESSION_SECRET'),
  trustProxy: process.env['TRUST_PROXY'] !== 'false',
} as const;
