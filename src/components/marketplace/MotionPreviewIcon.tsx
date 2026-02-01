/**
 * MotionPreviewIcon - Contextually unique CSS animations for each product category.
 *
 * - Agents:      Pulsing neural-network nodes (thinking/AI processing)
 * - Workflows:   Flowing dots along a path (data pipeline in motion)
 * - Automations: Rotating gear with lightning accent (scheduled task engine)
 * - Bots:        Typing indicator bubbles (chat interaction)
 *
 * All animations are pure CSS to avoid JS overhead during scroll.
 */

import { ProductCategory } from '../../types/marketplace';

interface MotionPreviewIconProps {
  category: ProductCategory;
  /** Optional pixel size, defaults to 40 */
  size?: number;
  className?: string;
}

export default function MotionPreviewIcon({
  category,
  size = 40,
  className = '',
}: MotionPreviewIconProps) {
  const s = size;
  const half = s / 2;

  return (
    <div
      className={`motion-preview-icon relative flex-shrink-0 ${className}`}
      style={{ width: s, height: s }}
      aria-hidden="true"
    >
      {category === 'agents' && <AgentIcon size={s} half={half} />}
      {category === 'workflows' && <WorkflowIcon size={s} half={half} />}
      {category === 'automations' && <AutomationIcon size={s} half={half} />}
      {category === 'bots' && <BotIcon size={s} half={half} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Agent: pulsing neural nodes connected by lines                      */
/* ------------------------------------------------------------------ */
function AgentIcon({ size, half }: { size: number; half: number }) {
  const r = size * 0.09;
  const positions = [
    [half, size * 0.18],
    [size * 0.22, half],
    [size * 0.78, half],
    [half, size * 0.82],
  ];
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {/* connection lines */}
      <line x1={positions[0][0]} y1={positions[0][1]} x2={positions[1][0]} y2={positions[1][1]} className="stroke-primary/40" strokeWidth={1} />
      <line x1={positions[0][0]} y1={positions[0][1]} x2={positions[2][0]} y2={positions[2][1]} className="stroke-primary/40" strokeWidth={1} />
      <line x1={positions[1][0]} y1={positions[1][1]} x2={positions[3][0]} y2={positions[3][1]} className="stroke-primary/40" strokeWidth={1} />
      <line x1={positions[2][0]} y1={positions[2][1]} x2={positions[3][0]} y2={positions[3][1]} className="stroke-primary/40" strokeWidth={1} />
      {/* nodes */}
      {positions.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          className="fill-primary"
          style={{
            animation: `motionPulseNode 1.6s ease-in-out ${i * 0.3}s infinite`,
          }}
        />
      ))}
      {/* center brain node */}
      <circle cx={half} cy={half} r={r * 1.6} className="fill-primary/70" style={{ animation: 'motionPulseNode 2s ease-in-out infinite' }} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Workflow: dots flowing along a curved path                          */
/* ------------------------------------------------------------------ */
function WorkflowIcon({ size }: { size: number; half: number }) {
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <path
        d={`M${size * 0.1},${size * 0.5} C${size * 0.3},${size * 0.15} ${size * 0.7},${size * 0.85} ${size * 0.9},${size * 0.5}`}
        fill="none"
        className="stroke-secondary/30"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          r={size * 0.06}
          className="fill-secondary"
          style={{ animation: `motionFlowDot 2s ease-in-out ${i * 0.5}s infinite` }}
        >
          <animateMotion
            dur="2s"
            begin={`${i * 0.5}s`}
            repeatCount="indefinite"
            path={`M${size * 0.1},${size * 0.5} C${size * 0.3},${size * 0.15} ${size * 0.7},${size * 0.85} ${size * 0.9},${size * 0.5}`}
          />
        </circle>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Automation: rotating gear with a lightning accent                    */
/* ------------------------------------------------------------------ */
function AutomationIcon({ size, half }: { size: number; half: number }) {
  const teeth = 8;
  const outerR = size * 0.4;
  const innerR = size * 0.28;
  const toothW = 0.22;

  /* Build gear path */
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a1 = (Math.PI * 2 * i) / teeth - toothW;
    const a2 = (Math.PI * 2 * i) / teeth + toothW;
    const a3 = (Math.PI * 2 * (i + 0.5)) / teeth - toothW;
    const a4 = (Math.PI * 2 * (i + 0.5)) / teeth + toothW;
    const cmd = i === 0 ? 'M' : 'L';
    d += `${cmd}${half + outerR * Math.cos(a1)},${half + outerR * Math.sin(a1)} `;
    d += `L${half + outerR * Math.cos(a2)},${half + outerR * Math.sin(a2)} `;
    d += `L${half + innerR * Math.cos(a3)},${half + innerR * Math.sin(a3)} `;
    d += `L${half + innerR * Math.cos(a4)},${half + innerR * Math.sin(a4)} `;
  }
  d += 'Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <g style={{ transformOrigin: 'center', animation: 'motionGearSpin 4s linear infinite' }}>
        <path d={d} className="fill-amber-500/60" />
        <circle cx={half} cy={half} r={size * 0.12} className="fill-background" />
      </g>
      {/* lightning bolt */}
      <polygon
        points={`${half - 1},${size * 0.3} ${half + 2},${half - 1} ${half},${half - 1} ${half + 1},${size * 0.7} ${half - 2},${half + 1} ${half},${half + 1}`}
        className="fill-amber-400"
        style={{ animation: 'motionLightningFlash 2s ease-in-out infinite' }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Bot: typing indicator (three bouncing dots)                         */
/* ------------------------------------------------------------------ */
function BotIcon({ size, half }: { size: number; half: number }) {
  const dotR = size * 0.07;
  const gap = size * 0.2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {/* chat bubble outline */}
      <rect
        x={size * 0.12}
        y={size * 0.18}
        width={size * 0.76}
        height={size * 0.52}
        rx={size * 0.12}
        className="fill-none stroke-primary/40"
        strokeWidth={1.2}
      />
      {/* tail */}
      <polygon
        points={`${size * 0.28},${size * 0.7} ${size * 0.2},${size * 0.82} ${size * 0.38},${size * 0.7}`}
        className="fill-none stroke-primary/40"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      {/* typing dots */}
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={half + (i - 1) * gap}
          cy={half * 0.95}
          r={dotR}
          className="fill-primary"
          style={{
            animation: `motionTypingBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </svg>
  );
}
