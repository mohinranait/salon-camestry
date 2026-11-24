import type { MilestoneDoc } from '@/lib/types';

/** A semicircular "evolution gauge" showing how far the build has come. */
export function EvolutionGauge({ progress, milestones, label }: { progress: number; milestones: MilestoneDoc[]; label?: string }) {
  const r = 120;
  const cx = 150;
  const cy = 150;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - progress / 100);
  const ticks = milestones.length;
  const current = milestones.find((m) => m.status === 'in-progress') ?? milestones.find((m) => m.status === 'upcoming');

  return (
    <figure className="relative mx-auto w-full max-w-md" aria-label={`Build-out progress ${progress}%`}>
      <svg viewBox="0 0 300 175" className="w-full overflow-visible">
        <defs>
          <linearGradient id="gauge-gold" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--sc-gold)" stopOpacity="0.6" />
            <stop offset="60%" stopColor="var(--sc-gold-light)" />
            <stop offset="100%" stopColor="var(--sc-gold)" />
          </linearGradient>
        </defs>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="14" strokeLinecap="round" />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="url(#gauge-gold)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(.2,.7,.2,1)' }}
        />
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const angle = Math.PI - (i / Math.max(1, ticks)) * Math.PI;
          const x1 = cx + Math.cos(angle) * (r - 22);
          const y1 = cy - Math.sin(angle) * (r - 22);
          const x2 = cx + Math.cos(angle) * (r - 30);
          const y2 = cy - Math.sin(angle) * (r - 30);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--sc-gold)" strokeOpacity="0.7" strokeWidth="1.5" />;
        })}
        <text x={cx} y={cy - 28} textAnchor="middle" className="font-display" fontSize="60" fill="currentColor">
          {progress}
          <tspan fontSize="26" fill="var(--sc-gold)">%</tspan>
        </text>
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="9" letterSpacing="3.5" fill="currentColor" opacity="0.6">
          {(label ?? 'TO GRAND OPENING').toUpperCase()}
        </text>
      </svg>
      {current && (
        <figcaption className="mt-4 text-center text-xs font-semibold tracking-[0.25em] uppercase opacity-70">
          Now: <span className="text-sc-gold">{current.title}</span>
        </figcaption>
      )}
    </figure>
  );
}
