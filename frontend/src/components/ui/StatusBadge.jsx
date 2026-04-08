import clsx from 'clsx'

const variants = {
  urgent: 'bg-error-container text-error',
  'in-progress': 'bg-primary-fixed text-primary',
  pending: 'bg-surface-variant text-on-surface-variant',
  resolved: 'bg-green-100 text-green-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-error-container text-error',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-surface-variant text-on-surface-variant',
  'on-leave': 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  scheduled: 'bg-primary-fixed text-primary',
  overdue: 'bg-error-container text-error',
  occupied: 'bg-primary text-white',
  vacant: 'bg-primary-fixed-dim text-on-primary-fixed',
  maintenance: 'bg-error/40 text-error',
}

export default function StatusBadge({ status, className }) {
  const normalized = status?.toLowerCase().replace(/_/g, '-') || 'pending'
  return (
    <span className={clsx(
      'px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider inline-block',
      variants[normalized] || variants.pending,
      className
    )}>
      {status}
    </span>
  )
}
