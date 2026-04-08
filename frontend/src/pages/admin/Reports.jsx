import { useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { BarChart3, FileText, Download, Calendar, Loader } from 'lucide-react'

const REPORTS = [
  { key: 'occupancy', title: 'Occupancy Report', desc: 'Room occupancy rates, allocation stats, bed utilization', icon: BarChart3, color: 'primary', apiUrl: '/reports/occupancy' },
  { key: 'financial', title: 'Financial Report', desc: 'Revenue, payments collected, outstanding dues', icon: FileText, color: 'green-600', apiUrl: '/reports/financial' },
  { key: 'complaints', title: 'Complaint Report', desc: 'Issue tracking, resolution metrics, category breakdown', icon: FileText, color: 'amber-600', apiUrl: '/reports/complaints' },
  { key: 'visitors', title: 'Visitor Log Report', desc: 'All visitor entry/exit records, status history', icon: FileText, color: 'blue-600', apiUrl: '/reports/visitors' },
  { key: 'users', title: 'User Activity Report', desc: 'Login history, user engagement, student list', icon: FileText, color: 'purple-600', apiUrl: '/reports/users' },
  { key: 'monthly', title: 'Monthly Summary', desc: 'Complete monthly operations overview', icon: BarChart3, color: 'teal-600', apiUrl: '/reports/monthly-summary' },
]

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function downloadCSV(data, filename) {
  if (!Array.isArray(data) || data.length === 0) return downloadJSON(data, filename.replace('.csv', '.json'))
  const headers = Object.keys(data[0])
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function AdminReports() {
  const [dateRanges, setDateRanges] = useState({})
  const [loading, setLoading] = useState({})
  const [format, setFormat] = useState('json')

  const setRange = (key, field, value) => {
    setDateRanges(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  const generateReport = async (report) => {
    setLoading(prev => ({ ...prev, [report.key]: true }))
    try {
      const params = {}
      if (dateRanges[report.key]?.from) params.startDate = dateRanges[report.key].from
      if (dateRanges[report.key]?.to) params.endDate = dateRanges[report.key].to
      const res = await api.get(report.apiUrl, { params })
      const data = res.data
      const filename = `${report.key}-report-${new Date().toISOString().split('T')[0]}`
      if (format === 'csv') {
        const arr = Array.isArray(data) ? data : data.report || data.data || data.rooms || data.payments || data.complaints || data.visitors || data.users || [data]
        downloadCSV(arr, `${filename}.csv`)
      } else {
        downloadJSON(data, `${filename}.json`)
      }
      toast.success(`${report.title} downloaded!`)
    } catch (err) {
      const msg = err.response?.data?.message
      if (err.response?.status === 404) toast.info('Report endpoint coming soon')
      else toast.error(msg || 'Failed to generate report')
    }
    finally { setLoading(prev => ({ ...prev, [report.key]: false })) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Reports</h1>
          <p className="text-on-surface-variant text-sm mt-1">Generate and download system reports</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-lowest rounded-xl p-1 ghost-border">
          <button onClick={() => setFormat('json')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${format === 'json' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}>JSON</button>
          <button onClick={() => setFormat('csv')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${format === 'csv' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}>CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {REPORTS.map(report => (
          <div key={report.key} className="bg-surface-container-lowest p-6 rounded-xl soft-shadow card-3d group flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-lg bg-${report.color}/10`}>
                <report.icon className={`w-5 h-5 text-${report.color}`} />
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{format.toUpperCase()}</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{report.title}</h3>
              <p className="text-xs text-on-surface-variant mt-1">{report.desc}</p>
            </div>
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">From</label>
                <input type="date" value={dateRanges[report.key]?.from || ''} onChange={e => setRange(report.key, 'from', e.target.value)}
                  className="w-full py-2 px-3 bg-surface-container border-none rounded-lg text-xs focus:ring-2 focus:ring-primary mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">To</label>
                <input type="date" value={dateRanges[report.key]?.to || ''} onChange={e => setRange(report.key, 'to', e.target.value)}
                  className="w-full py-2 px-3 bg-surface-container border-none rounded-lg text-xs focus:ring-2 focus:ring-primary mt-1" />
              </div>
            </div>
            <button onClick={() => generateReport(report)} disabled={loading[report.key]}
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white bg-${report.color === 'primary' ? 'primary-gradient' : report.color} hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50`}
              style={report.color !== 'primary' ? { background: '' } : undefined}
            >
              {loading[report.key] ? <><Loader className="w-4 h-4 animate-spin" /> Generating...</> : <><Download className="w-4 h-4" /> Download {format.toUpperCase()}</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
