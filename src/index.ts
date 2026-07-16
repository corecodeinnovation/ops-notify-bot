// ops-notify-bot — recibe webhooks del homelab y notifica por Telegram.
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { TelegramNotifier } from "./telegram/notifier.js";

const config = loadConfig();
const notifier = new TelegramNotifier(config.TELEGRAM_BOT_TOKEN, config.TELEGRAM_CHAT_ID);
const app = createApp(config, notifier);

app.listen(config.PORT, () => {
  console.log(`ops-notify-bot escuchando en :${config.PORT}`);
  void notifier.checkConnection();
});
