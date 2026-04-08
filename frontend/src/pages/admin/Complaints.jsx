import { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Search, AlertTriangle, MoreVertical, MessageSquare } from 'lucide-react'

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
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
      if (selected?._id === id) setSelected(prev => ({ ...prev, status }))
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
  }

  const handlePriorityChange = async (id, priority) => {
    try {
      await api.updateComplaint(id, { priority })
      toast.success(`Priority set to ${priority}`)
      fetchComplaints()
    } catch { toast.error('Failed to update priority') }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!comment.trim() || !selected) return
    try {
      await api.addComment(selected._id, { message: comment })
      toast.success('Comment added')
      setComment('')
      fetchComplaints()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
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
        <h1 className="text-2xl font-headline font-bold text-on-surface">Complaints Management</h1>
        <p className="text-on-surface-variant text-sm mt-1">Track and manage all hostel complaints</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input type="text" placeholder="Search complaints..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                filterStatus === s ? 'bg-primary text-white shadow-md' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container ghost-border'
              }`}>{s.replace('_', ' ')}</button>
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
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Issue</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((c, i) => (
                  <tr key={c._id} className={`hover:bg-surface-container-high transition-colors cursor-pointer ${i % 2 === 1 ? 'bg-surface-container-low' : ''}`} onClick={() => setSelected(c)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px]">
                          {(c.user?.name || '?').split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium">{c.user?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm max-w-[180px] truncate">{c.title}</td>
                    <td className="px-5 py-4 text-xs capitalize">{c.category}</td>
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <select value={c.priority} onChange={e => handlePriorityChange(c._id, e.target.value)}
                        className="text-xs px-2 py-1 bg-surface-container rounded-lg border-none capitalize">
                        <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                      </select>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-4 text-xs text-on-surface-variant">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <select value={c.status} onChange={e => handleStatusChange(c._id, e.target.value)}
                        className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg border-none font-medium">
                        <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
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
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.title || 'Complaint Details'}>
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
              <div><span className="text-xs text-on-surface-variant">Created</span><p className="font-medium">{new Date(selected.createdAt).toLocaleDateString()}</p></div>
              <div><span className="text-xs text-on-surface-variant">Assigned To</span><p className="font-medium">{selected.assignedTo?.name || 'Unassigned'}</p></div>
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input type="text" value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." className="flex-1 py-2 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" />
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium">Send</button>
            </form>
            <div className="flex gap-2 pt-2">
              <button onClick={() => handleStatusChange(selected._id, 'in_progress')} className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors">In Progress</button>
              <button onClick={() => handleStatusChange(selected._id, 'resolved')} className="flex-1 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100 transition-colors">Resolved</button>
              <button onClick={() => handleStatusChange(selected._id, 'closed')} className="flex-1 py-2 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors">Closed</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
