// ops-notify-bot — scaffolding. Recibe webhooks y notifica por Telegram.
import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.post("/webhook", (req, res) => {
  // TODO: validar WEBHOOK_SECRET, formatear y enviar a Telegram vía grammY
  console.log("webhook recibido:", req.body);
  res.status(202).json({ received: true });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`ops-notify-bot escuchando en :${port}`));
