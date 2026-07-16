import type { WebhookEvent } from "../webhooks/schema.js";

function escapeHtml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function formatEvent(event: WebhookEvent): string {
  switch (event.type) {
    case "deploy": {
      const icon = event.status === "success" ? "✅" : "❌";
      const lines = [
        `${icon} <b>Deploy ${event.status === "success" ? "exitoso" : "fallido"}</b>`,
        `Servicio: <code>${escapeHtml(event.service)}</code>`,
      ];
      if (event.version !== undefined) {
        lines.push(`Versión: <code>${escapeHtml(event.version)}</code>`);
      }
      if (event.detail !== undefined) {
        lines.push(escapeHtml(event.detail));
      }
      return lines.join("\n");
    }
    case "resource_alert":
      return [
        `⚠️ <b>Alerta de recursos</b>`,
        `Host: <code>${escapeHtml(event.host)}</code>`,
        `${event.metric.toUpperCase()}: <b>${event.value}%</b> (umbral ${event.threshold}%)`,
      ].join("\n");
    case "container_down": {
      const lines = [
        `🔻 <b>Contenedor caído</b>`,
        `Contenedor: <code>${escapeHtml(event.container)}</code>`,
      ];
      if (event.exitCode !== undefined) {
        lines.push(`Exit code: <code>${event.exitCode}</code>`);
      }
      return lines.join("\n");
    }
  }
}
