import { mockDashboardStats, mockStudents, mockStaff } from '../../data/mockData'
import { Shield, Users, BedDouble, Settings, Activity, Server } from 'lucide-react'

export default function SuperAdminPanel() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Super Admin Panel</h1>
        <p className="text-on-surface-variant text-sm mt-1">System-wide management and configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: Users, label: 'Total Users', value: '1,252', color: 'primary', desc: 'Students + Staff + Admins' },
          { icon: BedDouble, label: 'Total Rooms', value: '40', color: 'tertiary', desc: 'Across 4 floors' },
          { icon: Shield, label: 'Active Sessions', value: '87', color: 'secondary', desc: 'Currently logged in' },
          { icon: Server, label: 'System Health', value: '99.9%', color: 'green-600', desc: 'Uptime last 30 days' },
          { icon: Activity, label: 'API Calls / hr', value: '4,231', color: 'primary', desc: 'Average this week' },
          { icon: Settings, label: 'Pending Config', value: '2', color: 'error', desc: 'Requires attention' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-container-lowest p-6 rounded-xl soft-shadow card-3d">
            <div className="flex items-center gap-4 mb-3">
              <div className={`p-3 rounded-lg bg-${stat.color}/10`}><stat.icon className={`w-5 h-5 text-${stat.color}`} /></div>
              <span className="text-xs text-on-surface-variant font-medium">{stat.label}</span>
            </div>
            <div className={`font-headline text-2xl font-extrabold text-${stat.color}`}>{stat.value}</div>
            <p className="text-xs text-on-surface-variant mt-1">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-2xl soft-shadow p-6">
        <h2 className="font-headline font-bold text-lg text-on-surface mb-4">System Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Database Backup', 'Email Notifications', 'Payment Gateway', 'Access Control'].map(item => (
            <div key={item} className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
              <span className="text-sm font-medium text-on-surface">{item}</span>
              <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
