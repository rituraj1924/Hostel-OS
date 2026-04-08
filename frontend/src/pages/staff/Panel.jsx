import { mockStaff } from '../../data/mockData'
import StatusBadge from '../../components/ui/StatusBadge'
import { Users, UserCog, Wrench, Phone, MoreVertical, Search } from 'lucide-react'
import { useState } from 'react'

export default function StaffPanel() {
  const [staff] = useState(mockStaff)
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = staff.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.role.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Staff Panel</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage hostel staff and assignments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-xl soft-shadow">
          <div className="flex items-center gap-3 mb-2"><Users className="w-5 h-5 text-primary" /><span className="text-xs font-medium text-on-surface-variant">Total Staff</span></div>
          <div className="font-headline text-2xl font-extrabold text-on-surface">{staff.length}</div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl soft-shadow">
          <div className="flex items-center gap-3 mb-2"><UserCog className="w-5 h-5 text-green-600" /><span className="text-xs font-medium text-on-surface-variant">Active</span></div>
          <div className="font-headline text-2xl font-extrabold text-green-600">{staff.filter(s => s.status === 'active').length}</div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl soft-shadow">
          <div className="flex items-center gap-3 mb-2"><Wrench className="w-5 h-5 text-tertiary" /><span className="text-xs font-medium text-on-surface-variant">Open Tasks</span></div>
          <div className="font-headline text-2xl font-extrabold text-tertiary">{staff.reduce((a, s) => a + s.activeComplaints, 0)}</div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl soft-shadow">
          <div className="flex items-center gap-3 mb-2"><Phone className="w-5 h-5 text-secondary" /><span className="text-xs font-medium text-on-surface-variant">On Leave</span></div>
          <div className="font-headline text-2xl font-extrabold text-secondary">{staff.filter(s => s.status === 'on-leave').length}</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
        <input type="text" placeholder="Search staff..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary text-sm" />
      </div>

      {/* Staff cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div key={s._id} className="bg-surface-container-lowest p-6 rounded-xl soft-shadow card-3d">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold">{s.name.split(' ').map(n => n[0]).join('')}</div>
                <div>
                  <h3 className="font-bold text-sm">{s.name}</h3>
                  <p className="text-xs text-on-surface-variant">{s.role}</p>
                </div>
              </div>
              <StatusBadge status={s.status} />
            </div>
            <div className="space-y-2 text-sm text-on-surface-variant">
              <p><span className="font-medium text-on-surface">Dept:</span> {s.department}</p>
              <p><span className="font-medium text-on-surface">Shift:</span> {s.shift}</p>
              <p><span className="font-medium text-on-surface">Active Tasks:</span> <span className={s.activeComplaints > 2 ? 'text-error font-bold' : ''}>{s.activeComplaints}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
