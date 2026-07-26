module.exports = {
  apps: [
    {
      name: "manual-becario-portada",
      cwd: "./apps/portada-saldo",
      script: "npm",
      args: "run start",
      env: { NODE_ENV: "production", PORT: "3100" },
    },
    {
      name: "manual-becario-utopias",
      cwd: "./apps/utopias",
      script: "npm",
      args: "run start",
      env: { NODE_ENV: "production", PORT: "3101" },
    },
    {
      name: "manual-becario-centros",
      cwd: "./apps/centros",
      script: "npm",
      args: "run start",
      env: { NODE_ENV: "production", PORT: "3102" },
    },
  ],
};
