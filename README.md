# AniChat

Anime-style public chat room. React + Vite + TypeScript frontend, Node + Express + Socket.IO backend. One server serves both the built frontend and the WebSocket endpoint, so there is no CORS setup by default.

## Run locally
```bash
npm install
npm run dev          # client http://localhost:5173, server :3001
# or production mode:
npm run build && npm start   # http://localhost:3001
```

## Test with two devices
1. Run `npm run build && npm start` on your computer. Find its LAN IP (`ipconfig` / `ifconfig`).
2. Put your phone on the same Wi‑Fi and open `http://<LAN-IP>:3001`. Open the same URL on the computer.
3. Enter different nicknames. Messages, the online count, and the typing indicator should update on both without refreshing.
(After cloud deployment, simply open the Render URL on two devices.)

## Messages: temporary only
The last 50 messages are held in server memory. They disappear on restart or redeploy (and when Render's free plan sleeps). Nothing is written to disk or a database. Theme, nickname and avatar are remembered in the visitor's own browser (localStorage).

## Environment variables
| Name | Required | Purpose |
|---|---|---|
| `PORT` | no (set by host) | Server port |
| `CLIENT_ORIGIN` | no | Comma-separated allowed origins. Leave empty when server serves the frontend (same-origin). Set it only if the frontend is hosted elsewhere, and then also point the client at the server URL. |

No secrets are required. Never put credentials in client code.

## Safeguards
Server validates nickname (2–20), avatar index, and message (1–300 chars, control characters stripped); 5 messages per 10 seconds per connection; React escapes all text; CORS is same-origin unless `CLIENT_ORIGIN` is set.

## Deploy on Render
1. Push this folder to a GitHub repository.
2. In Render: **New → Blueprint** (uses `render.yaml`), or **New → Web Service** with build `npm install && npm run build`, start `npm start`, health check `/health`.
3. Wait for the deploy, then open the `https://<name>.onrender.com` URL. Free instances sleep after inactivity, so the first load can take about a minute.
4. Test from two devices using that URL.

## Connect your domain
You haven't confirmed whether you own **civicmindai.com** or **civicmindai.in**, so don't assume either works yet.
1. **Confirm in GoDaddy:** sign in → *My Products* → *Domains*. Only a domain listed there with an active status is yours. Check your order confirmation email too. If the .com isn't listed, the purchase didn't complete, and the .in shown earlier is the only domain on the account. Use whichever one is listed.
2. **Add it in Render:** your service → *Settings → Custom Domains → Add*. Add the root (e.g. `civicmindai.com`) and `www.`. Render then shows the exact DNS records to create.
3. **Add DNS records in GoDaddy:** domain → *DNS*. Create exactly the records Render shows (typically a CNAME for `www` and an A record or ALIAS for the root). **Impact:** if a record with the same name already exists (GoDaddy's parked-page `A` record or a `www` CNAME), it must be replaced, since two conflicting records break resolution. Anything controlling email (MX, TXT) should be left alone. Record the existing values before changing anything.
4. **Verify and enable HTTPS:** back in Render, click *Verify*. DNS can take minutes to 48 hours. Render issues a free TLS certificate automatically once DNS resolves. Then open `https://yourdomain` and confirm the padlock.
Never share your GoDaddy password; all of this is done in your own dashboards.
"# anichat" 
