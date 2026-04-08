import { mockNotices } from '../../data/mockData'
import { Bell, Clock, Megaphone } from 'lucide-react'

export default function StudentNotifications() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Notifications</h1>
        <p className="text-on-surface-variant text-sm mt-1">Stay updated with hostel announcements</p>
      </div>

      <div className="space-y-3">
        {mockNotices.map(notice => (
          <div key={notice._id} className="bg-surface-container-lowest p-5 rounded-xl soft-shadow card-3d flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              notice.color === 'error' ? 'bg-error-container/30 text-error' :
              notice.color === 'secondary' ? 'bg-secondary-fixed text-secondary' :
              notice.color === 'tertiary' ? 'bg-tertiary-fixed text-tertiary' :
              'bg-primary-fixed text-primary'
            }`}>
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-on-surface">{notice.title}</h4>
              <p className="text-xs text-on-surface-variant mt-1">{notice.message}</p>
              <p className="text-[10px] font-bold text-primary mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />{notice.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {mockNotices.length === 0 && (
        <div className="bg-surface-container-lowest rounded-2xl soft-shadow p-8 text-center">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30 text-on-surface-variant" />
          <p className="font-medium text-on-surface-variant">No notifications</p>
          <p className="text-xs text-on-surface-variant mt-1">You're all caught up!</p>
        </div>
      )}
    </div>
  )
}
