'use strict';

module.exports = {
  apps: [
    {
      name: 'kaikaio-booking-server',
      script: './node_modules/egg-scripts/bin/egg-scripts.js',
      args: 'start --title=egg-server-kaikaio-booking-server',
      env: {
        NODE_ENV: 'production',
        EGG_SERVER_ENV: 'prod',
        PORT: process.env.PORT || '7009',
        MYSQL_HOST: process.env.MYSQL_HOST || 'localhost',
        MYSQL_PORT: process.env.MYSQL_PORT || '3306',
        MYSQL_USER: process.env.MYSQL_USER || 'root',
        MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || '',
        MYSQL_DB: process.env.MYSQL_DB || 'kaikaio-booking-db',
      },
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
    },
  ],
};
