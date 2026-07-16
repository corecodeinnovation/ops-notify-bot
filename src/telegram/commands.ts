import type { Bot } from "grammy";
import type { DockerClient } from "../docker/client.js";
import {
  getInfo,
  listContainers,
  type ContainerSummary,
  type DockerInfo,
} from "../docker/queries.js";

const STATE_ICON: Record<string, string> = {
  running: "🟢",
  exited: "🔴",
  paused: "⏸️",
  restarting: "🔄",
  created: "⚪",
  dead: "💀",
};

function escapeHtml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function formatStatus(info: DockerInfo): string {
  return [
    `🖥️ <b>${escapeHtml(info.Name)}</b> — Docker ${escapeHtml(info.ServerVersion)}`,
    `Contenedores: ${info.Containers} (🟢 ${info.ContainersRunning} · 🔴 ${info.ContainersStopped} · ⏸️ ${info.ContainersPaused})`,
    `Imágenes: ${info.Images}`,
  ].join("\n");
}

export function formatContainers(containers: ContainerSummary[]): string {
  if (containers.length === 0) {
    return "No hay contenedores.";
  }
  const lines = containers.map(
    (c) =>
      `${STATE_ICON[c.state] ?? "❔"} <code>${escapeHtml(c.name)}</code> — ${escapeHtml(c.status)}`,
  );
  return [`📦 <b>Contenedores (${containers.length})</b>`, ...lines].join("\n");
}

function humanizeSeconds(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}

export function formatUptime(botUptimeSeconds: number, running: ContainerSummary[]): string {
  const lines = [`⏱️ <b>Uptime</b>`, `Bot: ${humanizeSeconds(botUptimeSeconds)}`];
  if (running.length > 0) {
    lines.push("", "<b>Contenedores activos:</b>");
    for (const c of running) {
      lines.push(`🟢 <code>${escapeHtml(c.name)}</code> — ${escapeHtml(c.status)}`);
    }
  }
  return lines.join("\n");
}

export function registerCommands(bot: Bot, docker: DockerClient, allowedChatId: string): void {
  // El bot expone estado del homelab: solo responde en el chat autorizado.
  bot.use((ctx, next) => {
    if (ctx.chat?.id.toString() !== allowedChatId) {
      return;
    }
    return next();
  });

  bot.command("status", async (ctx) => {
    const info = await getInfo(docker);
    await ctx.reply(formatStatus(info), { parse_mode: "HTML" });
  });

  bot.command("containers", async (ctx) => {
    const containers = await listContainers(docker);
    await ctx.reply(formatContainers(containers), { parse_mode: "HTML" });
  });

  bot.command("uptime", async (ctx) => {
    const containers = await listContainers(docker);
    const running = containers.filter((c) => c.state === "running");
    await ctx.reply(formatUptime(process.uptime(), running), { parse_mode: "HTML" });
  });

  bot.catch(async (err) => {
    console.error(`error en comando: ${err.message}`);
    try {
      await err.ctx.reply(
        "⚠️ No pude consultar el estado. Revisa que el Docker socket esté montado.",
      );
    } catch {
      // Si tampoco se puede responder, ya quedó logueado arriba.
    }
  });
}
