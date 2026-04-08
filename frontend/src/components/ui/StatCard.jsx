import clsx from 'clsx'

export default function StatCard({ icon: Icon, value, label, badge, badgeColor = 'primary', gradient = false, className }) {
  return (
    <div className={clsx(
      'p-6 rounded-xl card-3d',
      gradient ? 'bg-primary-gradient text-white' : 'bg-surface-container-lowest soft-shadow',
      className
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className={clsx(
          'p-3 rounded-lg',
          gradient ? 'bg-white/20' : `bg-${badgeColor}/10`
        )}>
          <Icon className={clsx('w-5 h-5', gradient ? 'text-white' : `text-${badgeColor}`)} />
        </div>
        {badge && (
          <span className={clsx(
            'text-xs font-bold px-2 py-1 rounded-full',
            gradient ? 'bg-white/20 text-white' : {
              'bg-primary-fixed text-primary': badgeColor === 'primary',
              'bg-tertiary-fixed text-tertiary': badgeColor === 'tertiary',
              'bg-error-container text-error': badgeColor === 'error',
              'bg-green-100 text-green-700': badgeColor === 'success',
            }[`bg-${badgeColor}`] || 'bg-primary-fixed text-primary'
          )}>
            {badge}
          </span>
        )}
      </div>
      <div className={clsx(
        'font-headline text-3xl font-extrabold',
        gradient ? 'text-white' : 'text-on-surface'
      )}>
        {value}
      </div>
      <div className={clsx(
        'text-sm font-medium mt-1',
        gradient ? 'text-white/80' : 'text-on-surface-variant'
      )}>
        {label}
      </div>
    </div>
  )
}
