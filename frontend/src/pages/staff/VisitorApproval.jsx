import { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import StatusBadge from '../../components/ui/StatusBadge'
import { Eye, Check, X, Search, Clock, Phone, User } from 'lucide-react'

export default function StaffVisitorApproval() {
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => { fetchVisitors() }, [])

  const fetchVisitors = async () => {
    try {
      setLoading(true)
      const res = await api.getAllVisitors()
      setVisitors(res.data?.visitors || [])
    } catch { setVisitors([]) }
    finally { setLoading(false) }
  }

  const handleApprove = async (id) => {
    try {
      await api.approveVisitor(id)
      toast.success('Visitor approved')
      fetchVisitors()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed')
    }
  }

  const handleReject = async (id) => {
    try {
      await api.rejectVisitor(id, { reason: 'Rejected by warden' })
      toast.success('Visitor rejected')
      fetchVisitors()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed')
    }
  }

  const handleCheckout = async (id) => {
    try {
      await api.checkoutVisitor(id)
      toast.success('Visitor checked out')
      fetchVisitors()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed')
    }
  }

  const filtered = visitors.filter(v => filterStatus === 'all' || v.status === filterStatus)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Visitor Approval</h1>
        <p className="text-on-surface-variant text-sm mt-1">Approve, reject, and manage visitor requests</p>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'approved', 'checked_in', 'checked_out', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              filterStatus === s ? 'bg-primary text-white shadow-md' : 'bg-surface-container-lowest text-on-surface-variant ghost-border hover:bg-surface-container'
            }`}>{s.replace('_', ' ')}</button>
        ))}
      </div>

      {/* Visitors List */}
      {loading ? (
        <div className="p-8 text-center text-on-surface-variant">Loading visitors...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl soft-shadow p-8 text-center">
          <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-on-surface-variant">No visitors found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => (
            <div key={v._id} className="bg-surface-container-lowest p-5 rounded-xl soft-shadow card-3d">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold">
                    {(v.visitorName || v.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-on-surface">{v.visitorName || v.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-on-surface-variant flex-wrap">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{v.visitorPhone || v.phoneNumber}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />Host: {v.hostUser?.name || 'Unknown'}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(v.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">Purpose: {v.purpose}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={v.status} />
                  {v.status === 'pending' && (
                    <div className="flex gap-1">
                      <button onClick={() => handleApprove(v._id)} className="p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors" title="Approve">
                        <Check className="w-4 h-4 text-green-700" />
                      </button>
                      <button onClick={() => handleReject(v._id)} className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors" title="Reject">
                        <X className="w-4 h-4 text-red-700" />
                      </button>
                    </div>
                  )}
                  {(v.status === 'approved' || v.status === 'checked_in') && (
                    <button onClick={() => handleCheckout(v._id)} className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg text-xs font-bold text-amber-700 transition-colors">
                      Check Out
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
