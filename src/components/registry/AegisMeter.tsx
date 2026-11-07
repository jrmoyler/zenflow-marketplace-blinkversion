import { cn } from '@/lib/utils';

interface AegisMeterProps {
  score: number;
  size?: 'sm' | 'lg';
  className?: string;
}

/**
 * The Aegis readout: transparency score 0–100 as a gold instrument bar.
 * Gold is reserved for governance signals (zenflow-division brand rule).
 */
export default function AegisMeter({ score, size = 'sm', className }: AegisMeterProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const large = size === 'lg';
  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={`Aegis transparency score ${clamped} of 100`}
    >
      <span className={cn('font-mono tabular-nums text-zf-aegis', large ? 'text-2xl font-medium' : 'text-xs')}>
        {clamped}
      </span>
      <span className={cn('relative overflow-hidden rounded-[2px] bg-zf-grid', large ? 'h-1.5 w-40' : 'h-1 w-12')}>
        <span className="absolute inset-y-0 left-0 bg-zf-aegis" style={{ width: `${clamped}%` }} />
      </span>
      {large && <span className="text-xs text-zf-muted">Aegis / 100</span>}
    </div>
  );
}
