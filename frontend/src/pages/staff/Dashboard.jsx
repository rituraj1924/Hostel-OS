import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import {
  Users, BedDouble, AlertTriangle, Eye, CreditCard,
  BarChart3, ArrowRight, ClipboardList, CheckCircle,
  Clock, Activity, TrendingUp
} from 'lucide-react'

export default function StaffDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRooms: 0,
    occupancyRate: 0,
    openComplaints: 0,
    pendingVisitors: 0,
    pendingPayments: 0,
    completedPayments: 0,
    pendingLeaveRequests: 0,
    maintenanceRooms: 0,
  })
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activitiesRes, leaveRes] = await Promise.allSettled([
        api.getDashboardStats(),
        api.getRecentActivities(8),
        api.getVacationRequests({ status: 'pending', limit: 100 }),
      ])

      // Fix: backend wraps the data under res.data.stats
      if (statsRes.status === 'fulfilled' && statsRes.value.data?.stats) {
        const s = statsRes.value.data.stats
        setStats({
          totalStudents: s.users?.students || s.users?.totalUsers || 0,
          totalRooms: s.rooms?.totalRooms || 0,
          occupancyRate: parseFloat(s.rooms?.occupancyRate || 0).toFixed(1),
          openComplaints: s.complaints?.openComplaints || 0,
          pendingVisitors: s.visitors?.waitingApproval || 0,
          pendingPayments: s.payments?.pendingPayments || 0,
          completedPayments: s.payments?.completedPayments || 0,
          maintenanceRooms: s.rooms?.maintenanceRooms || 0,
          pendingLeaveRequests: 0, // filled below
        })
      }

      if (activitiesRes.status === 'fulfilled' && activitiesRes.value.data?.activities) {
        setActivities(activitiesRes.value.data.activities)
      }

      if (leaveRes.status === 'fulfilled' && leaveRes.value.data) {
        const pendingLeave = leaveRes.value.data.total || leaveRes.value.data.count || 0
        setStats(prev => ({ ...prev, pendingLeaveRequests: pendingLeave }))
      }
    } catch {
      // silently fail — zeros shown
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'indigo', path: '/staff/students' },
    { label: 'Room Occupancy', value: `${stats.occupancyRate}%`, icon: BedDouble, color: 'emerald', path: '/staff/rooms' },
    { label: 'Open Complaints', value: stats.openComplaints, icon: AlertTriangle, color: 'amber', path: '/staff/complaints' },
    { label: 'Pending Visitors', value: stats.pendingVisitors, icon: Eye, color: 'sky', path: '/staff/visitors' },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: CreditCard, color: 'rose', path: '/staff/payments' },
    { label: 'Leave Requests', value: stats.pendingLeaveRequests, icon: ClipboardList, color: 'violet', path: '/staff/leave-requests' },
    { label: 'Paid This Month', value: stats.completedPayments, icon: CheckCircle, color: 'teal', path: '/staff/payments' },
    { label: 'Maintenance', value: stats.maintenanceRooms, icon: TrendingUp, color: 'orange', path: '/staff/rooms' },
  ]

  const quickActions = [
    { label: 'Rooms', icon: BedDouble, path: '/staff/rooms', desc: `${stats.maintenanceRooms} in maintenance` },
    { label: 'Complaints', icon: AlertTriangle, path: '/staff/complaints', desc: `${stats.openComplaints} open issues` },
    { label: 'Visitors', icon: Eye, path: '/staff/visitors', desc: `${stats.pendingVisitors} pending approval` },
    { label: 'Payments', icon: CreditCard, path: '/staff/payments', desc: `${stats.pendingPayments} pending` },
    { label: 'Students', icon: Users, path: '/staff/students', desc: `${stats.totalStudents} enrolled` },
    { label: 'Reports', icon: BarChart3, path: '/staff/reports', desc: 'Occupancy & financial' },
  ]

  const activityColors = {
    complaint: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertTriangle },
    visitor: { bg: 'bg-sky-100', text: 'text-sky-700', icon: Eye },
    payment: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CreditCard },
    user: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Users },
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const colorMap = {
    indigo: 'bg-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    sky: 'bg-sky-100 text-sky-700',
    rose: 'bg-rose-100 text-rose-700',
    violet: 'bg-violet-100 text-violet-700',
    teal: 'bg-teal-100 text-teal-700',
    orange: 'bg-orange-100 text-orange-700',
  }

  const Skeleton = () => (
    <div className="h-7 w-16 bg-surface-container animate-pulse rounded-lg" />
  )

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-primary-gradient text-white p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-10 -mb-10 blur-2xl" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-headline font-bold">Welcome back, {user?.name || 'Warden'} 👋</h1>
            <p className="text-white/80 text-sm mt-1">Here's your hostel overview for today</p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl text-sm">
            <Activity className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => {
          const cls = colorMap[s.color] || 'bg-gray-100 text-gray-700'
          return (
            <button
              key={s.label}
              onClick={() => navigate(s.path)}
              className="bg-surface-container-lowest p-5 rounded-xl soft-shadow hover:-translate-y-1 hover:shadow-md transition-all duration-300 text-left group"
            >
              <div className={`inline-flex p-2 rounded-lg ${cls} mb-3`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className={`font-headline text-2xl font-extrabold ${cls.split(' ')[1]} group-hover:scale-105 transition-transform`}>
                {loading ? <Skeleton /> : s.value}
              </div>
              <p className="text-xs text-on-surface-variant font-medium mt-1">{s.label}</p>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="font-headline font-bold text-lg text-on-surface mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="bg-surface-container-lowest p-5 rounded-xl soft-shadow text-left group hover:ring-2 ring-primary/20 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <action.icon className="w-5 h-5 text-primary" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{action.label}</h3>
                <p className="text-xs text-on-surface-variant mt-1">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline font-bold text-lg text-on-surface">Recent Activity</h2>
            <Clock className="w-4 h-4 text-on-surface-variant" />
          </div>
          <div className="bg-surface-container-lowest rounded-xl soft-shadow p-4 space-y-3 max-h-80 overflow-y-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-start animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-surface-container rounded w-3/4" />
                    <div className="h-2.5 bg-surface-container rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-6">No recent activity</p>
            ) : (
              activities.map((a, i) => {
                const style = activityColors[a.type] || activityColors.complaint
                const Icon = style.icon
                return (
                  <div key={i} className="flex gap-3 items-start">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${style.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${style.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-on-surface truncate">{a.title}</p>
                      <p className="text-xs text-on-surface-variant truncate">{a.description}</p>
                    </div>
                    <span className="text-[10px] text-on-surface-variant whitespace-nowrap ml-1 mt-0.5">{formatTime(a.timestamp)}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
