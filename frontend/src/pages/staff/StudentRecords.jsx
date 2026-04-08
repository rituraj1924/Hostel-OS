import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Search, Download, Users, MoreVertical } from 'lucide-react'
import StatusBadge from '../../components/ui/StatusBadge'

export default function StaffStudentRecords() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => { fetchStudents() }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await api.getAllUsers({ role: 'student' })
      setStudents(res.data?.users || [])
    } catch { setStudents([]) }
    finally { setLoading(false) }
  }

  const filtered = students.filter(s =>
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.studentId || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Student Records</h1>
          <p className="text-on-surface-variant text-sm mt-1">View student information ({students.length} total)</p>
        </div>
        <button className="bg-surface-container-lowest ghost-border text-on-surface-variant font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-surface-container transition-all">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
        <input type="text" placeholder="Search by name, email, or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary text-sm" />
      </div>

      {loading ? (
        <div className="p-8 text-center text-on-surface-variant">Loading...</div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl soft-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Room</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((s, i) => (
                  <tr key={s._id} className={`hover:bg-surface-container-high transition-colors ${i % 2 === 1 ? 'bg-surface-container-low' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                          {s.name?.split(' ').map(n => n[0]).join('') || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{s.name}</div>
                          <div className="text-xs text-on-surface-variant">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{s.studentId || '-'}</td>
                    <td className="px-6 py-4 text-sm">{s.room?.roomNumber || s.roomNumber || '-'}</td>
                    <td className="px-6 py-4 text-sm">{s.phoneNumber || '-'}</td>
                    <td className="px-6 py-4"><StatusBadge status={s.isActive !== false ? 'active' : 'inactive'} /></td>
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
