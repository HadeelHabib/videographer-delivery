// PM2 process file: the Next.js app and the ffmpeg/sharp worker run side by side.
// Start/reload with:  pm2 startOrReload deploy/ecosystem.config.cjs --update-env
const path = require("node:path");

const cwd = path.resolve(__dirname, "..");

module.exports = {
  apps: [
    {
      name: "web",
      cwd,
      script: "npm",
      args: "start -- -p 3000",
      env: { NODE_ENV: "production" },
      max_memory_restart: "1G",
      autorestart: true,
    },
    {
      name: "worker",
      cwd,
      script: "npm",
      args: "run worker:start",
      env: { NODE_ENV: "production" },
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 20,
    },
  ],
};
