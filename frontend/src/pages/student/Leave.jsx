import { useState, useEffect } from 'react'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import { ArrowLeftRight, Plus, Calendar, Clock, Phone } from 'lucide-react'
import api from '../../services/api'
import { toast } from 'react-toastify'

export default function Leave() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    leaveType: 'Full Day', // "Half Day", "Full Day", "Multiple Days"
    fromDate: '',
    toDate: '',
    reasonOption: 'Home Visit',
    customReason: '',
    parentNumber: '',
  })

  useEffect(() => {
    fetchMyRequests()
  }, [])

  const fetchMyRequests = async () => {
    try {
      setLoading(true)
      // Note: backend currently provides /vacation-requests/my-request, 
      // but this returns ONE pending request. The user might have history.
      // We will try fetching /my-request or if you have a list endpoint, use that.
      // Wait, vacationRequestRoutes.js line 138-160 says /my-request returns just pending logic
      // Actually let's just GET /api/vacation-requests/my-request as the main tracker for now.
      // I'll manually check what's available. If it only returns one, that's what we show.
      const res = await api.get('/vacation-requests/my-request')
      if (res.data?.vacationRequest) {
        setRequests([res.data.vacationRequest])
      } else {
        setRequests([])
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load leave requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { leaveType, fromDate, toDate, reasonOption, customReason, parentNumber } = formData

      // Validation
      if (!fromDate) return toast.error("Please select a date")
      if (leaveType === "Multiple Days" && !toDate) return toast.error("Please select the end date")
      if (!parentNumber) return toast.error("Parent's contact number is required")

      const finalReason = reasonOption === "Other" ? customReason : reasonOption
      if (!finalReason) return toast.error("Reason is required")

      const payload = {
        leaveType,
        fromDate,
        toDate: leaveType === "Multiple Days" ? toDate : fromDate,
        parentNumber,
        reason: finalReason
      }

      await api.post('/vacation-requests', payload)
      toast.success('Leave request submitted successfully')
      setShowModal(false)
      fetchMyRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit leave request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Leave Management</h1>
          <p className="text-on-surface-variant text-sm mt-1">Apply for leave and track your requests</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ leaveType: 'Full Day', fromDate: '', toDate: '', reasonOption: 'Home Visit', customReason: '', parentNumber: '' })
            setShowModal(true)
          }} 
          className="bg-primary-gradient text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Apply Leave
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-8 text-on-surface-variant">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="bg-surface-container-lowest p-8 rounded-xl soft-shadow text-center">
             <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight className="w-8 h-8 text-on-surface-variant opacity-50" />
             </div>
             <p className="font-medium text-on-surface">No active leave requests</p>
             <p className="text-sm text-on-surface-variant mt-1">You can apply for leave using the button above.</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req._id} className="bg-surface-container-lowest p-6 rounded-xl soft-shadow card-3d">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-6 h-6 text-primary" />
                  </div>
                  <div className="w-full">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm text-on-surface">{req.leaveType || 'Leave Request'}</h3>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">{req.reason}</p>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1 font-semibold text-primary">
                        <Calendar className="w-3.5 h-3.5" /> 
                        {new Date(req.fromDate).toLocaleDateString()} 
                        {req.leaveType === 'Multiple Days' && req.toDate ? ` → ${new Date(req.toDate).toLocaleDateString()}` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Applied: {new Date(req.requestDate || req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {req.status === 'rejected' && req.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 flex gap-2">
                        <span className="font-bold">Feedback:</span> {req.rejectionReason}
                      </div>
                    )}
                    {req.status === 'approved' && req.adminApproval?.comments && (
                      <div className="mt-4 p-3 bg-green-50 text-green-700 text-xs rounded-lg border border-green-100 flex gap-2">
                        <span className="font-bold">Note:</span> {req.adminApproval.comments}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Apply for Leave">
        <form onSubmit={handleApply} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Leave Duration Type</label>
            <select 
              value={formData.leaveType}
              onChange={e => setFormData({...formData, leaveType: e.target.value})}
              className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary text-gray-900"
            >
              <option value="Half Day">Half Day</option>
              <option value="Full Day">Full Day</option>
              <option value="Multiple Days">Multiple Days</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">From Date</label>
              <input 
                type="date" 
                value={formData.fromDate}
                onChange={e => setFormData({...formData, fromDate: e.target.value})}
                required
                className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary text-gray-900" 
              />
            </div>
            {formData.leaveType === 'Multiple Days' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">To Date</label>
                <input 
                  type="date" 
                  value={formData.toDate}
                  onChange={e => setFormData({...formData, toDate: e.target.value})}
                  required
                  className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary text-gray-900" 
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1"><Phone className="w-3 h-3" /> Parents's Contact Number</label>
            <input 
              type="tel" 
              value={formData.parentNumber}
              onChange={e => setFormData({...formData, parentNumber: e.target.value})}
              required
              placeholder="+91 "
              className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary text-gray-900" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Reason</label>
            <select 
              value={formData.reasonOption}
              onChange={e => setFormData({...formData, reasonOption: e.target.value})}
              className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary text-gray-900 mb-2"
            >
              <option>Home Visit</option>
              <option>Medical</option>
              <option>Personal</option>
              <option>Emergency</option>
              <option value="Other">Other</option>
            </select>

            {formData.reasonOption === 'Other' && (
              <textarea 
                value={formData.customReason}
                onChange={e => setFormData({...formData, customReason: e.target.value})}
                placeholder="Please specify your reason here..."
                required
                rows={3} 
                className="w-full py-3 px-4 bg-white border border-outline-variant/30 rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary text-gray-900 shadow-inner" 
              />
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" disabled={submitting} onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm hover:bg-surface-container">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-3 bg-primary-gradient text-white font-bold text-sm rounded-xl hover:shadow-lg disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
