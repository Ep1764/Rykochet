// PM2 process file. Prod runs from /var/www/rykochet (main branch);
// dev runs from /var/www/rykochet-dev (develop branch). Both use their own .env.
// Load PM2 with:  pm2 start /var/www/rykochet/ecosystem.config.cjs

const PROD_DIR = '/var/www/rykochet';
const DEV_DIR = '/var/www/rykochet-dev';

module.exports = {
  apps: [
    {
      name: 'rykochet-prod',
      cwd: PROD_DIR,
      script: `${PROD_DIR}/server/dist/index.js`,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        SERVER_PORT: 3000,
      },
      max_memory_restart: '1G',
      out_file: '/var/log/rykochet/prod.out.log',
      error_file: '/var/log/rykochet/prod.err.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'rykochet-dev',
      cwd: DEV_DIR,
      script: `${DEV_DIR}/server/dist/index.js`,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        SERVER_PORT: 3001,
      },
      max_memory_restart: '512M',
      out_file: '/var/log/rykochet/dev.out.log',
      error_file: '/var/log/rykochet/dev.err.log',
      merge_logs: true,
      time: true,
    },
  ],
};
