export interface EmptyWellProps {
  kind: 'empty' | 'error' | 'unconfigured'
  message: string
  onRetry?: () => void
}

/**
 * Fills a Figure well with one centered line. No spinner, no shimmer, no illustration: this
 * state needs no reduced-motion branch of its own because it never moves in the first place.
 */
export function EmptyWell({ kind, message, onRetry }: EmptyWellProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p className="text-small text-text-secondary">{message}</p>
      {kind === 'error' && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-border-strong px-4 py-1.5 text-small text-text-primary transition-colors duration-(--dur-fast) hover:bg-surface-1"
        >
          Try again
        </button>
      )}
    </div>
  )
}
