// Generates on-brand placeholder artwork for the seed. Every image is clearly
// marked as a sample so the client knows to replace it with real photography.
import sharp from 'sharp';

const GOLD = '#C6A15B';
const GOLD_L = '#E4CC94';
const BLACK = '#0D0D0D';
const IVORY = '#FAF7F1';

const tag = (w: number, h: number, light = false) =>
  `<text x="${w - 28}" y="${h - 26}" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(w / 90)}" letter-spacing="4" fill="${light ? '#00000055' : '#ffffff55'}">SAMPLE IMAGE · REPLACE IN MEDIA LIBRARY</text>`;

async function jpg(svg: string, quality = 84) {
  return sharp(Buffer.from(svg)).jpeg({ quality, mozjpeg: true }).toBuffer();
}
async function png(svg: string) {
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

function noise(id: string, opacity = 0.18) {
  return `<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${opacity} 0"/></filter>`;
}

/** Architectural corridor rendering: arched mirrors, warm pendants, gold inlay floor. */
export function heroRendering(w = 2400, h = 1500) {
  const vx = w / 2;
  const vy = h * 0.46;
  const doors = Array.from({ length: 6 }, (_, i) => {
    const t = i / 6;
    const s = 1 - t * 0.82;
    const xl = vx - (w * 0.48) * s;
    const xr = vx + (w * 0.48) * s;
    const top = vy - h * 0.42 * s;
    const bottom = vy + h * 0.44 * s;
    const dw = w * 0.07 * s;
    return `
      <rect x="${xl}" y="${top + (bottom - top) * 0.12}" width="${dw}" height="${(bottom - top) * 0.8}" fill="#1b1714" stroke="${GOLD}" stroke-opacity="${0.5 * s + 0.1}" stroke-width="${2 * s}"/>
      <rect x="${xr - dw}" y="${top + (bottom - top) * 0.12}" width="${dw}" height="${(bottom - top) * 0.8}" fill="#1b1714" stroke="${GOLD}" stroke-opacity="${0.5 * s + 0.1}" stroke-width="${2 * s}"/>
      <circle cx="${xl + dw / 2}" cy="${top + (bottom - top) * 0.05}" r="${10 * s}" fill="${GOLD_L}" filter="url(#glow)"/>
      <circle cx="${xr - dw / 2}" cy="${top + (bottom - top) * 0.05}" r="${10 * s}" fill="${GOLD_L}" filter="url(#glow)"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="light" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="#6b5534"/><stop offset="0.45" stop-color="#251d15"/><stop offset="1" stop-color="${BLACK}"/></radialGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2420"/><stop offset="1" stop-color="#0a0908"/></linearGradient>
    <filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="14"/></filter>
    ${noise('n', 0.22)}
  </defs>
  <rect width="${w}" height="${h}" fill="url(#light)"/>
  <polygon points="0,${h} ${w},${h} ${vx + w * 0.08},${vy + h * 0.06} ${vx - w * 0.08},${vy + h * 0.06}" fill="url(#floor)"/>
  ${Array.from({ length: 9 }, (_, i) => `<line x1="${(i / 8) * w}" y1="${h}" x2="${vx + (i / 8 - 0.5) * w * 0.16}" y2="${vy + h * 0.06}" stroke="${GOLD}" stroke-opacity="0.18" stroke-width="2"/>`).join('')}
  <line x1="${vx}" y1="${h}" x2="${vx}" y2="${vy + h * 0.06}" stroke="${GOLD}" stroke-opacity="0.6" stroke-width="4"/>
  <rect x="${vx - w * 0.08}" y="${vy - h * 0.16}" width="${w * 0.16}" height="${h * 0.22}" fill="#f3dfb0" opacity="0.35" filter="url(#glow)"/>
  <path d="M ${vx - w * 0.05} ${vy + h * 0.06} L ${vx - w * 0.05} ${vy - h * 0.08} A ${w * 0.05} ${w * 0.05} 0 0 1 ${vx + w * 0.05} ${vy - h * 0.08} L ${vx + w * 0.05} ${vy + h * 0.06} Z" fill="none" stroke="${GOLD_L}" stroke-width="3" opacity="0.7"/>
  ${doors}
  <rect width="${w}" height="${h}" filter="url(#n)"/>
  ${tag(w, h)}
</svg>`;
}

export function moodBoard(w = 1600, h = 2000) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="marble" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6f2ea"/><stop offset="0.5" stop-color="#e9e2d6"/><stop offset="1" stop-color="#f8f5ef"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8c6a2f"/><stop offset="0.5" stop-color="${GOLD_L}"/><stop offset="1" stop-color="#9b7738"/></linearGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e4b2f"/><stop offset="1" stop-color="#9a6d45"/></linearGradient>
    ${noise('n', 0.12)}
  </defs>
  <rect width="${w}" height="${h}" fill="${IVORY}"/>
  <rect x="80" y="80" width="${w * 0.55}" height="${h * 0.5}" fill="url(#marble)"/>
  ${Array.from({ length: 7 }, (_, i) => `<path d="M ${80 + i * 120} 80 C ${200 + i * 140} ${300 + i * 40}, ${40 + i * 120} ${600}, ${220 + i * 110} ${80 + h * 0.5}" stroke="#b9b0a2" stroke-width="${1 + (i % 3)}" fill="none" opacity="0.5"/>`).join('')}
  <rect x="${w * 0.6 + 40}" y="80" width="${w * 0.4 - 120}" height="${h * 0.24}" fill="${BLACK}"/>
  <rect x="${w * 0.6 + 40}" y="${h * 0.26 + 100}" width="${w * 0.4 - 120}" height="${h * 0.24 - 20}" fill="url(#gold)"/>
  <rect x="80" y="${h * 0.5 + 120}" width="${w * 0.34}" height="${h * 0.38}" fill="url(#wood)"/>
  ${Array.from({ length: 18 }, (_, i) => `<line x1="80" y1="${h * 0.5 + 140 + i * 40}" x2="${80 + w * 0.34}" y2="${h * 0.5 + 150 + i * 40}" stroke="#4d3320" stroke-opacity="0.35"/>`).join('')}
  <circle cx="${w * 0.7}" cy="${h * 0.72}" r="${w * 0.17}" fill="none" stroke="${GOLD}" stroke-width="10"/>
  <circle cx="${w * 0.7}" cy="${h * 0.72}" r="${w * 0.13}" fill="#2a2a2a"/>
  <text x="${w * 0.7}" y="${h * 0.73}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="96" fill="${GOLD_L}">Sc</text>
  <text x="${w * 0.6 + 70}" y="${h * 0.24 + 40}" font-family="Helvetica, Arial" font-size="28" letter-spacing="6" fill="${GOLD}">SIGNATURE BLACK</text>
  <text x="${w * 0.6 + 70}" y="${h * 0.5 + 40}" font-family="Helvetica, Arial" font-size="28" letter-spacing="6" fill="${BLACK}">METALLIC GOLD</text>
  <rect width="${w}" height="${h}" filter="url(#n)"/>
  ${tag(w, h, true)}
</svg>`;
}

/** Suite interior: arched mirror, styling chair, cabinetry, optional shampoo bowl. */
export function suiteImage(opts: { wet: boolean; double: boolean; tone: string }, w = 1800, h = 1200) {
  const stations = opts.double ? [w * 0.3, w * 0.66] : [w * 0.48];
  const station = (cx: number) => `
    <path d="M ${cx - 150} ${h * 0.62} L ${cx - 150} ${h * 0.3} A 150 150 0 0 1 ${cx + 150} ${h * 0.3} L ${cx + 150} ${h * 0.62} Z" fill="#d9d4cb" stroke="${GOLD}" stroke-width="10"/>
    <path d="M ${cx - 130} ${h * 0.6} L ${cx - 130} ${h * 0.31} A 130 130 0 0 1 ${cx + 130} ${h * 0.31} L ${cx + 130} ${h * 0.6} Z" fill="url(#mirror)"/>
    <rect x="${cx - 240}" y="${h * 0.64}" width="480" height="26" fill="${GOLD}"/>
    <rect x="${cx - 240}" y="${h * 0.66}" width="480" height="${h * 0.2}" fill="#1c1a18"/>
    <line x1="${cx}" y1="${h * 0.66}" x2="${cx}" y2="${h * 0.86}" stroke="${GOLD}" stroke-opacity="0.6" stroke-width="3"/>
    <circle cx="${cx - 30}" cy="${h * 0.76}" r="6" fill="${GOLD}"/><circle cx="${cx + 30}" cy="${h * 0.76}" r="6" fill="${GOLD}"/>
    <g transform="translate(${cx + 40}, ${h * 0.6})">
      <rect x="-90" y="40" width="180" height="150" rx="40" fill="#111"/>
      <rect x="-80" y="-80" width="160" height="150" rx="50" fill="#161616"/>
      <rect x="-10" y="190" width="20" height="70" fill="#888"/>
      <ellipse cx="0" cy="268" rx="90" ry="16" fill="#777"/>
    </g>`;
  const bowl = opts.wet
    ? `<g transform="translate(${w * 0.88}, ${h * 0.66})"><rect x="-110" y="-10" width="220" height="${h * 0.24}" fill="#151515"/><ellipse cx="0" cy="-12" rx="120" ry="34" fill="#f2f0ec" stroke="${GOLD}" stroke-width="6"/><path d="M -10 -110 q 0 -40 50 -40 l 20 0" stroke="${GOLD}" stroke-width="10" fill="none"/></g>`
    : `<g transform="translate(${w * 0.88}, ${h * 0.5})"><rect x="-100" y="-160" width="200" height="${h * 0.46}" fill="#efe9df" stroke="${GOLD}" stroke-width="4"/>${[0, 1, 2, 3].map((i) => `<line x1="-90" y1="${-110 + i * 90}" x2="90" y2="${-110 + i * 90}" stroke="${GOLD}" stroke-width="4"/>`).join('')}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${opts.tone}"/><stop offset="1" stop-color="#e8e1d5"/></linearGradient>
    <linearGradient id="mirror" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfd6d8"/><stop offset="0.5" stop-color="#f5f7f7"/><stop offset="1" stop-color="#aeb8bb"/></linearGradient>
    <radialGradient id="glow" cx="50%" cy="0%" r="80%"><stop offset="0" stop-color="#fff6df" stop-opacity="0.9"/><stop offset="1" stop-color="#fff6df" stop-opacity="0"/></radialGradient>
    ${noise('n', 0.1)}
  </defs>
  <rect width="${w}" height="${h}" fill="url(#wall)"/>
  <rect width="${w}" height="${h * 0.6}" fill="url(#glow)"/>
  <rect y="${h * 0.86}" width="${w}" height="${h * 0.14}" fill="#2b2622"/>
  ${Array.from({ length: 12 }, (_, i) => `<line x1="${i * (w / 11)}" y1="${h * 0.86}" x2="${i * (w / 11) - 60}" y2="${h}" stroke="#3a332d"/>`).join('')}
  ${stations.map(station).join('')}
  ${bowl}
  <text x="70" y="110" font-family="Helvetica, Arial" font-size="30" letter-spacing="8" fill="#00000066">${opts.double ? 'DOUBLE' : 'SINGLE'} · ${opts.wet ? 'WET' : 'DRY'} SUITE</text>
  <rect width="${w}" height="${h}" filter="url(#n)"/>
  ${tag(w, h, true)}
</svg>`;
}

type PlanSuite = { n: number; x: number; y: number; w: number; h: number; wet: boolean; double: boolean };

/** 3,813 sq ft plan: 20 suites on a central corridor with lobby, lounge and breakroom. */
export function floorPlan() {
  const W = 1600;
  const H = 1000;
  const suites: PlanSuite[] = [];
  const row = (y: number, h: number, start: number) => {
    let x = 360;
    for (let i = 0; i < 10; i++) {
      const double = i >= 7;
      const w = double ? 160 : 100;
      const n = start + i;
      const wet = [1, 2, 3, 11, 12, 13, 8, 18, 19].includes(n);
      suites.push({ n, x, y, w, h, wet, double });
      x += w;
    }
  };
  row(60, 370, 1);
  row(570, 370, 11);

  const suiteSvg = suites
    .map((s) => {
      const doorX = s.x + s.w / 2 - 22;
      const doorY = s.y < 430 ? s.y + s.h : s.y;
      return `
      <rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="${s.double ? '#f4ead3' : '#ffffff'}" stroke="#111" stroke-width="4"/>
      <line x1="${doorX}" y1="${doorY}" x2="${doorX + 44}" y2="${doorY}" stroke="#ffffff" stroke-width="6"/>
      <path d="M ${doorX} ${doorY} A 44 44 0 0 ${s.y < 430 ? 1 : 0} ${doorX + 44} ${doorY + (s.y < 430 ? -44 : 44)}" fill="none" stroke="#999" stroke-width="2" stroke-dasharray="4 4"/>
      ${s.wet ? `<circle cx="${s.x + s.w / 2}" cy="${s.y < 430 ? s.y + 60 : s.y + s.h - 60}" r="18" fill="none" stroke="${GOLD}" stroke-width="4"/>` : ''}
      <text x="${s.x + s.w / 2}" y="${s.y + s.h / 2 + 12}" text-anchor="middle" font-family="Helvetica, Arial" font-weight="700" font-size="34" fill="#111">${String(s.n).padStart(2, '0')}</text>
      <text x="${s.x + s.w / 2}" y="${s.y + s.h / 2 + 42}" text-anchor="middle" font-family="Helvetica, Arial" font-size="14" letter-spacing="2" fill="#777">${s.double ? 'DOUBLE' : 'SINGLE'}</text>`;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * 1.5}" height="${H * 1.5}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#fbfaf7"/>
  <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e9e4da" stroke-width="1"/></pattern></defs>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect x="60" y="60" width="1480" height="880" fill="#ffffff" stroke="#111" stroke-width="10"/>
  <rect x="60" y="430" width="1480" height="140" fill="#f1ede4"/>
  <line x1="360" y1="500" x2="1540" y2="500" stroke="${GOLD}" stroke-width="3" stroke-dasharray="14 10"/>
  ${suiteSvg}
  <rect x="60" y="60" width="300" height="370" fill="#efe6d2" stroke="#111" stroke-width="4"/>
  <text x="210" y="225" text-anchor="middle" font-family="Helvetica, Arial" font-weight="700" font-size="24" fill="#111">BREAKROOM</text>
  <text x="210" y="255" text-anchor="middle" font-family="Helvetica, Arial" font-size="16" letter-spacing="2" fill="#666">+ LAUNDRY</text>
  ${[0, 1].map((i) => `<rect x="${90 + i * 70}" y="330" width="56" height="70" rx="6" fill="#fff" stroke="#111" stroke-width="3"/><circle cx="${118 + i * 70}" cy="370" r="18" fill="none" stroke="#111" stroke-width="3"/>`).join('')}
  <rect x="60" y="570" width="300" height="370" fill="#1a1a1a" stroke="#111" stroke-width="4"/>
  <text x="210" y="745" text-anchor="middle" font-family="Helvetica, Arial" font-weight="700" font-size="22" fill="${GOLD_L}">WASH &amp; DRY</text>
  <text x="210" y="775" text-anchor="middle" font-family="Helvetica, Arial" font-size="16" letter-spacing="3" fill="#bbb">LOUNGE</text>
  ${[0, 1, 2].map((i) => `<ellipse cx="${120 + i * 90}" cy="630" rx="30" ry="18" fill="none" stroke="${GOLD}" stroke-width="4"/>`).join('')}
  ${[0, 1, 2].map((i) => `<circle cx="${120 + i * 90}" cy="880" r="26" fill="none" stroke="#ddd" stroke-width="3"/>`).join('')}
  <rect x="80" y="470" width="80" height="60" fill="#111"/>
  <text x="120" y="507" text-anchor="middle" font-family="Helvetica, Arial" font-size="12" fill="${GOLD}" letter-spacing="1">KIOSK</text>
  <line x1="60" y1="470" x2="60" y2="530" stroke="#fbfaf7" stroke-width="14"/>
  <path d="M 20 500 L 52 500 M 40 488 L 52 500 L 40 512" stroke="${GOLD}" stroke-width="5" fill="none"/>
  <text x="250" y="510" text-anchor="middle" font-family="Helvetica, Arial" font-weight="700" font-size="16" letter-spacing="3" fill="#111">LOBBY</text>
  <text x="1540" y="40" text-anchor="end" font-family="Helvetica, Arial" font-size="18" letter-spacing="4" fill="#111">SHEAR CHEMISTRY · 3,813 SQ FT · SUITE 201</text>
  <text x="60" y="40" font-family="Helvetica, Arial" font-size="14" letter-spacing="3" fill="#999">ILLUSTRATIVE PLAN · NOT TO SCALE</text>
  <g transform="translate(1440, 975)"><circle r="6" fill="none" stroke="${GOLD}" stroke-width="3"/><text x="14" y="5" font-family="Helvetica" font-size="13" fill="#666">= shampoo bowl (wet suite)</text></g>
</svg>`;

  const pct = (x: number, y: number) => ({ x: Math.round((x / W) * 1000) / 10, y: Math.round((y / H) * 1000) / 10 });
  const hotspots = [
    { ...pct(40, 500), label: '1', title: 'Main entrance & smart lock', description: 'Keyless 24/7 entry for pros, with secure guest access for clients.' },
    { ...pct(120, 455), label: '2', title: 'Wall-mounted directory kiosk', description: 'Clients find your suite number and check in the moment they walk in.' },
    { ...pct(210, 690), label: '3', title: 'Shared Wash & Dry Lounge', description: 'Dedicated shampoo bowls and hooded dryers, steps from every dry suite.' },
    { ...pct(210, 170), label: '4', title: 'Breakroom & laundry', description: 'A quiet place to recharge, plus complimentary commercial washers and dryers.' },
    { ...pct(410, 245), label: '5', title: 'Single wet suite', description: 'Private suite with its own shampoo bowl, styling chair, mirror and cabinetry.' },
    { ...pct(1060, 755), label: '6', title: 'Single dry suite', description: 'Ideal for lashes, brows, esthetics, nails and cut-focused stylists.' },
    { ...pct(1460, 245), label: '7', title: 'Double suites', description: 'Twice the space for two stations, a team, or a treatment bed and chair.' },
  ];
  return { svg, hotspots };
}

const BUILD_SCENES = {
  blueprint: (w: number, h: number) => `
    <rect width="${w}" height="${h}" fill="#1d2430"/>
    ${Array.from({ length: 40 }, (_, i) => `<line x1="${i * 60}" y1="0" x2="${i * 60}" y2="${h}" stroke="#ffffff" stroke-opacity="0.06"/>`).join('')}
    ${Array.from({ length: 30 }, (_, i) => `<line x1="0" y1="${i * 60}" x2="${w}" y2="${i * 60}" stroke="#ffffff" stroke-opacity="0.06"/>`).join('')}
    <g transform="rotate(-8 ${w / 2} ${h / 2})"><rect x="${w * 0.15}" y="${h * 0.16}" width="${w * 0.7}" height="${h * 0.66}" fill="#f4f1ea"/>
    <rect x="${w * 0.2}" y="${h * 0.24}" width="${w * 0.6}" height="${h * 0.5}" fill="none" stroke="#2f4a6b" stroke-width="6"/>
    ${Array.from({ length: 9 }, (_, i) => `<line x1="${w * 0.2 + i * (w * 0.6 / 9)}" y1="${h * 0.24}" x2="${w * 0.2 + i * (w * 0.6 / 9)}" y2="${h * 0.42}" stroke="#2f4a6b" stroke-width="3"/>`).join('')}
    <circle cx="${w * 0.7}" cy="${h * 0.62}" r="${h * 0.09}" fill="none" stroke="#b3261e" stroke-width="8"/>
    <text x="${w * 0.7}" y="${h * 0.63}" text-anchor="middle" font-family="Helvetica" font-weight="700" font-size="${h * 0.03}" fill="#b3261e">APPROVED</text></g>`,
  framing: (w: number, h: number) => `
    <rect width="${w}" height="${h}" fill="#8e8a84"/>
    <rect y="${h * 0.82}" width="${w}" height="${h * 0.18}" fill="#6d6a65"/>
    <rect y="${h * 0.12}" width="${w}" height="24" fill="#d2a56b"/>
    <rect y="${h * 0.8}" width="${w}" height="24" fill="#c99a5e"/>
    ${Array.from({ length: 16 }, (_, i) => `<rect x="${i * (w / 15) - 12}" y="${h * 0.12}" width="28" height="${h * 0.7}" fill="${i % 2 ? '#d8ad73' : '#cfa166'}"/>`).join('')}
    <rect x="${w * 0.4}" y="${h * 0.4}" width="${w * 0.2}" height="14" fill="#cfa166"/>`,
  plumbing: (w: number, h: number) => `
    <rect width="${w}" height="${h}" fill="#2b2b2b"/>
    ${Array.from({ length: 5 }, (_, i) => `<path d="M 0 ${h * 0.2 + i * h * 0.13} H ${w * (0.4 + i * 0.1)} V ${h}" stroke="${i % 2 ? '#b87333' : '#d9d9d9'}" stroke-width="${26 - i * 2}" fill="none" stroke-linejoin="round"/>`).join('')}
    ${Array.from({ length: 5 }, (_, i) => `<circle cx="${w * (0.4 + i * 0.1)}" cy="${h * 0.2 + i * h * 0.13}" r="22" fill="#e0b070"/>`).join('')}`,
  finishes: (w: number, h: number) => `
    <rect width="${w}" height="${h}" fill="#efe9e0"/>
    ${Array.from({ length: 8 }, (_, r) => Array.from({ length: 12 }, (_, c) => `<rect x="${c * (w / 12) + (r % 2 ? w / 24 : 0)}" y="${r * (h / 8)}" width="${w / 12 - 6}" height="${h / 8 - 6}" fill="${(r + c) % 3 ? '#f6f2ea' : '#e6ddd0'}"/>`).join('')).join('')}
    <rect x="${w * 0.08}" y="${h * 0.35}" width="${w * 0.84}" height="20" fill="${GOLD}"/>
    <rect x="${w * 0.62}" y="${h * 0.45}" width="${w * 0.26}" height="${h * 0.42}" fill="#111"/>
    <rect x="${w * 0.66}" y="${h * 0.5}" width="${w * 0.18}" height="${h * 0.12}" fill="${GOLD}" opacity="0.85"/>`,
  smartlock: (w: number, h: number) => `
    <rect width="${w}" height="${h}" fill="#151515"/>
    <rect x="${w * 0.3}" y="${h * 0.08}" width="${w * 0.4}" height="${h * 0.92}" fill="#232323" stroke="${GOLD}" stroke-width="6"/>
    <rect x="${w * 0.58}" y="${h * 0.42}" width="${w * 0.07}" height="${h * 0.22}" rx="18" fill="#0b0b0b" stroke="#444" stroke-width="3"/>
    ${Array.from({ length: 4 }, (_, r) => Array.from({ length: 3 }, (_, c) => `<circle cx="${w * 0.6 + c * w * 0.016}" cy="${h * 0.47 + r * h * 0.035}" r="${w * 0.005}" fill="${GOLD_L}" opacity="0.9"/>`).join('')).join('')}
    <text x="${w * 0.5}" y="${h * 0.24}" text-anchor="middle" font-family="Georgia" font-size="${h * 0.08}" fill="${GOLD}">07</text>`,
  reveal: (w: number, h: number) => heroRendering(w, h).replace(/^<svg[^>]*>|<\/svg>$/g, ''),
} as const;

export type BuildScene = keyof typeof BUILD_SCENES;

export function buildPhoto(scene: BuildScene, w = 1800, h = 1200) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs>${noise('n', 0.2)}<linearGradient id="vig" x1="0" y1="0" x2="0" y2="1"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></linearGradient></defs>${BUILD_SCENES[scene](w, h)}<rect width="${w}" height="${h}" fill="url(#vig)"/><rect width="${w}" height="${h}" filter="url(#n)"/>${tag(w, h)}</svg>`;
}

export function headshot(seed: number, w = 900, h = 1125) {
  const tones = [
    ['#3b2a20', '#8a5a3c', '#c58f62'],
    ['#2a2321', '#6e4a3a', '#a77455'],
    ['#2d2a27', '#9b6b4a', '#d6a273'],
    ['#1f1a18', '#5a3a2c', '#8f5f44'],
    ['#2b2420', '#b07d58', '#e0b287'],
    ['#221d1b', '#734d39', '#b98563'],
  ][seed % 6];
  const bg = ['#e8dccb', '#d9cbb6', '#efe4d4', '#cfc0aa', '#e3d6c3', '#d6c8b3'][seed % 6];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs><radialGradient id="bg" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity="0.7"/><stop offset="1" stop-color="${bg}"/></radialGradient>${noise('n', 0.1)}</defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="${w / 2}" cy="${h * 0.38}" r="${w * 0.27}" fill="${tones[0]}"/>
  <ellipse cx="${w / 2}" cy="${h * 0.42}" rx="${w * 0.17}" ry="${w * 0.21}" fill="${tones[2]}"/>
  <path d="M ${w * 0.08} ${h} C ${w * 0.1} ${h * 0.7}, ${w * 0.3} ${h * 0.64}, ${w / 2} ${h * 0.64} C ${w * 0.7} ${h * 0.64}, ${w * 0.9} ${h * 0.7}, ${w * 0.92} ${h} Z" fill="${seed % 2 ? BLACK : tones[1]}"/>
  <rect x="${w * 0.44}" y="${h * 0.56}" width="${w * 0.12}" height="${h * 0.1}" fill="${tones[2]}"/>
  <rect width="${w}" height="${h}" filter="url(#n)"/>
  ${tag(w, h, true)}
</svg>`;
}

export function ogImage(w = 1200, h = 630) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs><radialGradient id="g" cx="80%" cy="20%" r="80%"><stop offset="0" stop-color="#4a3a22"/><stop offset="1" stop-color="${BLACK}"/></radialGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect x="40" y="40" width="${w - 80}" height="${h - 80}" fill="none" stroke="${GOLD}" stroke-opacity="0.5" stroke-width="2"/>
  <text x="90" y="160" font-family="Helvetica, Arial" font-size="20" letter-spacing="8" fill="${GOLD}">SALON SUITES · SOUTHEAST ATLANTA</text>
  <text x="86" y="320" font-family="Georgia, serif" font-size="120" fill="${IVORY}">Shear</text>
  <text x="86" y="440" font-family="Georgia, serif" font-style="italic" font-size="120" fill="${GOLD_L}">Chemistry</text>
  <text x="90" y="530" font-family="Helvetica, Arial" font-size="22" letter-spacing="4" fill="#ffffffaa">20 TURNKEY SUITES · MORELAND AVE · OPENING MAY 2027</text>
</svg>`;
}

export function favicon(size = 512) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="${BLACK}"/>
  <rect x="${size * 0.08}" y="${size * 0.08}" width="${size * 0.84}" height="${size * 0.84}" rx="${size * 0.12}" fill="none" stroke="${GOLD}" stroke-width="${size * 0.025}"/>
  <text x="${size / 2}" y="${size * 0.64}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="${size * 0.46}" fill="${GOLD_L}">Sc</text>
</svg>`;
}

export const render = { jpg, png };
