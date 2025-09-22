## CVC Faucet Bot – Deployment Guide

This guide walks you through creating and deploying the Discord Faucet Bot from scratch. It covers creating the bot, assigning permissions, preparing environment variables, setting up Redis, and running locally or with PM2.

### 1) Prerequisites
- **Node.js**: v18+ recommended
- **Redis**: a reachable Redis instance (local or managed)
- **Discord Account** with permission to manage a server (to add the bot)
- Optional: **Telegram bot** if you want balance notifications/health alerts

### 2) Create a Discord Application and Bot
1. Open the Discord Developer Portal: [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" → Name it (e.g., "CVC Faucet Bot").
3. In the application, go to "Bot" → "Add Bot".
4. Under Bot settings:
   - Copy the **Token** for later (`DISCORD_TOKEN`). Keep it secret.
   - Turn on **Privileged Gateway Intents**:
     - "Server Members Intent" (Guild Members)
     - "Message Content Intent"
   - (Optional) Upload an avatar, set username.

### 3) Invite the Bot to Your Discord Server
1. In the app, go to "OAuth2" → "URL Generator".
2. Scopes: check `bot` and `applications.commands`.
3. Bot Permissions (minimal):
   - `Send Messages`
   - `Read Message History`
   - `View Channels`
   - If using message-based command `!faucet`: also `Read Messages` (covered by View/History)
4. Copy the generated URL and open it to add the bot to your server.

### 4) Create Channels and Roles in Discord
1. Create a text channel for faucet commands (e.g., `#faucet-requests`). Copy its ID → `FAUCET_CHANNEL_ID`.
2. Create a channel for onboarding (e.g., `#welcome`). Copy its ID → `WELCOME_CHANNEL_ID`.
3. Create a role for permission gating (e.g., `Developer`).
   - Copy Role ID. Prefer using ID (stable) over name. You can still use name with `PERMISSION_ROLE`, but `PERMISSION_ROLE_ID` is safer.

How to copy IDs: In Discord → User Settings → Advanced → enable "Developer Mode" → Right-click object → "Copy ID".

### 5) Prepare Environment Variables
Create a `.env` file in the project root with the following keys. Adjust values to your environment.

```dotenv
# Discord
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_application_client_id
FAUCET_CHANNEL_ID=123456789012345678
WELCOME_CHANNEL_ID=123456789012345678
# Use ONE of these for permission gating
PERMISSION_ROLE=Developer
# Prefer using role ID for stability
# PERMISSION_ROLE_ID=123456789012345678

# Chain / Faucet
KURA_RPC_URL=https://your-rpc-url
KURA_EXPLORER=https://your-explorer-url
KURA_SYMBOL=CVC
ACCOUNT_ADDRESS=0xYourFaucetAddress
ACCOUNT_PRIVATE_KEY=0xYourPrivateKey
FAUCET_AMOUNT=1
TIME_PER_FAUCET=14400 # seconds (e.g., 4 hours)

# Health Check
ACCOUNT_RECEIVE_XCR=0xAnAddressToReceiveDailyHealthTx

# Redis (choose one)
# Simple local (default client connects to localhost:6379)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
# Or full URL (recommended for prod)
# REDIS_USERNAME=default
# REDIS_PASSWORD=yourpassword
# Example: redis://user:pass@host:6379
# If used, set in code (see src/index.js commented URL snippet)

# Telegram (optional notifications)
TELEGRAM_BOT_API_KEY=your_telegram_bot_token
TELEGRAM_CHAT_ID=123456789
```

Notes:
- Never commit `.env` to version control.
- Ensure the faucet account has enough balance.

### 6) Install Dependencies
```bash
npm install
```

### 7) Configure Redis
You can run Redis locally or use a managed instance.
- Local (Docker):
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```
- Managed: Provision on your provider and update the Redis connection in `src/index.js` to use the URL (the template is already present as a comment).

### 8) Run Locally (Development)
```bash
npm run dev
```
This starts the bot, registers slash commands, connects to Redis, and schedules the health check cron (disabled by default until start is called in code).

### 9) Run in Production (PM2)
Install PM2 globally and start the app:
```bash
npm install -g pm2
pm2 start npm --name cvc-faucet -- run start
pm2 save
pm2 startup
```
Check logs:
```bash
pm2 logs cvc-faucet
```

### 10) Usage
- Slash command: `/faucet [address]` in the faucet channel. Requires the configured role to use.
- Message command (if enabled): `!faucet 0xAddress` in the faucet channel.
- Help: `/help` returns usage and options.

### 11) Health Check Job
The cron job ("health-check") sends a small transaction daily (default 07:00 Asia/Ho_Chi_Minh) to verify the RPC/network and alerts to Telegram if receipt is missing. Configure:
- `ACCOUNT_RECEIVE_XCR` – destination address
- `TELEGRAM_BOT_API_KEY`, `TELEGRAM_CHAT_ID` – to receive alerts

### 12) Troubleshooting
- Bot offline: Verify `DISCORD_TOKEN`, intents enabled, and that the process is running.
- Slash commands not visible: Global commands may take minutes to propagate. For faster testing, register per-guild in code or wait a few minutes and re-open Discord.
- Permission denied: Ensure the user has the configured role and is using the correct channel ID.
- Redis errors: Check connectivity and credentials. Ensure Redis is reachable from your host.
- Transaction failed: Confirm `ACCOUNT_PRIVATE_KEY` matches `ACCOUNT_ADDRESS`, sufficient balance, and `KURA_RPC_URL` is correct.

### 13) Security Best Practices
- Keep bot tokens and private keys in secrets managers or environment variables; never commit them.
- Restrict faucet usage via role gating and rate limiting (`TIME_PER_FAUCET`).
- Monitor faucet balance; the bot sends Telegram warnings when low.

### 14) Repository Scripts
- `npm run dev` – Start with nodemon (development)
- `npm start` – Start with Node (production)

### 15) Rotate and Compress Logs (system logrotate)
Use logrotate to rotate daily, keep 30 days, and compress old logs. Replace the path with your actual project path if different.

```bash
sudo tee /etc/logrotate.d/cvc-faucet >/dev/null <<'CONF'
~/cvc-faucet/logs/discord.log {
  daily
  rotate 30
  missingok
  notifempty
  compress
  delaycompress
  copytruncate
  dateext
  dateformat -%Y%m%d
}
CONF
```

Notes:
- The rotated files will be stored in the same `logs/` directory, e.g., `discord.log-YYYYMMDD.gz`.
- Test run: `sudo logrotate -d /etc/logrotate.d/cvc-faucet` (dry-run) or force: `sudo logrotate -f /etc/logrotate.d/cvc-faucet`.

### Reference
- Original Discord server link: [Discord Server Invite](https://discord.gg/RsqeW4Yv)
