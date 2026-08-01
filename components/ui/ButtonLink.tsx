import Link from 'next/link'
import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface ButtonLinkProps {
  href: string
  children: ReactNode
  variant?: 'primary' | 'ghost'
  className?: string
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-body font-medium ' +
  'transition-colors duration-(--dur-fast)'

const VARIANT: Record<NonNullable<ButtonLinkProps['variant']>, string> = {
  primary: 'bg-accent text-accent-contrast hover:bg-accent-hover',
  ghost: 'border border-border-strong text-text-primary hover:bg-surface-1',
}

/** Primary/ghost link button. Every internal href carries a trailing slash. */
export function ButtonLink({ href, children, variant = 'primary', className }: ButtonLinkProps) {
  return (
    <Link href={href} className={clsx(BASE, VARIANT[variant], className)}>
      {children}
    </Link>
  )
}
