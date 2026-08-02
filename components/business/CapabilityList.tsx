import clsx from 'clsx'
import { business } from '@/content/business'

export interface CapabilityListProps {
  className?: string
}

/**
 * The six employee-portal capabilities as a definition list. No motion of its own: the
 * enclosing Section already fades. Server component, so these strings never enter a client bundle.
 */
export function CapabilityList({ className }: CapabilityListProps) {
  return (
    <dl className={clsx('grid grid-cols-1 gap-8 sm:grid-cols-2', className)}>
      {business.portal.capabilities.map((capability) => (
        <div key={capability.id} className="border-t border-border-subtle pt-4">
          <dt>
            <h3 className="text-h3 text-text-primary">{capability.title}</h3>
          </dt>
          <dd className="mt-2 text-body text-text-secondary">{capability.body}</dd>
        </div>
      ))}
    </dl>
  )
}
