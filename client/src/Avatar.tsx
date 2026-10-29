type Kind = 'twin' | 'bob' | 'long' | 'spiky' | 'messy' | 'soft';
export const AVATARS: { name: string; hair: string; eye: string; cloth: string; kind: Kind }[] = [
  { name: 'Hana', hair: '#ff8fb8', eye: '#7a4dff', cloth: '#ffd1e6', kind: 'twin' },
  { name: 'Mio', hair: '#6ea8ff', eye: '#14b8a6', cloth: '#cfe3ff', kind: 'bob' },
  { name: 'Suki', hair: '#b98cff', eye: '#ff5fa2', cloth: '#e6d4ff', kind: 'long' },
  { name: 'Ren', hair: '#3b3f8f', eye: '#38bdf8', cloth: '#a5b4fc', kind: 'spiky' },
  { name: 'Kai', hair: '#f59e0b', eye: '#16a34a', cloth: '#fde68a', kind: 'messy' },
  { name: 'Aoi', hair: '#2dd4bf', eye: '#a855f7', cloth: '#99f6e4', kind: 'soft' },
];
const FRONT: Record<string, string> = {
  bangs: 'M24 56 C20 20 80 20 76 56 C70 42 62 36 50 36 C38 36 30 42 24 56Z',
  spiky: 'M24 56 L21 30 L35 38 L41 18 L52 35 L64 18 L68 37 L79 30 L76 56 C68 42 32 42 24 56Z',
  soft: 'M24 58 C19 24 81 20 76 58 C68 46 56 36 44 32 C40 42 32 50 24 58Z',
};
export default function Avatar({ id, size = 48 }: { id: number; size?: number }) {
  const a = AVATARS[id] ?? AVATARS[0];
  const girl = a.kind === 'twin' || a.kind === 'bob' || a.kind === 'long';
  const front = girl ? FRONT.bangs : a.kind === 'spiky' ? FRONT.spiky : FRONT.soft;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={a.name} style={{ flex: 'none' }}>
      {a.kind === 'twin' && <><circle cx="20" cy="66" r="13" fill={a.hair} /><circle cx="80" cy="66" r="13" fill={a.hair} /></>}
      {a.kind === 'bob' && <rect x="18" y="30" width="64" height="48" rx="22" fill={a.hair} />}
      {a.kind === 'long' && <rect x="17" y="28" width="66" height="68" rx="26" fill={a.hair} />}
      <path d="M18 100 C20 82 35 78 50 78 C65 78 80 82 82 100Z" fill={a.cloth} />
      <path d="M43 79 L50 88 L57 79Z" fill={a.eye} opacity=".85" />
      <ellipse cx="50" cy="56" rx="25" ry="24" fill="#ffe6d6" />
      {[39, 61].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="58" rx="5.6" ry="7" fill={a.eye} />
          <ellipse cx={x} cy="59" rx="2.4" ry="4" fill="#2b1b3d" />
          <circle cx={x - 1.8} cy="55.5" r="2.2" fill="#fff" /><circle cx={x + 1.8} cy="61" r="1.1" fill="#fff" />
          <path d={`M${x - 7} 53 Q${x} 49 ${x + 7} 53`} stroke="#2b1b3d" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      ))}
      <ellipse cx="31" cy="67" rx="4" ry="2.4" fill="#ff8fa8" opacity=".55" /><ellipse cx="69" cy="67" rx="4" ry="2.4" fill="#ff8fa8" opacity=".55" />
      <path d="M46 69 Q50 73 54 69" stroke="#b5475f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d={front} fill={a.hair} />
      <path d="M30 40 Q40 33 52 35" stroke="#fff" strokeOpacity=".35" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
