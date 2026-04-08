import { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import { AlertTriangle, Search, MessageSquare, Clock, User, ChevronDown } from 'lucide-react'

export default function StaffComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selected, setSelected] = useState(null)
  const [comment, setComment] = useState('')

  useEffect(() => { fetchComplaints() }, [])

  const fetchComplaints = async () => {
    try {
      setLoading(true)
      const res = await api.getAllComplaints()
      setComplaints(res.data?.complaints || [])
    } catch { setComplaints([]) }
    finally { setLoading(false) }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await api.updateComplaint(id, { status })
      toast.success(`Status updated to ${status}`)
      fetchComplaints()
      if (selected?._id === id) setSelected({ ...selected, status })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!comment.trim() || !selected) return
    try {
      await api.addComment(selected._id, { message: comment })
      toast.success('Comment added')
      setComment('')
      fetchComplaints()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment')
    }
  }

  const handlePriorityChange = async (id, priority) => {
    try {
      await api.updateComplaint(id, { priority })
      toast.success(`Priority set to ${priority}`)
      fetchComplaints()
    } catch (err) {
      toast.error('Failed to update priority')
    }
  }

  const filtered = complaints.filter(c => {
    const matchSearch = (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Complaint Management</h1>
        <p className="text-on-surface-variant text-sm mt-1">Manage and resolve student complaints</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'All', value: complaints.length, status: 'all' },
          { label: 'Open', value: complaints.filter(c => c.status === 'open').length, status: 'open' },
          { label: 'In Progress', value: complaints.filter(c => c.status === 'in_progress').length, status: 'in_progress' },
          { label: 'Resolved', value: complaints.filter(c => c.status === 'resolved').length, status: 'resolved' },
          { label: 'Closed', value: complaints.filter(c => c.status === 'closed').length, status: 'closed' },
        ].map(s => (
          <button key={s.label} onClick={() => setFilterStatus(s.status)}
            className={`p-3 rounded-xl text-left transition-all ${filterStatus === s.status ? 'bg-primary text-white shadow-md' : 'bg-surface-container-lowest soft-shadow'}`}>
            <div className={`text-lg font-bold ${filterStatus === s.status ? '' : 'text-on-surface'}`}>{s.value}</div>
            <div className={`text-xs font-medium ${filterStatus === s.status ? 'text-white/80' : 'text-on-surface-variant'}`}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
        <input type="text" placeholder="Search by title or student..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary text-sm" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center text-on-surface-variant">Loading complaints...</div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl soft-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Issue</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((c, i) => (
                  <tr key={c._id} className={`hover:bg-surface-container-high transition-colors cursor-pointer ${i % 2 === 1 ? 'bg-surface-container-low' : ''}`} onClick={() => setSelected(c)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px]">
                          {(c.user?.name || '?').split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium">{c.user?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm max-w-[180px] truncate">{c.title}</td>
                    <td className="px-5 py-3 text-xs capitalize">{c.category}</td>
                    <td className="px-5 py-3">
                      <select value={c.priority} onChange={e => { e.stopPropagation(); handlePriorityChange(c._id, e.target.value) }}
                        onClick={e => e.stopPropagation()}
                        className="text-xs px-2 py-1 bg-surface-container rounded-lg border-none capitalize">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3 text-xs text-on-surface-variant">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <select value={c.status} onChange={e => handleStatusChange(c._id, e.target.value)}
                        className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg border-none font-medium">
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.title || 'Complaint'}>
        {selected && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <StatusBadge status={selected.status} />
              <span className="text-xs text-on-surface-variant capitalize font-medium">Priority: {selected.priority}</span>
            </div>
            <div className="p-4 bg-surface-container rounded-xl">
              <p className="text-sm">{selected.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-xs text-on-surface-variant">Student</span><p className="font-medium">{selected.user?.name || 'Unknown'}</p></div>
              <div><span className="text-xs text-on-surface-variant">Category</span><p className="font-medium capitalize">{selected.category}</p></div>
            </div>

            {/* Add Comment */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input type="text" value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." className="flex-1 py-2 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" />
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">Send</button>
            </form>

            {/* Status Actions */}
            <div className="flex gap-2 pt-2">
              <button onClick={() => handleStatusChange(selected._id, 'in_progress')} className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors">Mark In Progress</button>
              <button onClick={() => handleStatusChange(selected._id, 'resolved')} className="flex-1 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100 transition-colors">Mark Resolved</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
