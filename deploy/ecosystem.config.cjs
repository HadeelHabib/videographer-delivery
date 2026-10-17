// PM2 process file: the Next.js app, plus the ffmpeg/sharp worker unless conversion is
// switched off (NEXT_PUBLIC_PROCESSING="none" in .env — then nothing needs a worker).
// Start/reload with:  pm2 startOrReload deploy/ecosystem.config.cjs --update-env
const path = require("node:path");
const fs = require("node:fs");

const cwd = path.resolve(__dirname, "..");

// PM2 doesn't load .env itself, so read the one flag we need from it.
function envFlag(name) {
  try {
    const line = fs
      .readFileSync(path.join(cwd, ".env"), "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${name}=`));
    return line ? line.slice(name.length + 1).replace(/^"|"$/g, "").trim() : "";
  } catch {
    return "";
  }
}

const workerEnabled = envFlag("NEXT_PUBLIC_PROCESSING") !== "none";

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
    ...(workerEnabled
      ? [
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
        ]
      : []),
  ],
};
