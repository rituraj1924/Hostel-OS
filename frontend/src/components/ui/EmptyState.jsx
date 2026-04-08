import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title = 'No data found', description = 'There are no items to display right now.', action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-outline" />
      </div>
      <h3 className="font-headline font-bold text-lg text-on-surface mb-1">{title}</h3>
      <p className="text-on-surface-variant text-sm max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action}
          className="mt-6 bg-primary-gradient text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          {actionLabel || 'Get Started'}
        </button>
      )}
    </div>
  )
}
