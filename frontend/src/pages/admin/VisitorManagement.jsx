import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Eye, Check, X, Search, Clock, Download, AlertTriangle, Users } from 'lucide-react'

function isExpired(v) {
  return v.expectedCheckOutTime && new Date(v.expectedCheckOutTime) < new Date() && v.status === 'waiting_approval'
}

export default function AdminVisitors() {
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [rejectModal, setRejectModal] = useState(null) // visitor object
  const [rejectReason, setRejectReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const fetchVisitors = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getAllVisitors()
      setVisitors(res.data?.visitors || [])
    } catch { setVisitors([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchVisitors() }, [fetchVisitors])

  const handleApprove = async (id) => {
    try { await api.approveVisitor(id); toast.success('Visitor approved & checked in'); fetchVisitors() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const openRejectModal = (visitor) => { setRejectModal(visitor); setRejectReason('') }

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error('Please provide a rejection reason')
    try {
      await api.rejectVisitor(rejectModal._id, { rejectionReason: rejectReason })
      toast.success('Visitor rejected. Student will be notified.')
      setRejectModal(null)
      fetchVisitors()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleCheckout = async (id) => {
    try { await api.checkoutVisitor(id); toast.success('Visitor checked out'); fetchVisitors() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleCancelExpired = async () => {
    setCancelling(true)
    try {
      const res = await api.put('/visitors/cancel-expired')
      toast.success(res.data?.message || 'Expired applications cancelled')
      fetchVisitors()
    } catch (err) { toast.error('Failed to cancel expired applications') }
    finally { setCancelling(false) }
  }

  const expiredCount = visitors.filter(isExpired).length

  const filtered = visitors.filter(v => {
    const matchSearch = (v.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.visitingStudent?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'all' || filterStatus === 'expired' ? true : v.status === filterStatus
    const matchExpired = filterStatus === 'expired' ? isExpired(v) : true
    return matchSearch && (filterStatus === 'all' ? true : filterStatus === 'expired' ? matchExpired : v.status === filterStatus)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Visitor Management</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage all hostel visitors and approvals</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {expiredCount > 0 && (
            <button onClick={handleCancelExpired} disabled={cancelling}
              className="flex items-center gap-2 px-4 py-2.5 bg-error/10 text-error font-bold text-sm rounded-xl hover:bg-error/20 transition-all">
              <AlertTriangle className="w-4 h-4" /> Cancel {expiredCount} Expired
            </button>
          )}
          <button className="bg-surface-container-lowest ghost-border text-on-surface-variant font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-surface-container transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input type="text" placeholder="Search visitors or students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'waiting_approval', 'checked_in', 'checked_out', 'rejected', 'expired'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === s ? 'bg-primary text-white shadow-md' : 'bg-surface-container-lowest text-on-surface-variant ghost-border'}`}>
              {s === 'waiting_approval' ? 'Pending' : s.replace('_', ' ')}
              {s === 'expired' && expiredCount > 0 && <span className="ml-1 bg-error text-white text-[9px] px-1.5 py-0.5 rounded-full">{expiredCount}</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="p-8 text-center text-on-surface-variant">Loading...</div> : (
        <div className="bg-surface-container-lowest rounded-2xl soft-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="px-5 py-3">Visitor</th><th className="px-5 py-3">Student Host</th><th className="px-5 py-3">Purpose</th>
                <th className="px-5 py-3">Visit Date</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-on-surface-variant text-sm">No visitors found</td></tr>
                ) : filtered.map((v, i) => {
                  const expired = isExpired(v)
                  return (
                    <tr key={v._id} className={`hover:bg-surface-container-high transition-colors ${i % 2 === 1 ? 'bg-surface-container-low' : ''} ${expired ? 'opacity-70' : ''}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-[10px]">{(v.name || '?').charAt(0)}</div>
                          <div>
                            <div className="text-sm font-medium">{v.name}</div>
                            <div className="text-[10px] text-on-surface-variant">{v.phoneNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-sm">{v.visitingStudent?.name || 'Unknown'}</div>
                        <div className="text-[10px] text-on-surface-variant">{v.visitingStudent?.studentId}</div>
                      </td>
                      <td className="px-5 py-3 text-sm max-w-[140px] truncate">{v.purpose}</td>
                      <td className="px-5 py-3 text-xs text-on-surface-variant">
                        <div>{new Date(v.checkInTime).toLocaleDateString()}</div>
                        {expired && <div className="text-error font-bold text-[10px]">EXPIRED</div>}
                      </td>
                      <td className="px-5 py-3">
                        {expired ? <span className="px-2 py-1 text-[10px] font-bold bg-error/10 text-error rounded-full">Expired</span> : <StatusBadge status={v.status} />}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {v.status === 'waiting_approval' && !expired && (<>
                            <button onClick={() => handleApprove(v._id)} className="p-1.5 bg-green-100 hover:bg-green-200 rounded-lg transition-colors" title="Approve"><Check className="w-3.5 h-3.5 text-green-700" /></button>
                            <button onClick={() => openRejectModal(v)} className="p-1.5 bg-red-100 hover:bg-red-200 rounded-lg transition-colors" title="Reject"><X className="w-3.5 h-3.5 text-red-700" /></button>
                          </>)}
                          {(v.status === 'checked_in') && (
                            <button onClick={() => handleCheckout(v._id)} className="px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded-lg text-[10px] font-bold text-amber-700 transition-colors">Check Out</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Visitor">
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">Provide a reason for rejecting <strong>{rejectModal?.name}</strong>'s visit. The student will receive a notification.</p>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Rejection Reason *</label>
            <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Visitor not allowed during exam period..." className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm resize-none focus:ring-2 focus:ring-error" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRejectModal(null)} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm">Cancel</button>
            <button onClick={handleReject} className="flex-1 py-3 bg-error text-white font-bold text-sm rounded-xl hover:scale-[1.01] active:scale-95 transition-all">Reject & Notify</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
