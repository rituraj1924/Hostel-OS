import { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import { ArrowLeftRight, Check, X, Clock, Phone, FileText } from 'lucide-react'

export default function StaffLeaveRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectId, setRejectId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)

  useEffect(() => { fetchRequests() }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await api.getVacationRequests()
      setRequests(res.data?.vacationRequests || res.data?.requests || [])
    } catch { 
      setRequests([]) 
    } finally { 
      setLoading(false) 
    }
  }

  const handleApprove = async (id) => {
    try {
      if (!window.confirm("Are you sure you want to approve this leave request?")) return;
      
      await api.approveVacationRequestAsWarden(id)
      toast.success('Leave approved successfully')
      fetchRequests()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed')
    }
  }

  const openRejectModal = (id) => {
    setRejectId(id)
    setRejectReason('')
    setShowRejectModal(true)
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    if (!rejectReason.trim()) {
      return toast.error("Please provide a reason for rejection")
    }

    try {
      setRejecting(true)
      await api.rejectVacationRequest(rejectId, { reason: rejectReason })
      toast.success('Leave rejected with feedback sent to student')
      setShowRejectModal(false)
      fetchRequests()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed')
    } finally {
      setRejecting(false)
    }
  }

  const filtered = requests.filter(r => filterStatus === 'all' || r.status === filterStatus)

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Leave Requests</h1>
        <p className="text-on-surface-variant text-sm mt-1">Review and approve student leave requests</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              filterStatus === s ? 'bg-primary text-white shadow-md' : 'bg-surface-container-lowest text-on-surface-variant ghost-border hover:bg-surface-container'
            }`}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-on-surface-variant">Loading requests...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl soft-shadow p-8 text-center">
          <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 opacity-30 text-on-surface-variant" />
          <p className="font-medium text-on-surface-variant">No leave requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => (
            <div key={r._id} className="bg-surface-container-lowest p-6 rounded-xl soft-shadow card-3d">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-6 h-6 text-primary" />
                  </div>
                  <div className="w-full">
                    <h3 className="font-bold text-base text-gray-900">{r.user?.name || r.student?.name || 'Student'}</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">
                      {r.leaveType || 'General Leave'} • {r.status}
                    </p>
                    
                    <div className="mt-3 bg-[#f3f4f5] p-3 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-800 font-medium">"{r.reason}"</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-xs font-medium text-slate-600">
                      <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                        <Clock className="w-4 h-4 text-primary" />
                        {r.fromDate ? new Date(r.fromDate).toLocaleDateString() : 'N/A'} 
                        {r.leaveType === 'Multiple Days' && r.toDate ? ` → ${new Date(r.toDate).toLocaleDateString()}` : ''}
                      </span>
                      {r.parentNumber && (
                        <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                          <Phone className="w-4 h-4 text-slate-500" />
                          <a href={`tel:${r.parentNumber}`} className="text-[#2D3FE2] hover:underline">{r.parentNumber}</a>
                        </span>
                       )}
                    </div>
                    
                    {r.status === 'rejected' && r.rejectionReason && (
                      <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded-lg font-medium border border-red-100 flex gap-1.5 items-start">
                        <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                        <span><strong className="uppercase tracking-wide text-[10px]">Feedback Given:</strong><br/>{r.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3 mt-2 sm:mt-0 relative z-10">
                  <StatusBadge status={r.status} />
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                       <button 
                         onClick={() => openRejectModal(r._id)} 
                         className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors"
                       >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button 
                        onClick={() => handleApprove(r._id)} 
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-lg text-xs font-bold transition-colors shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Leave Request">
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <p className="text-sm text-on-surface-variant">Please provide feedback or a reason, which will be visible to the student.</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="E.g., Missing parent's verification, Please meet warden first..."
            rows={4}
            required
            className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm resize-none focus:ring-2 focus:ring-red-400 text-gray-900"
          />
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => setShowRejectModal(false)} 
              disabled={rejecting}
              className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm hover:bg-surface-container"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={rejecting}
              className="flex-1 py-3 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
