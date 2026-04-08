import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { toast } from 'react-toastify'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import { UserPlus, Plus, Clock, Phone, User, Search } from 'lucide-react'

export default function StudentVisitors() {
  const { user } = useAuth()
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', phoneNumber: '', idType: 'aadhar', idNumber: '', purpose: '', relationship: 'friend', expectedCheckOutTime: '' })

  useEffect(() => { fetchVisitors() }, [])

  const fetchVisitors = async () => {
    try {
      setLoading(true)
      const res = await api.getAllVisitors({ hostUser: user?._id || user?.id })
      setVisitors(res.data?.visitors || [])
    } catch { setVisitors([]) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.registerVisitor(form)
      toast.success('Visitor registered! Awaiting approval.')
      setShowModal(false)
      setForm({ name: '', phoneNumber: '', idType: 'aadhar', idNumber: '', purpose: '', relationship: 'friend', expectedCheckOutTime: '' })
      fetchVisitors()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
  }

  const [searchTerm, setSearchTerm] = useState('')
  const filtered = visitors.filter(v =>
    v.visitorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Visitor Management</h1>
          <p className="text-on-surface-variant text-sm mt-1">Register visitors and track check-in/out</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary-gradient text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Register Visitor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl soft-shadow">
          <div className="text-2xl font-headline font-extrabold text-primary">{visitors.length}</div>
          <div className="text-xs text-on-surface-variant font-medium mt-1">Total Visitors</div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl soft-shadow">
          <div className="text-2xl font-headline font-extrabold text-amber-600">{visitors.filter(v => v.status === 'pending').length}</div>
          <div className="text-xs text-on-surface-variant font-medium mt-1">Pending Approval</div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl soft-shadow">
          <div className="text-2xl font-headline font-extrabold text-green-600">{visitors.filter(v => v.status === 'approved' || v.status === 'checked_in').length}</div>
          <div className="text-xs text-on-surface-variant font-medium mt-1">Active</div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl soft-shadow">
          <div className="text-2xl font-headline font-extrabold text-on-surface-variant">{visitors.filter(v => v.status === 'checked_out').length}</div>
          <div className="text-xs text-on-surface-variant font-medium mt-1">Checked Out</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
        <input type="text" placeholder="Search visitors..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary text-sm" />
      </div>

      {/* Visitors List */}
      {loading ? (
        <div className="p-8 text-center text-on-surface-variant">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl soft-shadow p-8 text-center">
          <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30 text-on-surface-variant" />
          <p className="font-medium text-on-surface-variant">No visitor records</p>
          <p className="text-xs text-on-surface-variant mt-1">Register your first visitor</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => (
            <div key={v._id} className="bg-surface-container-lowest p-5 rounded-xl soft-shadow card-3d">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold">
                    {(v.visitorName || v.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface">{v.visitorName || v.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{v.visitorPhone || v.phoneNumber}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(v.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">Purpose: {v.purpose}</p>
                  </div>
                </div>
                <StatusBadge status={v.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Visitor Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Register Visitor">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Visitor Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Phone</label>
              <input type="tel" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} placeholder="10-digit number" className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">ID Type</label>
              <select value={form.idType} onChange={e => setForm({ ...form, idType: e.target.value })} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary">
                <option value="aadhar">Aadhar Card</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
                <option value="voter_id">Voter ID</option>
                <option value="pan_card">PAN Card</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">ID Number</label>
              <input type="text" value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} placeholder="ID number" className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" required />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Relationship</label>
            <select value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary">
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="friend">Friend</option>
              <option value="relative">Relative</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Purpose of Visit</label>
            <input type="text" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="e.g., Family visit" className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Expected Check-out Time</label>
            <input type="datetime-local" value={form.expectedCheckOutTime} onChange={e => setForm({ ...form, expectedCheckOutTime: e.target.value })} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm hover:bg-surface-container transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-primary-gradient text-white font-bold text-sm rounded-xl hover:scale-[1.01] active:scale-95 transition-all">Register</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
