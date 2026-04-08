import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { toast } from 'react-toastify'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import { AlertTriangle, Plus, Search, MessageSquare, Clock, Edit2 } from 'lucide-react'

const initialForm = { title: '', description: '', category: 'maintenance', priority: 'medium' };

export default function StudentComplaints() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  useEffect(() => { fetchComplaints() }, [])

  const fetchComplaints = async () => {
    try {
      setLoading(true)
      const res = await api.getAllComplaints({ user: user?._id || user?.id })
      setComplaints(res.data?.complaints || [])
    } catch { setComplaints([]) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.title.length < 5) { toast.error('Title must be at least 5 characters'); return }
    if (form.description.length < 10) { toast.error('Description must be at least 10 characters'); return }
    
    try {
      if (editingId) {
        await api.updateComplaint(editingId, form)
        toast.success('Complaint updated successfully!')
      } else {
        await api.createComplaint(form)
        toast.success('Complaint submitted successfully!')
      }
      setShowModal(false)
      setForm(initialForm)
      setEditingId(null)
      fetchComplaints()
    } catch (err) {
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach(e => toast.error(e.message))
      } else {
        toast.error(err.response?.data?.message || 'Failed to submit')
      }
    }
  }

  const handleEdit = (complaint, e) => {
    e.stopPropagation()
    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - new Date(complaint.createdAt).getTime() > tenMinutes) {
      toast.error('Complaints can only be edited within 10 minutes of creation');
      return;
    }
    setForm({
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      priority: complaint.priority,
    });
    setEditingId(complaint._id);
    setShowModal(true);
  }

  const filtered = complaints.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase()) || c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
       (statusFilter === 'open' && (c.status === 'open' || c.status === 'pending')) ||
       (statusFilter === 'in_progress' && (c.status === 'in_progress' || c.status === 'in-progress')) ||
       (statusFilter === 'closed' && (c.status === 'closed' || c.status === 'resolved'))
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter
    
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const cDate = new Date(c.createdAt).setHours(0,0,0,0);
      const sDate = new Date(dateRange.start).setHours(0,0,0,0);
      const eDate = new Date(dateRange.end).setHours(23,59,59,999);
      matchesDate = cDate >= sDate && cDate <= eDate;
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesDate
  })

  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'open' || c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'in_progress' || c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">My Complaints</h1>
          <p className="text-on-surface-variant text-sm mt-1">Submit and track your maintenance requests</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary-gradient text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> New Complaint
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'primary' },
          { label: 'Open', value: stats.open, color: 'amber-600' },
          { label: 'In Progress', value: stats.inProgress, color: 'blue-600' },
          { label: 'Resolved', value: stats.resolved, color: 'green-600' },
        ].map(s => (
          <div key={s.label} className="bg-surface-container-lowest p-4 rounded-xl soft-shadow">
            <div className={`text-2xl font-headline font-extrabold text-${s.color}`}>{s.value}</div>
            <div className="text-xs text-on-surface-variant font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-surface-container-lowest p-4 rounded-xl soft-shadow">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input type="text" placeholder="Search complaints..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-surface border-none rounded-xl focus:ring-2 focus:ring-primary text-sm shadow-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="py-2.5 px-4 bg-surface border-none rounded-xl text-sm focus:ring-2 focus:ring-primary min-w-[140px] shadow-sm">
          <option value="all">All Status</option>
          <option value="open">Open / Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Resolved / Closed</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="py-2.5 px-4 bg-surface border-none rounded-xl text-sm focus:ring-2 focus:ring-primary min-w-[140px] shadow-sm">
          <option value="all">All Categories</option>
          <option value="maintenance">Maintenance</option>
          <option value="electrical">Electrical</option>
          <option value="plumbing">Plumbing</option>
          <option value="cleaning">Cleaning</option>
          <option value="security">Security</option>
          <option value="wifi">WiFi / Network</option>
          <option value="other">Other</option>
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="py-2.5 px-3 bg-surface border-none rounded-xl text-sm text-on-surface shadow-sm" />
          <span className="text-on-surface-variant text-sm font-medium">to</span>
          <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="py-2.5 px-3 bg-surface border-none rounded-xl text-sm text-on-surface shadow-sm" />
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="p-8 text-center text-on-surface-variant">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl soft-shadow p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30 text-on-surface-variant" />
          <p className="font-medium text-on-surface-variant">No complaints found</p>
          <p className="text-xs text-on-surface-variant mt-1">Submit your first complaint using the button above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c._id} className="bg-surface-container-lowest p-5 rounded-xl soft-shadow card-3d cursor-pointer hover:ring-2 ring-primary/20 transition-all" onClick={() => setSelected(c)}>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    c.priority === 'urgent' || c.priority === 'high' ? 'bg-error-container/30 text-error' : 'bg-primary-fixed text-primary'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-on-surface">{c.title}</h3>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-on-surface-variant">
                      <span className="capitalize">{c.category}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
                  {c.comments?.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-on-surface-variant"><MessageSquare className="w-3 h-3" />{c.comments.length}</span>
                  )}
                  {c.status === 'open' && (Date.now() - new Date(c.createdAt).getTime() <= 10 * 60 * 1000) && (
                    <button onClick={(e) => handleEdit(c, e)} className="p-1.5 bg-surface-container hover:bg-surface-variant rounded-lg text-primary transition-colors tooltip-trigger" title="Edit (within 10 mins)">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New/Edit Complaint Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingId(null); setForm(initialForm); }} title={editingId ? "Edit Complaint" : "Submit New Complaint"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary">
              <option value="maintenance">Maintenance</option>
              <option value="electrical">Electrical</option>
              <option value="plumbing">Plumbing</option>
              <option value="cleaning">Cleaning</option>
              <option value="security">Security</option>
              <option value="wifi">WiFi / Network</option>
              <option value="noise">Noise</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Priority</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Title</label>
            <input type="text" minLength={5} maxLength={100} required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief description of the issue" className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Description</label>
            <textarea rows={4} minLength={10} maxLength={1000} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Provide detailed description..." className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setForm(initialForm); }} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm hover:bg-surface-container transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-primary-gradient text-white font-bold text-sm rounded-xl hover:scale-[1.01] active:scale-95 transition-all">{editingId ? 'Save Changes' : 'Submit Complaint'}</button>
          </div>
        </form>
      </Modal>

      {/* Complaint Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.title || 'Complaint Details'}>
        {selected && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <StatusBadge status={selected.status} />
              <span className="text-xs text-on-surface-variant">{new Date(selected.createdAt).toLocaleString()}</span>
            </div>

            {/* Animated Progress Tracker */}
            <div className="py-4 px-2">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                   <div className="h-full bg-primary transition-all duration-1000 ease-out" 
                        style={{ width: selected.status === 'open' || selected.status === 'pending' ? '5%' : selected.status === 'in_progress' ? '50%' : '100%' }}></div>
                </div>
                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-500 border-4 border-surface ${selected.status !== 'rejected' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface-container text-on-surface-variant'}`}>
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-[11px] font-bold text-primary">Reported</span>
                </div>
                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-500 border-4 border-surface ${['in_progress', 'resolved', 'closed'].includes(selected.status) ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface-container/80 text-on-surface-variant'}`}>
                     <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className={`text-[11px] font-bold ${['in_progress', 'resolved', 'closed'].includes(selected.status) ? 'text-primary' : 'text-on-surface-variant'}`}>In Progress</span>
                </div>
                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-500 border-4 border-surface ${['resolved', 'closed'].includes(selected.status) ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : selected.status === 'rejected' ? 'bg-error text-white shadow-lg shadow-error/30' : 'bg-surface-container/80 text-on-surface-variant'}`}>
                     <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className={`text-[11px] font-bold ${['resolved', 'closed'].includes(selected.status) ? 'text-green-500' : selected.status === 'rejected' ? 'text-error' : 'text-on-surface-variant'}`}>
                    {selected.status === 'rejected' ? 'Rejected' : 'Resolved'}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-surface-container rounded-xl">
              <p className="text-sm text-on-surface">{selected.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-on-surface-variant text-xs">Category</span><p className="font-medium capitalize">{selected.category}</p></div>
              <div><span className="text-on-surface-variant text-xs">Priority</span><p className="font-medium capitalize">{selected.priority}</p></div>
              <div><span className="text-on-surface-variant text-xs">Assigned To</span><p className="font-medium">{selected.assignedTo?.name || 'Unassigned'}</p></div>
              <div><span className="text-on-surface-variant text-xs">Last Updated</span><p className="font-medium">{new Date(selected.updatedAt).toLocaleDateString()}</p></div>
            </div>
            {selected.comments?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-on-surface mb-2">Comments</h4>
                <div className="space-y-2">
                  {selected.comments.map((cm, i) => (
                    <div key={i} className="p-3 bg-surface-container rounded-lg">
                      <p className="text-xs text-on-surface">{cm.message}</p>
                      <p className="text-[10px] text-on-surface-variant mt-1">{new Date(cm.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
