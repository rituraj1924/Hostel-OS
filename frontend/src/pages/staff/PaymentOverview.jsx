import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import StatusBadge from '../../components/ui/StatusBadge'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { CreditCard, Search, Download, TrendingUp, Clock } from 'lucide-react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

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

export default function StaffPaymentOverview() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getAllPayments({ limit: 500 })
      setPayments(res.data?.payments || [])
    } catch { setPayments([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const filtered = payments.filter(p => {
    const matchSearch = (p.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.paymentType || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalCollected = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.finalAmount || p.amount || 0), 0)
  const totalPending   = payments.filter(p => p.status === 'pending').reduce((s, p)   => s + (p.finalAmount || p.amount || 0), 0)
  const monthlyTrend   = buildMonthlyTrend(payments)
  const totalGross     = monthlyTrend.reduce((s, d) => s + d.gross, 0)
  const totalNet       = monthlyTrend.reduce((s, d) => s + d.net, 0)

  const prevHalf = monthlyTrend.slice(0, 6).reduce((s, d) => s + d.gross, 0)
  const currHalf = monthlyTrend.slice(6).reduce((s, d) => s + d.gross, 0)
  const growthPct = prevHalf > 0 ? (((currHalf - prevHalf) / prevHalf) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Payment Overview</h1>
          <p className="text-on-surface-variant text-sm mt-1">Track all hostel payments</p>
        </div>
        <button className="bg-surface-container-lowest ghost-border text-on-surface-variant font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-surface-container transition-all">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-xl soft-shadow flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg"><CreditCard className="w-5 h-5 text-green-700" /></div>
          <div>
            <div className="font-headline text-2xl font-extrabold text-green-700">₹{totalCollected.toLocaleString()}</div>
            <p className="text-xs text-on-surface-variant">Collected</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl soft-shadow flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-lg"><Clock className="w-5 h-5 text-amber-700" /></div>
          <div>
            <div className="font-headline text-2xl font-extrabold text-amber-700">₹{totalPending.toLocaleString()}</div>
            <p className="text-xs text-on-surface-variant">Pending</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl soft-shadow flex items-center gap-4">
          <div className="p-3 bg-primary-fixed rounded-lg"><CreditCard className="w-5 h-5 text-primary" /></div>
          <div>
            <div className="font-headline text-2xl font-extrabold text-primary">{payments.length}</div>
            <p className="text-xs text-on-surface-variant">Total Transactions</p>
          </div>
        </div>
      </div>

      {/* ─── Month-wise Revenue Chart ─── */}
      <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow">
        {/* Top summary row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-8">
            <div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                <span className="w-3 h-3 rounded-sm bg-[#3b4fd8] inline-block" />
                Gross Volume
              </div>
              <div className="text-2xl font-extrabold text-on-surface font-headline mt-0.5">
                ₹{(totalGross / 1000).toFixed(1)}K
              </div>
              <div className={`text-xs font-semibold mt-0.5 flex items-center gap-1 ${Number(growthPct) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {Number(growthPct) >= 0 ? '↑' : '↓'} {Math.abs(growthPct)}% last 6 months
              </div>
            </div>
            <div className="w-px h-10 bg-outline-variant/30" />
            <div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                <span className="w-3 h-3 rounded-sm bg-gray-400 inline-block" />
                Net Collected
              </div>
              <div className="text-2xl font-extrabold text-on-surface font-headline mt-0.5">
                ₹{(totalNet / 1000).toFixed(1)}K
              </div>
              <div className="text-xs font-semibold mt-0.5 text-green-600">
                ↑ {totalGross > 0 ? ((totalNet / totalGross) * 100).toFixed(1) : 0}% collected
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <TrendingUp className="w-4 h-4 text-primary" />
            Last 12 months
          </div>
        </div>

        {loading ? (
          <div className="h-56 flex items-center justify-center text-on-surface-variant text-sm">Loading chart...</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spGrossGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b4fd8" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3b4fd8" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="spNetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#9ca3af" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#9ca3af" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="gross" name="Gross"         stroke="#3b4fd8" fill="url(#spGrossGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#3b4fd8' }} />
              <Area type="monotone" dataKey="net"   name="Net Collected" stroke="#9ca3af" fill="url(#spNetGrad)"   strokeWidth={2}   dot={false} activeDot={{ r: 5, fill: '#9ca3af' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input type="text" placeholder="Search..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary text-sm" />
        </div>
        <div className="flex gap-2">
          {['all', 'completed', 'pending', 'failed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                filterStatus === s ? 'bg-primary text-white shadow-md' : 'bg-surface-container-lowest text-on-surface-variant ghost-border'
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center text-on-surface-variant">Loading...</div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl soft-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-on-surface-variant text-sm">No payments found</td></tr>
                ) : filtered.map((p, i) => (
                  <tr key={p._id} className={`hover:bg-surface-container-high transition-colors ${i % 2 === 1 ? 'bg-surface-container-low' : ''}`}>
                    <td className="px-6 py-3 text-sm font-medium">{p.user?.name || 'Unknown'}</td>
                    <td className="px-6 py-3 text-sm capitalize">{(p.paymentType || '').replace(/_/g, ' ')}</td>
                    <td className="px-6 py-3 text-sm font-semibold">₹{(p.finalAmount || p.amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm capitalize">{p.paymentMethod || '-'}</td>
                    <td className="px-6 py-3 text-xs text-on-surface-variant">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
