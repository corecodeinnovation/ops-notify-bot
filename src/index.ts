// ops-notify-bot — recibe webhooks del homelab y notifica por Telegram.
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const app = createApp(config);

app.listen(config.PORT, () => {
  console.log(`ops-notify-bot escuchando en :${config.PORT}`);
});
