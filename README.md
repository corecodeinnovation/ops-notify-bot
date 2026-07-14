<div align="center">

# 🤖 ops-notify-bot

**Bot de Telegram que recibe webhooks del homelab y notifica deploys y alertas.**

![Tier](https://img.shields.io/badge/tier-1-0B5FFF)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)
![License](https://img.shields.io/badge/license-MIT-green)

Parte del portfolio técnico de Core Code Innovation.

</div>

---

## Qué es
Servicio Node/TS que expone webhooks (deploys, alertas de recursos, contenedores caídos)
y los reenvía a Telegram. Comandos `/status`, `/containers`, `/uptime`.

## Quickstart
```bash
cp .env.example .env   # completar tokens
docker compose up --build
```

## Roadmap
- [ ] Integración grammY (Telegram)
- [ ] Validación de WEBHOOK_SECRET
- [ ] Comandos que consultan el Docker socket (read-only)
- [ ] Healthcheck + graceful shutdown

Ver `docs/` para notas de aprendizaje.
