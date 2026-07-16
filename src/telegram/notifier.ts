import { Bot, GrammyError, HttpError } from "grammy";

export interface Notifier {
  send(text: string): Promise<void>;
}

function isRetryable(err: unknown): boolean {
  if (err instanceof HttpError) return true;
  if (err instanceof GrammyError) {
    return err.error_code === 429 || err.error_code >= 500;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class TelegramNotifier implements Notifier {
  constructor(
    private readonly bot: Bot,
    private readonly chatId: string,
    private readonly maxAttempts = 3,
  ) {}

  // No-fatal: un token inválido o Telegram caído no debe impedir recibir webhooks.
  async checkConnection(): Promise<void> {
    try {
      const me = await this.bot.api.getMe();
      console.log(`telegram conectado como @${me.username}`);
    } catch (err) {
      console.warn(`telegram no disponible al arranque: ${this.sanitize(err)}`);
    }
  }

  async send(text: string): Promise<void> {
    for (let attempt = 1; ; attempt++) {
      try {
        await this.bot.api.sendMessage(this.chatId, text, { parse_mode: "HTML" });
        return;
      } catch (err) {
        if (attempt >= this.maxAttempts || !isRetryable(err)) {
          throw new Error(
            `envío a Telegram falló tras ${attempt} intento(s): ${this.sanitize(err)}`,
            {
              cause: err,
            },
          );
        }
        const retryAfter = err instanceof GrammyError ? err.parameters.retry_after : undefined;
        const delayMs = retryAfter !== undefined ? retryAfter * 1000 : 500 * 2 ** (attempt - 1);
        console.warn(`reintentando envío a Telegram (intento ${attempt}/${this.maxAttempts})`);
        await sleep(delayMs);
      }
    }
  }

  // El token nunca debe llegar a los logs, ni siquiera dentro de una URL de error.
  private sanitize(err: unknown): string {
    const message = err instanceof Error ? err.message : String(err);
    return message.replaceAll(this.bot.token, "[redacted]");
  }
}
