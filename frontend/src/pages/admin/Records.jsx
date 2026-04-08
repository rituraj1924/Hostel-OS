import { mockStudents } from '../../data/mockData'
import StatusBadge from '../../components/ui/StatusBadge'
import { Search, Download, Users, MoreVertical } from 'lucide-react'
import { useState } from 'react'

export default function Records() {
  const [searchTerm, setSearchTerm] = useState('')
  const filtered = mockStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Student Records</h1>
          <p className="text-on-surface-variant text-sm mt-1">View and manage student information</p>
        </div>
        <button className="bg-surface-container-lowest ghost-border text-on-surface-variant font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-surface-container transition-all">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
        <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary text-sm" />
      </div>

      <div className="bg-surface-container-lowest rounded-2xl soft-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
              <th className="px-6 py-4">Student</th><th className="px-6 py-4">ID</th><th className="px-6 py-4">Room</th>
              <th className="px-6 py-4">Branch</th><th className="px-6 py-4">Year</th><th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filtered.map((s, i) => (
                <tr key={s._id} className={`hover:bg-surface-container-high transition-colors ${i % 2 === 1 ? 'bg-surface-container-low' : ''}`}>
                  <td className="px-6 py-4"><div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">{s.name.split(' ').map(n => n[0]).join('')}</div>
                    <div><div className="text-sm font-semibold">{s.name}</div><div className="text-xs text-on-surface-variant">{s.email}</div></div>
                  </div></td>
                  <td className="px-6 py-4 text-sm font-medium">{s.studentId}</td>
                  <td className="px-6 py-4 text-sm">{s.room}</td>
                  <td className="px-6 py-4 text-sm">{s.branch}</td>
                  <td className="px-6 py-4 text-sm">{s.year}</td>
                  <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                  <td className="px-6 py-4 text-right"><button className="text-on-surface-variant hover:text-primary transition-colors"><MoreVertical className="w-5 h-5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
