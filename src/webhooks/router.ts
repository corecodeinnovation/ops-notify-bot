import { Router } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import { formatEvent } from "../telegram/format.js";
import type { Notifier } from "../telegram/notifier.js";
import { webhookEventSchema } from "./schema.js";

// Hashear ambos valores garantiza buffers de igual longitud para timingSafeEqual.
function secretsMatch(received: string, expected: string): boolean {
  const a = createHash("sha256").update(received).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function createWebhookRouter(secret: string, notifier: Notifier): Router {
  const router = Router();

  router.post("/webhook", (req, res) => {
    const received = req.header("x-webhook-secret");
    if (!received || !secretsMatch(received, secret)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const parsed = webhookEventSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "invalid_payload",
        issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      });
      return;
    }

    const event = parsed.data;
    console.log(`evento recibido: ${event.type}`);

    // Fire-and-forget: quien dispara el webhook no espera por los reintentos a Telegram.
    void notifier.send(formatEvent(event)).catch((err: unknown) => {
      console.error(err instanceof Error ? err.message : String(err));
    });

    res.status(202).json({ received: true, type: event.type });
  });

  return router;
}
