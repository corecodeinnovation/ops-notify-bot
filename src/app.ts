import express, { type Express, type NextFunction, type Request, type Response } from "express";
import type { Config } from "./config.js";
import type { Notifier } from "./telegram/notifier.js";
import { createWebhookRouter } from "./webhooks/router.js";

export function createApp(config: Config, notifier: Notifier): Express {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(createWebhookRouter(config.WEBHOOK_SECRET, notifier));

  // Un body con JSON malformado no debe devolver el HTML de error por defecto.
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError) {
      res.status(400).json({ error: "invalid_json" });
      return;
    }
    next(err);
  });

  return app;
}
