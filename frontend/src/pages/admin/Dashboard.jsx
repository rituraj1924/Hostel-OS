import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Users, BedDouble, AlertTriangle, CreditCard, Eye, Clock, ArrowRight, Bell, TrendingUp, Activity } from 'lucide-react'

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs/60)}m ago`
  if (secs < 86400) return `${Math.floor(secs/3600)}h ago`
  return `${Math.floor(secs/86400)}d ago`
}

const activityColors = { complaint: 'amber-600', visitor: 'blue-600', payment: 'green-600' }

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, actRes] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentActivities(8)
      ])
      setStats(statsRes.data?.stats || statsRes.data || null)
      setActivities(actRes.data?.activities || [])
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const statCards = [
    { label: 'Total Users', value: stats?.users?.totalUsers ?? '—', icon: Users, color: 'primary', trend: stats?.users?.students ? `${stats.users.students} students` : '', path: '/admin/users' },
    { label: 'Room Occupancy', value: stats?.rooms?.occupancyRate != null ? `${Number(stats.rooms.occupancyRate).toFixed(1)}%` : '—', icon: BedDouble, color: 'green-600', trend: `${stats?.rooms?.totalOccupants ?? 0}/${stats?.rooms?.totalCapacity ?? 0} beds`, path: '/admin/rooms' },
    { label: 'Open Issues', value: stats?.complaints?.openComplaints ?? '—', icon: AlertTriangle, color: 'amber-600', trend: `${stats?.complaints?.urgentComplaints ?? 0} urgent`, path: '/admin/complaints' },
    { label: 'Revenue (Collected)', value: stats?.payments?.completedAmount != null ? `₹${(stats.payments.completedAmount/1000).toFixed(0)}K` : '—', icon: CreditCard, color: 'blue-600', trend: `₹${((stats?.payments?.pendingAmount ?? 0)/1000).toFixed(0)}K pending`, path: '/admin/payments' },
  ]

  const quickLinks = [
    { label: 'User Management', icon: Users, path: '/admin/users', desc: `${stats?.users?.totalUsers ?? 0} total users` },
    { label: 'Room Management', icon: BedDouble, path: '/admin/rooms', desc: `${stats?.rooms?.totalRooms ?? 0} rooms` },
    { label: 'Complaints', icon: AlertTriangle, path: '/admin/complaints', desc: `${stats?.complaints?.openComplaints ?? 0} open` },
    { label: 'Visitors', icon: Eye, path: '/admin/visitors', desc: `${stats?.visitors?.waitingApproval ?? 0} pending` },
    { label: 'Payments', icon: CreditCard, path: '/admin/payments', desc: 'Financial overview' },
    { label: 'Announcements', icon: Bell, path: '/admin/communication', desc: 'Send notifications' },
  ]

  return (
    <div className="space-y-8">
      <div className="bg-primary-gradient text-white p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-12 -mb-12 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-2xl font-headline font-bold">Welcome back, {user?.name || 'Admin'}!</h1>
          <p className="text-white/80 text-sm mt-1">Smart Hostel Management System — Admin Control Panel</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <button key={card.label} onClick={() => navigate(card.path)}
            className="bg-surface-container-lowest p-5 rounded-xl soft-shadow text-left hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-${card.color}/10`}><card.icon className={`w-5 h-5 text-${card.color}`} /></div>
              <span className="text-[10px] font-bold text-on-surface-variant opacity-60 group-hover:opacity-100">{card.trend}</span>
            </div>
            <div className={`font-headline text-2xl font-extrabold text-${card.color}`}>{loading ? '...' : card.value}</div>
            <p className="text-xs text-on-surface-variant font-medium mt-1">{card.label}</p>
          </button>
        ))}
      </div>

      <div>
        <h2 className="font-headline font-bold text-lg text-on-surface mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map(action => (
            <button key={action.label} onClick={() => navigate(action.path)}
              className="bg-surface-container-lowest p-5 rounded-xl soft-shadow card-3d text-left group hover:ring-2 ring-primary/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-lg bg-primary-fixed"><action.icon className="w-5 h-5 text-primary" /></div>
                <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-sm text-on-surface mt-3 group-hover:text-primary transition-colors">{action.label}</h3>
              <p className="text-xs text-on-surface-variant mt-1">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room Summary */}
        <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow">
          <h3 className="font-headline font-bold text-sm text-on-surface mb-4">Room Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Rooms', value: stats?.rooms?.totalRooms ?? '—', color: 'primary' },
              { label: 'Occupied', value: stats?.rooms?.totalOccupants ?? '—', color: 'blue-600' },
              { label: 'Available', value: stats?.rooms?.availableRooms ?? '—', color: 'green-600' },
              { label: 'Maintenance', value: stats?.rooms?.maintenanceRooms ?? '—', color: 'error' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-surface-container rounded-lg">
                <span className="text-sm text-on-surface-variant">{item.label}</span>
                <span className={`font-bold text-sm text-${item.color}`}>{loading ? '...' : item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real Recent Activity */}
        <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow">
          <h3 className="font-headline font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Recent Activity
          </h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-sm text-on-surface-variant text-center py-4">Loading...</div>
            ) : activities.length === 0 ? (
              <div className="text-sm text-on-surface-variant text-center py-4">No recent activity</div>
            ) : activities.slice(0,6).map((act, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-surface-container rounded-lg">
                <div className={`w-2 h-2 rounded-full bg-${activityColors[act.type] || 'primary'} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface truncate">{act.title || act.description}</p>
                  <p className="text-[10px] text-on-surface-variant flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{timeAgo(act.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
