import express from 'express';
import http from 'http';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';

const dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const ORIGINS = (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
const MAX_TEXT = 300, MAX_HISTORY = 50, AVATARS = 6;
const RATE_N = 5, RATE_MS = 10000;

const app = express();
app.disable('x-powered-by');
app.get('/health', (_q, r) => r.send('ok'));
const dist = path.join(dir, '../client/dist');
app.use(express.static(dist));
app.get('*', (_q, r) => r.sendFile(path.join(dist, 'index.html')));

const server = http.createServer(app);
// No CLIENT_ORIGIN => same-origin only (the default when server also serves the client).
const io = new Server(server, { cors: { origin: ORIGINS.length ? ORIGINS : false }, maxHttpBufferSize: 4096 });

const history = []; // in memory only: last 50 messages, cleared on restart
const clean = (s) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
const online = () => [...io.sockets.sockets.values()].filter((s) => s.data.user).length;

io.on('connection', (socket) => {
  let stamps = [], lastTyping = 0;

  socket.on('join', (p, ack = () => {}) => {
    const nick = clean(p?.nick).slice(0, 20);
    const avatar = Number(p?.avatar);
    if (nick.length < 2) return ack({ ok: false, error: 'Nickname must be 2–20 characters.' });
    if (!Number.isInteger(avatar) || avatar < 0 || avatar >= AVATARS) return ack({ ok: false, error: 'Pick an avatar.' });
    socket.data.user = { nick, avatar };
    socket.emit('history', history);
    io.emit('online', online());
    ack({ ok: true });
  });

  socket.on('message', (text, ack = () => {}) => {
    const u = socket.data.user;
    if (!u) return ack({ ok: false, error: 'Join the room first.' });
    const t = clean(text);
    if (!t) return ack({ ok: false, error: 'Message is empty.' });
    if (t.length > MAX_TEXT) return ack({ ok: false, error: `Max ${MAX_TEXT} characters.` });
    const now = Date.now();
    stamps = stamps.filter((x) => now - x < RATE_MS);
    if (stamps.length >= RATE_N) return ack({ ok: false, error: 'Slow down a little — too many messages.' });
    stamps.push(now);
    const msg = { id: crypto.randomUUID(), nick: u.nick, avatar: u.avatar, text: t, ts: now };
    history.push(msg);
    if (history.length > MAX_HISTORY) history.shift();
    io.emit('message', msg);
    ack({ ok: true });
  });

  socket.on('typing', (on) => {
    const u = socket.data.user, now = Date.now();
    if (!u || now - lastTyping < 400) return;
    lastTyping = now;
    socket.broadcast.emit('typing', { nick: u.nick, on: !!on });
  });

  socket.on('disconnect', () => {
    const u = socket.data.user;
    if (u) { socket.broadcast.emit('typing', { nick: u.nick, on: false }); io.emit('online', online()); }
  });
});

server.listen(PORT, () => console.log(`AniChat listening on :${PORT}`));
