import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import { ClipboardCheck, Check, X, RefreshCw } from 'lucide-react'

export default function Applications() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getVacationRequests()
      setApplications(res.data?.requests || res.data?.vacationRequests || res.data?.data || [])
    } catch { setApplications([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  const handleApprove = async (id) => {
    try {
      if (user?.role === 'admin') {
        await api.approveVacationRequestAsAdmin(id, { approved: true })
      } else {
        await api.approveVacationRequestAsWarden(id, { approved: true })
      }
      toast.success('Application approved')
      fetchApplications()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error('Provide a reason')
    try {
      await api.rejectVacationRequest(rejectModal._id, { reason: rejectReason })
      toast.success('Application rejected. Student notified.')
      setRejectModal(null)
      fetchApplications()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const filtered = applications.filter(a => filterStatus === 'all' || a.status === filterStatus)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Application Review Hub</h1>
          <p className="text-on-surface-variant text-sm mt-1">Review and manage student leave/vacation applications</p>
        </div>
        <button onClick={fetchApplications} className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest ghost-border rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'warden_approved', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filterStatus === s ? 'bg-primary text-white' : 'bg-surface-container-lowest text-on-surface-variant ghost-border'}`}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? <div className="p-8 text-center text-on-surface-variant">Loading applications...</div> : filtered.length === 0 ? (
        <div className="p-8 text-center text-on-surface-variant">No applications found</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(app => (
            <div key={app._id} className="bg-surface-container-lowest p-6 rounded-xl soft-shadow card-3d">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface capitalize">{app.leaveType || app.type || 'Leave Request'}</h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                      <strong>{app.student?.name || app.user?.name || 'Unknown'}</strong>
                      {(app.student?.studentId || app.user?.studentId) && ` (${app.student?.studentId || app.user?.studentId})`}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{app.reason}</p>
                    {app.startDate && (
                      <p className="text-xs text-primary font-medium mt-1">
                        {new Date(app.startDate).toLocaleDateString()} → {new Date(app.endDate || app.startDate).toLocaleDateString()}
                      </p>
                    )}
                    {app.parentContact && (
                      <p className="text-xs text-on-surface-variant mt-0.5">Parent: {app.parentContact.name} {app.parentContact.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={app.status} />
                  {(app.status === 'pending' || app.status === 'warden_approved') && (
                    <div className="flex gap-1">
                      <button onClick={() => handleApprove(app._id)} className="p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors" title="Approve">
                        <Check className="w-4 h-4 text-green-700" />
                      </button>
                      <button onClick={() => { setRejectModal(app); setRejectReason('') }} className="p-2 bg-error-container hover:bg-red-200 rounded-lg transition-colors" title="Reject">
                        <X className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {app.rejectionReason && (
                <div className="mt-3 p-3 bg-error/5 rounded-lg text-xs text-error">
                  Rejection reason: {app.rejectionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Application">
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">Provide a reason for rejecting this application. The student will receive a notification.</p>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Reason *</label>
            <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Insufficient notice period, mid-semester exams..." className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm resize-none focus:ring-2 focus:ring-error" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRejectModal(null)} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm">Cancel</button>
            <button onClick={handleReject} className="flex-1 py-3 bg-error text-white font-bold text-sm rounded-xl">Reject & Notify</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
