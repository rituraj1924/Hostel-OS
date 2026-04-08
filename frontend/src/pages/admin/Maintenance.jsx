import { mockMaintenanceSchedule } from '../../data/mockData'
import StatusBadge from '../../components/ui/StatusBadge'
import { Wrench, CalendarCheck, Clock, AlertCircle } from 'lucide-react'

export default function Maintenance() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Cleaning & Maintenance Schedule</h1>
        <p className="text-on-surface-variant text-sm mt-1">Track scheduled maintenance and cleaning tasks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-xl soft-shadow flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg"><CalendarCheck className="w-5 h-5 text-green-700" /></div>
          <div><div className="font-headline text-2xl font-extrabold text-green-700">{mockMaintenanceSchedule.filter(m => m.status === 'completed').length}</div><p className="text-xs text-on-surface-variant">Completed</p></div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl soft-shadow flex items-center gap-4">
          <div className="p-3 bg-primary-fixed rounded-lg"><Clock className="w-5 h-5 text-primary" /></div>
          <div><div className="font-headline text-2xl font-extrabold text-primary">{mockMaintenanceSchedule.filter(m => m.status === 'scheduled').length}</div><p className="text-xs text-on-surface-variant">Scheduled</p></div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl soft-shadow flex items-center gap-4">
          <div className="p-3 bg-error-container rounded-lg"><AlertCircle className="w-5 h-5 text-error" /></div>
          <div><div className="font-headline text-2xl font-extrabold text-error">{mockMaintenanceSchedule.filter(m => m.status === 'overdue').length}</div><p className="text-xs text-on-surface-variant">Overdue</p></div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl soft-shadow overflow-hidden">
        <table className="w-full text-left">
          <thead><tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
            <th className="px-6 py-4">Task</th><th className="px-6 py-4">Assignee</th><th className="px-6 py-4">Schedule</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Next Due</th>
          </tr></thead>
          <tbody className="divide-y divide-outline-variant/10">
            {mockMaintenanceSchedule.map((m, i) => (
              <tr key={m._id} className={`hover:bg-surface-container-high transition-colors ${i % 2 === 1 ? 'bg-surface-container-low' : ''}`}>
                <td className="px-6 py-4"><div className="flex items-center gap-3"><Wrench className="w-4 h-4 text-primary shrink-0" /><span className="font-semibold text-sm">{m.task}</span></div></td>
                <td className="px-6 py-4 text-sm">{m.assignee}</td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{m.schedule}</td>
                <td className="px-6 py-4"><StatusBadge status={m.status} /></td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{m.nextDue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
