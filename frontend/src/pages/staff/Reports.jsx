import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  BarChart3, FileText, Download, Loader,
  CreditCard, TrendingUp, Users, Home
} from 'lucide-react'
import { toast } from 'react-toastify'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const COLORS = ['#6366f1','#22c55e','#ef4444','#f59e0b','#3b82f6','#a855f7']

function buildMonthlyTrend(payments) {
  const now = new Date()
  const buckets = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets[MONTHS[d.getMonth()]] = { month: MONTHS[d.getMonth()], collected: 0, pending: 0 }
  }
  payments.forEach(p => {
    const d = new Date(p.createdAt || p.updatedAt)
    const key = MONTHS[d.getMonth()]
    if (buckets[key]) {
      const amt = p.finalAmount || p.amount || 0
      if (p.status === 'completed') buckets[key].collected += amt
      else if (p.status === 'pending') buckets[key].pending += amt
    }
  })
  return Object.values(buckets)
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const REPORT_CARDS = [
  { key: 'financial', title: 'Financial Report',  desc: 'Revenue, payments collected, dues',     icon: FileText,  color: 'green-600',  apiUrl: '/reports/financial'  },
  { key: 'occupancy', title: 'Occupancy Report',  desc: 'Room occupancy rates and bed stats',    icon: BarChart3, color: 'primary',    apiUrl: '/reports/occupancy'  },
  { key: 'complaints',title: 'Complaint Report',  desc: 'Issue resolution metrics',              icon: FileText,  color: 'amber-600',  apiUrl: '/reports/complaints' },
  { key: 'leave',     title: 'Leave Report',      desc: 'Student leave/vacation records',        icon: FileText,  color: 'purple-600', apiUrl: '/vacation-requests'  },
  { key: 'visitors',  title: 'Visitor Log',       desc: 'Visitor check-in/out records',          icon: FileText,  color: 'blue-600',   apiUrl: '/reports/visitors'   },
  { key: 'monthly',   title: 'Monthly Summary',   desc: 'Complete monthly operations overview',  icon: BarChart3, color: 'teal-600',   apiUrl: '/reports/monthly-summary' },
]

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

export default function StaffReports() {
  const [payments, setPayments]       = useState([])
  const [dashStats, setDashStats]     = useState(null)
  const [complaints, setComplaints]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [dlLoading, setDlLoading]     = useState({})
  const [activeTab, setActiveTab]     = useState('analytics')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [pRes, dRes, cRes] = await Promise.all([
        api.getAllPayments({ limit: 500 }).catch(() => ({ data: null })),
        api.getDashboardStats().catch(() => ({ data: null })),
        api.getAllComplaints({ limit: 500 }).catch(() => ({ data: null })),
      ])
      setPayments(pRes.data?.payments || [])
      setDashStats(dRes.data?.stats || null)
      setComplaints(cRes.data?.complaints || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const monthlyTrend   = buildMonthlyTrend(payments)
  const totalCollected = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.finalAmount || p.amount || 0), 0)
  const totalPending   = payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.finalAmount || p.amount || 0), 0)

  const payTypePie = Object.entries(
    payments.reduce((acc, p) => {
      const t = (p.paymentType || 'other').replace(/_/g, ' ')
      acc[t] = (acc[t] || 0) + (p.finalAmount || p.amount || 0)
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const complaintPie = [
    { name: 'Open',        value: complaints.filter(c => c.status === 'open').length,        fill: '#f59e0b' },
    { name: 'In Progress', value: complaints.filter(c => c.status === 'in_progress').length, fill: '#6366f1' },
    { name: 'Resolved',    value: complaints.filter(c => c.status === 'resolved').length,    fill: '#22c55e' },
  ].filter(d => d.value > 0)

  const kpis = [
    { label: 'Collected',   value: `₹${(totalCollected/1000).toFixed(1)}K`, icon: CreditCard,  color: 'green-600' },
    { label: 'Pending',     value: `₹${(totalPending/1000).toFixed(1)}K`,   icon: TrendingUp,  color: 'amber-600' },
    { label: 'Students',    value: dashStats?.users?.students || 0,          icon: Users,       color: 'primary'   },
    { label: 'Occupancy',   value: `${Number(dashStats?.rooms?.occupancyRate || 0).toFixed(1)}%`, icon: Home, color: 'blue-600' },
  ]

  const generateReport = async (report) => {
    setDlLoading(prev => ({ ...prev, [report.key]: true }))
    try {
      const res = await api.get(report.apiUrl)
      const data = res.data
      const filename = `${report.key}-${new Date().toISOString().split('T')[0]}.json`
      downloadJSON(data, filename)
      toast.success(`${report.title} downloaded!`)
    } catch (err) {
      if (err.response?.status === 404) toast.info('Report endpoint coming soon')
      else toast.error('Failed to generate report')
    } finally { setDlLoading(prev => ({ ...prev, [report.key]: false })) }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Reports &amp; Analytics</h1>
          <p className="text-on-surface-variant text-sm mt-1">Visual insights and downloadable reports</p>
        </div>
        <div className="flex items-center gap-1 bg-surface-container-lowest rounded-xl p-1 ghost-border">
          {['analytics', 'download'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === t ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container'}`}>
              {t === 'analytics' ? '📊 Analytics' : '📥 Downloads'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(kpi => (
              <div key={kpi.label} className="bg-surface-container-lowest p-5 rounded-xl soft-shadow">
                <div className={`p-2.5 rounded-lg bg-${kpi.color}/10 w-fit mb-3`}>
                  <kpi.icon className={`w-5 h-5 text-${kpi.color}`} />
                </div>
                <div className={`font-headline text-2xl font-extrabold text-${kpi.color}`}>
                  {loading ? '...' : kpi.value}
                </div>
                <p className="text-xs text-on-surface-variant mt-1">{kpi.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Collections vs Pending */}
            <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow lg:col-span-2">
              <h3 className="font-headline font-bold text-on-surface mb-1">Monthly Collections</h3>
              <p className="text-xs text-on-surface-variant mb-5">Collected vs pending — last 12 months</p>
              {loading ? (
                <div className="h-56 flex items-center justify-center text-on-surface-variant text-sm">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sCollGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="sPendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="collected" name="Collected" stroke="#22c55e" fill="url(#sCollGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="pending"   name="Pending"   stroke="#f59e0b" fill="url(#sPendGrad)" strokeWidth={2}   dot={false} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Payment Type Breakdown */}
            <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow">
              <h3 className="font-headline font-bold text-sm text-on-surface mb-4">Payment Type Breakdown</h3>
              {loading ? (
                <div className="h-56 flex items-center justify-center text-on-surface-variant text-sm">Loading...</div>
              ) : payTypePie.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-on-surface-variant text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={payTypePie} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {payTypePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => `₹${Number(v).toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Complaint Status */}
            <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow">
              <h3 className="font-headline font-bold text-sm text-on-surface mb-4">Complaint Status</h3>
              {loading ? (
                <div className="h-56 flex items-center justify-center text-on-surface-variant text-sm">Loading...</div>
              ) : complaintPie.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-on-surface-variant text-sm">No complaints</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={complaintPie}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" label="Complaints" radius={[6,6,0,0]}>
                      {complaintPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Download Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REPORT_CARDS.map(report => (
            <div key={report.key} className="bg-surface-container-lowest p-6 rounded-xl soft-shadow card-3d group flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg bg-${report.color}/10`}>
                  <report.icon className={`w-5 h-5 text-${report.color}`} />
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">JSON</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{report.title}</h3>
                <p className="text-xs text-on-surface-variant mt-1">{report.desc}</p>
              </div>
              <button onClick={() => generateReport(report)} disabled={dlLoading[report.key]}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white bg-primary-gradient hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                {dlLoading[report.key]
                  ? <><Loader className="w-4 h-4 animate-spin" /> Generating...</>
                  : <><Download className="w-4 h-4" /> Download JSON</>
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
