import { z } from "zod";

const envSchema = z.object({
  WEBHOOK_SECRET: z.string().min(1, "WEBHOOK_SECRET es obligatorio"),
  TELEGRAM_BOT_TOKEN: z.string().min(1, "TELEGRAM_BOT_TOKEN es obligatorio"),
  TELEGRAM_CHAT_ID: z.string().min(1, "TELEGRAM_CHAT_ID es obligatorio"),
  PORT: z.coerce.number().int().positive().default(3001),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Configuración inválida — ${issues}`);
  }
  return parsed.data;
}
