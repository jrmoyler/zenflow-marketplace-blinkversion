import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

/*
 * The official ZenFlow button: collective-ai-divisions assets/core.css `.btn` / `.btn.ghost`
 * with assets/zenflow.css tokens (accent #7C3AED, hover #6d2fe0, radius 4px).
 * Styles live in index.css as `.zf-btn` / `.zf-btn-ghost`.
 */

export interface ZfButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** `primary` is the filled violet `.btn`; `ghost` is the outlined `.btn.ghost`. */
  variant?: 'primary' | 'ghost';
  /** Render the child element (e.g. an <a>) with button styling. */
  asChild?: boolean;
}

export const ZfButton = React.forwardRef<HTMLButtonElement, ZfButtonProps>(
  ({ variant = 'primary', asChild = false, className, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn('zf-btn', variant === 'ghost' && 'zf-btn-ghost', className)}
        {...(asChild ? {} : { type: type ?? 'button' })}
        {...props}
      />
    );
  },
);
ZfButton.displayName = 'ZfButton';

export default ZfButton;
