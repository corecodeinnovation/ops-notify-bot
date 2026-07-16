// ops-notify-bot — recibe webhooks del homelab y notifica por Telegram.
import { Bot } from "grammy";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { DockerClient } from "./docker/client.js";
import { registerCommands } from "./telegram/commands.js";
import { TelegramNotifier } from "./telegram/notifier.js";

const config = loadConfig();
const bot = new Bot(config.TELEGRAM_BOT_TOKEN);
const docker = new DockerClient(config.DOCKER_SOCKET);
const notifier = new TelegramNotifier(bot, config.TELEGRAM_CHAT_ID);

registerCommands(bot, docker, config.TELEGRAM_CHAT_ID);

const app = createApp(config, notifier);

const server = app.listen(config.PORT, () => {
  console.log(`ops-notify-bot escuchando en :${config.PORT}`);
  void notifier.checkConnection();
});

// Long polling para recibir comandos. Si Telegram no responde, el server de
// webhooks sigue vivo; el polling se loguea y no tumba el proceso.
let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  console.log(`${signal} recibido: cerrando server y bot…`);

  // Red de seguridad: si algo queda colgado, salida forzada con margen.
  const forceExit = setTimeout(() => {
    console.error("cierre forzado por timeout");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  // Primero se deja de aceptar webhooks (las requests en vuelo terminan,
  // las conexiones keep-alive ociosas se cierran), después el long polling.
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
    server.closeIdleConnections();
  });
  await bot.stop();
  console.log("cierre limpio completado");
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

bot
  .start({
    onStart: () => {
      console.log("bot escuchando comandos (long polling)");
      void bot.api
        .setMyCommands([
          { command: "status", description: "Resumen del Docker host" },
          { command: "containers", description: "Lista de contenedores y su estado" },
          { command: "uptime", description: "Uptime del bot y contenedores activos" },
        ])
        .catch(() => console.warn("no se pudo registrar el menú de comandos"));
    },
  })
  .catch((err: unknown) => {
    console.error(`polling detenido: ${err instanceof Error ? err.message : String(err)}`);
  });
