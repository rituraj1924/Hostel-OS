import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { BedDouble, CreditCard, Users, AlertTriangle, TrendingUp } from 'lucide-react'

const COLORS = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Same builder used in PaymentManagement
function buildMonthlyTrend(payments) {
  const now = new Date()
  const buckets = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = MONTHS[d.getMonth()]
    buckets[key] = { month: key, gross: 0, net: 0 }
  }
  payments.forEach(p => {
    const d = new Date(p.createdAt || p.updatedAt)
    const key = MONTHS[d.getMonth()]
    if (buckets[key]) {
      const amt = p.finalAmount || p.amount || 0
      buckets[key].gross += amt
      if (p.status === 'completed') buckets[key].net += amt
    }
  })
  return Object.values(buckets)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: ₹{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null)
  const [allPayments, setAllPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        api.getDashboardStats(),
        api.getAllPayments({ limit: 500 }).catch(() => ({ data: null }))
      ])
      setStats(sRes.data?.stats || null)
      setAllPayments(pRes.data?.payments || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const revenueTrend = buildMonthlyTrend(allPayments)
  const totalGross = revenueTrend.reduce((s, d) => s + d.gross, 0)
  const totalNet   = revenueTrend.reduce((s, d) => s + d.net, 0)

  // Room distribution for pie
  const roomPieData = stats ? [
    { name: 'Occupied',    value: stats.rooms?.totalOccupants || 0 },
    { name: 'Available',   value: Math.max(0, (stats.rooms?.totalCapacity || 0) - (stats.rooms?.totalOccupants || 0) - (stats.rooms?.maintenanceRooms || 0)) },
    { name: 'Maintenance', value: stats.rooms?.maintenanceRooms || 0 },
  ].filter(d => d.value > 0) : []

  // Complaint bar data
  const complaintData = stats ? [
    { name: 'Open',        count: stats.complaints?.openComplaints || 0,       fill: '#f59e0b' },
    { name: 'In Progress', count: stats.complaints?.inProgressComplaints || 0, fill: '#6366f1' },
    { name: 'Resolved',    count: stats.complaints?.resolvedComplaints || 0,   fill: '#22c55e' },
    { name: 'Urgent',      count: stats.complaints?.urgentComplaints || 0,     fill: '#ef4444' },
  ] : []

  const kpis = [
    { label: 'Occupancy Rate', value: stats ? `${Number(stats.rooms?.occupancyRate || 0).toFixed(1)}%`  : '—', icon: BedDouble,     color: 'primary'    },
    { label: 'Total Revenue',  value: stats ? `₹${((totalGross)/1000).toFixed(1)}K`                    : '—', icon: CreditCard,    color: 'green-600'  },
    { label: 'Active Users',   value: stats?.users?.activeUsers ?? '—',                                        icon: Users,         color: 'blue-600'   },
    { label: 'Open Complaints',value: stats?.complaints?.openComplaints ?? '—',                                icon: AlertTriangle, color: 'amber-600'  },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Analytics Dashboard</h1>
        <p className="text-on-surface-variant text-sm mt-1">System-wide analytics and insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-surface-container-lowest p-5 rounded-xl soft-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-${kpi.color}/10`}><kpi.icon className={`w-5 h-5 text-${kpi.color}`} /></div>
              <TrendingUp className="w-4 h-4 text-green-600 opacity-50" />
            </div>
            <div className={`font-headline text-2xl font-extrabold text-${kpi.color}`}>{loading ? '...' : kpi.value}</div>
            <p className="text-xs text-on-surface-variant font-medium mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Revenue Trend (month-wise, same as PaymentManagement) ── */}
        <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="font-headline font-bold text-on-surface">Revenue Trend</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Monthly fee collections — last 12 months</p>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <span className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="w-3 h-3 rounded-sm bg-[#6366f1] inline-block" />
                Gross  <strong className="text-on-surface ml-1">₹{(totalGross/1000).toFixed(1)}K</strong>
              </span>
              <span className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="w-3 h-3 rounded-sm bg-[#22c55e] inline-block" />
                Net  <strong className="text-on-surface ml-1">₹{(totalNet/1000).toFixed(1)}K</strong>
              </span>
            </div>
          </div>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-on-surface-variant text-sm">Loading...</div>
          ) : revenueTrend.every(d => d.gross === 0) ? (
            <div className="h-56 flex items-center justify-center text-on-surface-variant text-sm">No payment data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="aGrossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="aNetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="gross" name="Gross" stroke="#6366f1" fill="url(#aGrossGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#6366f1' }} />
                <Area type="monotone" dataKey="net"   name="Net"   stroke="#22c55e" fill="url(#aNetGrad)"   strokeWidth={2}   dot={false} activeDot={{ r: 5, fill: '#22c55e' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Room Distribution Pie */}
        <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow">
          <h3 className="font-headline font-bold text-sm text-on-surface mb-4">Room Distribution</h3>
          {loading ? <div className="h-56 flex items-center justify-center text-on-surface-variant text-sm">Loading...</div>
            : roomPieData.length === 0 ? <div className="h-56 flex items-center justify-center text-on-surface-variant text-sm">No room data yet</div>
            : (
            <ResponsiveContainer width="100%" height={224}>
              <PieChart>
                <Pie data={roomPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {roomPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Complaint Stats Bar */}
        <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow">
          <h3 className="font-headline font-bold text-sm text-on-surface mb-4">Complaint Breakdown</h3>
          {loading ? <div className="h-56 flex items-center justify-center text-on-surface-variant text-sm">Loading...</div>
            : (
            <ResponsiveContainer width="100%" height={224}>
              <BarChart data={complaintData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {complaintData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* User Stats */}
        <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow md:col-span-2">
          <h3 className="font-headline font-bold text-sm text-on-surface mb-4">User Overview</h3>
          {loading ? <div className="h-28 flex items-center justify-center text-on-surface-variant text-sm">Loading...</div>
            : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Users',  value: stats?.users?.totalUsers  || 0, color: '#6366f1' },
                { label: 'Active Users', value: stats?.users?.activeUsers || 0, color: '#22c55e' },
                { label: 'Students',     value: stats?.users?.students    || 0, color: '#f59e0b' },
                { label: 'With Rooms',   value: stats?.users?.usersWithRooms || 0, color: '#3b82f6' },
              ].map(item => {
                const max = stats?.users?.totalUsers || 1
                return (
                  <div key={item.label} className="bg-surface-container p-4 rounded-xl">
                    <div className="text-2xl font-extrabold font-headline" style={{ color: item.color }}>{item.value}</div>
                    <p className="text-xs text-on-surface-variant mt-1 mb-3">{item.label}</p>
                    <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${max > 0 ? (item.value/max)*100 : 0}%`, background: item.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
