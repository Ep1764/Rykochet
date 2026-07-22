module.exports = {
  apps: [
    {
      name: 'rykochet-prod',
      script: 'server/dist/index.js',
      cwd: __dirname,
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
      script: 'server/dist/index.js',
      cwd: __dirname,
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
