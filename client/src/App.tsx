import { useEffect, useRef, useState, FormEvent } from 'react';
import { io, Socket } from 'socket.io-client';
import Avatar, { AVATARS } from './Avatar';

type Theme = 'dark' | 'light' | 'warm';
type Msg = { id: string; nick: string; avatar: number; text: string; ts: number };
type User = { nick: string; avatar: number };
type Ack = { ok: boolean; error?: string };
const THEMES: { id: Theme; label: string }[] = [{ id: 'dark', label: 'Dark' }, { id: 'light', label: 'Light' }, { id: 'warm', label: 'Warm' }];
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };

function Ambient() {
  return <div className="ambient" aria-hidden>{Array.from({ length: 16 }, (_, i) => (
    <span key={i} className="bit" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${-(i * 1.7) % 14}s`, animationDuration: `${12 + (i % 5) * 3}s`, fontSize: `${12 + (i % 4) * 6}px` }} />
  ))}</div>;
}

function Welcome({ onEnter }: { onEnter: (u: User) => void }) {
  const [nick, setNick] = useState(get('anichat-nick') ?? '');
  const [avatar, setAvatar] = useState(Number(get('anichat-avatar') ?? 0) || 0);
  const [err, setErr] = useState('');
  const [leaving, setLeaving] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = nick.trim().replace(/\s+/g, ' ');
    if (n.length < 2) return setErr('Pick a nickname with 2–20 characters.');
    put('anichat-nick', n); put('anichat-avatar', String(avatar));
    setLeaving(true); setTimeout(() => onEnter({ nick: n, avatar }), 380);
  };
  return (
    <main className={`welcome ${leaving ? 'leave' : 'enter'}`}>
      <div className="cast" aria-hidden>{[0, 3, 1, 4, 2, 5].map((id, i) => <span key={id} style={{ animationDelay: `${i * 0.25}s` }}><Avatar id={id} size={64} /></span>)}</div>
      <h1>Welcome to AniChat</h1>
      <p className="sub">A cozy public café for everyone. Pick a face, pick a name, say hi.</p>
      <form onSubmit={submit} className="panel">
        <label htmlFor="nick">Nickname</label>
        <input id="nick" value={nick} maxLength={20} autoComplete="off" onChange={(e) => { setNick(e.target.value); setErr(''); }} placeholder="e.g. MochiFox" />
        <div className="picker" role="radiogroup" aria-label="Avatar">
          {AVATARS.map((a, i) => (
            <button type="button" key={a.name} role="radio" aria-checked={avatar === i} className={avatar === i ? 'on' : ''} onClick={() => setAvatar(i)}>
              <Avatar id={i} size={52} /><small>{a.name}</small>
            </button>
          ))}
        </div>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="go" type="submit">Enter Chat</button>
        <p className="fine">This is a public room. Nicknames are not verified, so anyone can use any name. Don’t share private information.</p>
      </form>
    </main>
  );
}

function Chat({ user, onLeave }: { user: User; onLeave: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [online, setOnline] = useState(0);
  const [typing, setTyping] = useState<string[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const sock = useRef<Socket | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const idle = useRef<number>();

  useEffect(() => {
    const s = io(); sock.current = s;
    s.on('connect', () => { setStatus('connected'); s.emit('join', user, (r: Ack) => { if (!r.ok) setErr(r.error ?? 'Could not join the room.'); }); });
    s.on('disconnect', () => setStatus('reconnecting'));
    s.on('connect_error', () => setStatus('reconnecting'));
    s.on('history', (m: Msg[]) => setMsgs(m));
    s.on('message', (m: Msg) => setMsgs((p) => [...p.slice(-199), m]));
    s.on('online', setOnline);
    s.on('typing', ({ nick, on }: { nick: string; on: boolean }) => setTyping((p) => (on ? [...new Set([...p, nick])] : p.filter((n) => n !== nick))));
    return () => { s.disconnect(); };
  }, [user]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typing]);

  const change = (v: string) => {
    setText(v); setErr('');
    sock.current?.emit('typing', true);
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => sock.current?.emit('typing', false), 1800);
  };
  const send = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    if (status !== 'connected') return setErr('You’re offline. Reconnecting — try again in a moment.');
    sock.current?.emit('message', t, (r: Ack) => { if (!r.ok) setErr(r.error ?? 'Message not sent.'); else { setText(''); sock.current?.emit('typing', false); } });
  };
  const label = { connecting: 'Connecting…', connected: 'Connected', reconnecting: 'Reconnecting…' }[status];
  return (
    <main className="chat enter">
      <header>
        <button className="brand" onClick={onLeave} title="Leave the room">🌸 AniChat</button>
        <span className={`pill ${status}`}><i />{label}</span>
        <span className="pill">{online} online</span>
      </header>
      <p className="notice">Public room — everyone here can read your messages. Nicknames aren’t verified. Only the last 50 messages are kept, in server memory.</p>
      <section className="log" aria-live="polite">
        {msgs.length === 0 && <p className="empty">No messages yet. Say hello to start the conversation.</p>}
        {msgs.map((m) => (
          <article key={m.id} className={`row ${m.nick === user.nick && m.avatar === user.avatar ? 'me' : ''}`}>
            <Avatar id={m.avatar} size={40} />
            <div className="bubble"><b>{m.nick}</b><time>{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time><p>{m.text}</p></div>
          </article>
        ))}
        <div ref={end} />
      </section>
      <p className="typing">{typing.length > 0 && <><span className="dots"><i /><i /><i /></span>{typing.slice(0, 2).join(', ')}{typing.length > 2 ? ' and others' : ''} typing…</>}</p>
      {err && <p className="err" role="alert">{err}</p>}
      <form className="composer" onSubmit={send}>
        <input value={text} maxLength={300} onChange={(e) => change(e.target.value)} placeholder="Write a message…" aria-label="Message" autoComplete="off" />
        <button type="submit">Send</button>
      </form>
    </main>
  );
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => { const t = get('anichat-theme'); return t === 'light' || t === 'warm' ? t : 'dark'; });
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { document.documentElement.dataset.theme = theme; put('anichat-theme', theme); }, [theme]);
  return (
    <>
      <Ambient />
      <nav className="themes" aria-label="Theme">{THEMES.map((t) => <button key={t.id} className={theme === t.id ? 'on' : ''} onClick={() => setTheme(t.id)}>{t.label}</button>)}</nav>
      {user ? <Chat user={user} onLeave={() => setUser(null)} /> : <Welcome onEnter={setUser} />}
    </>
  );
}
