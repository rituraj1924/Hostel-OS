import { Shield, Users, Eye, Edit, Plus } from 'lucide-react'

const roles = [
  { name: 'Super Admin', permissions: ['All Access'], users: 1, color: 'bg-error-container text-error' },
  { name: 'Admin / Warden', permissions: ['Manage Students', 'Manage Rooms', 'Approve Applications', 'View Reports'], users: 3, color: 'bg-primary-fixed text-primary' },
  { name: 'Staff', permissions: ['View Assignments', 'Update Complaint Status', 'Mark Attendance'], users: 8, color: 'bg-tertiary-fixed text-tertiary' },
  { name: 'Student', permissions: ['View Dashboard', 'Raise Complaint', 'Apply Leave', 'View Documents'], users: 1240, color: 'bg-secondary-fixed text-secondary' },
]

export default function Roles() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Role & Access Management</h1>
          <p className="text-on-surface-variant text-sm mt-1">Configure roles and permissions</p>
        </div>
        <button className="bg-primary-gradient text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> Create Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map(role => (
          <div key={role.name} className="bg-surface-container-lowest p-6 rounded-xl soft-shadow card-3d">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${role.color}`}><Shield className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-bold text-on-surface">{role.name}</h3>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1"><Users className="w-3 h-3" />{role.users} users</p>
                </div>
              </div>
              <button className="p-2 hover:bg-surface-container rounded-lg transition-colors"><Edit className="w-4 h-4 text-on-surface-variant" /></button>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map(p => (
                  <span key={p} className="px-3 py-1 bg-surface-container rounded-full text-xs font-medium text-on-surface-variant">{p}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
