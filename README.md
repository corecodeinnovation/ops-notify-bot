<div align="center">

# 🤖 ops-notify-bot

**Bot de Telegram que recibe webhooks del homelab y notifica deploys y alertas.**

![Tier](https://img.shields.io/badge/tier-1-0B5FFF)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)
![Node](https://img.shields.io/badge/Node.js-22-339933)
![License](https://img.shields.io/badge/license-MIT-green)

Parte del portfolio técnico de Core Code Innovation.

</div>

---

## Qué es

Servicio Node.js/TypeScript que recibe eventos del homelab por webhook (deploys, alertas
de recursos, contenedores caídos), los valida y los notifica a un chat de Telegram.
Además responde comandos que consultan el Docker socket en **read-only**.

```
homelab (CI, monitores, cron) ──HTTP──▶ /webhook ──▶ formato ──▶ Telegram
                                            │
Telegram /status /containers /uptime ◀── Docker socket (solo lectura)
```

## Quickstart

```bash
cp .env.example .env   # completar tokens (ver tabla abajo)
docker compose up --build
```

Para desarrollo local sin Docker:

```bash
npm install
npm run dev            # carga .env y levanta el server con recarga en caliente
```

## Variables de entorno

| Variable             | Obligatoria | Descripción                                                                  |
| -------------------- | ----------- | ---------------------------------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN` | Sí          | Token del bot (lo entrega [@BotFather](https://t.me/BotFather)).             |
| `TELEGRAM_CHAT_ID`   | Sí          | Chat o grupo destino. El bot **solo** responde comandos en este chat.        |
| `WEBHOOK_SECRET`     | Sí          | Secreto compartido inventado por ti (`openssl rand -hex 32`).                |
| `PORT`               | No          | Puerto local de desarrollo (default `3001`; en el compose el host usa 3007). |
| `DOCKER_SOCKET`      | No          | Ruta al Docker socket (default `/var/run/docker.sock`).                      |

> Para obtener tu `TELEGRAM_CHAT_ID`: envíale un mensaje al bot y consulta
> `https://api.telegram.org/bot<TOKEN>/getUpdates` — el `chat.id` viene en la respuesta.

## API

### `GET /health`

Healthcheck. Responde `200 {"status":"ok"}`.

### `POST /webhook`

Recibe un evento y lo notifica a Telegram. Requiere el header `X-Webhook-Secret`
con el valor de `WEBHOOK_SECRET` (comparación timing-safe). El payload se valida
con `zod`; responde `202` al aceptar, `401` sin secreto válido y `400` si el
payload no cumple el esquema.

Tipos de evento:

```jsonc
// deploy
{ "type": "deploy", "service": "gql-core", "status": "success", "version": "1.2.0", "detail": "opcional" }

// alerta de recursos
{ "type": "resource_alert", "host": "homelab-01", "metric": "disk", "value": 92, "threshold": 85 }

// contenedor caído
{ "type": "container_down", "container": "taskforge-worker", "exitCode": 137 }
```

Ejemplo:

```bash
curl -X POST http://localhost:3007/webhook \
  -H 'Content-Type: application/json' \
  -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
  -d '{"type":"deploy","service":"gql-core","status":"success","version":"1.2.0"}'
```

## Comandos del bot

| Comando       | Qué hace                                          |
| ------------- | ------------------------------------------------- |
| `/status`     | Resumen del Docker host (contenedores, imágenes). |
| `/containers` | Lista de contenedores con su estado.              |
| `/uptime`     | Uptime del bot y contenedores activos.            |

## Arquitectura

```
src/
├── index.ts            # arranque, wiring y graceful shutdown (SIGTERM/SIGINT)
├── app.ts              # factory de Express (testeable sin abrir puerto)
├── config.ts           # validación del entorno con zod
├── webhooks/           # recepción: secreto + validación de payloads
├── telegram/           # envío: notifier con reintentos + comandos del bot
└── docker/             # cliente del Docker socket (solo peticiones GET)
```

Recepción (webhooks) y envío (Telegram) están separados detrás de una interfaz
`Notifier`, para poder probar cada lado de forma aislada.

## Decisiones de seguridad

- **Secreto timing-safe:** la comparación del `X-Webhook-Secret` usa `crypto.timingSafeEqual`.
- **Docker socket read-only:** montado `:ro` en el compose y el cliente solo emite `GET` — no existen operaciones destructivas en el código.
- **Chat autorizado:** los comandos solo responden en `TELEGRAM_CHAT_ID`; cualquier otro chat se ignora.
- **Sin secretos en logs:** los errores de la API de Telegram se sanitizan antes de loguearse.
- **Contenedor non-root** (usuario `node`) con build multi-stage.

> Nota de despliegue: el compose agrega el GID dueño del socket como grupo
> suplementario (`group_add`). En un host Linux define `DOCKER_GID` en el `.env`
> (`stat -c '%g' /var/run/docker.sock`); en Docker Desktop no hace falta.

## Scripts

| Script           | Descripción                                |
| ---------------- | ------------------------------------------ |
| `npm run dev`    | Desarrollo con recarga (`tsx watch`).      |
| `npm run build`  | Compila a `dist/`.                         |
| `npm start`      | Ejecuta el build (producción).             |
| `npm run lint`   | ESLint + verificación de formato Prettier. |
| `npm run format` | Formatea con Prettier.                     |

## Licencia

MIT
