import { useEffect, useRef, useState } from 'react'
import { mockDashboardStats, mockNotices } from '../../data/mockData'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { DoorOpen, CheckCircle, Megaphone, MessageSquarePlus, Eye, Download, Clock } from 'lucide-react'

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const stats = mockDashboardStats.student
  const [isNoticesOpen, setIsNoticesOpen] = useState(false)
  const noticesPopoverRef = useRef(null)

  const userId = user?._id || user?.id
  const [complaintsLoading, setComplaintsLoading] = useState(false)
  const [complaintsError, setComplaintsError] = useState(null)
  const [complaintsHistory, setComplaintsHistory] = useState([])
  const [showAllComplaints, setShowAllComplaints] = useState(false)

  useEffect(() => {
    if (!isNoticesOpen) return
    const onPointerDown = (e) => {
      const el = noticesPopoverRef.current
      if (!el) return
      if (el.contains(e.target)) return
      setIsNoticesOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [isNoticesOpen])

  useEffect(() => {
    if (!userId) return

    let cancelled = false
    const fetchHistory = async () => {
      try {
        setComplaintsLoading(true)
        setComplaintsError(null)
        const res = await api.getAllComplaints({ user: userId })
        const list = res.data?.complaints || []
        if (cancelled) return

        const filtered = list.filter((c) => {
          const status = c.status?.toLowerCase?.() || ''
          return status === 'in_progress' || status === 'in-progress' || status === 'resolved' || status === 'closed'
        })

        filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        setComplaintsHistory(filtered)
      } catch (err) {
        if (cancelled) return
        setComplaintsError(err?.response?.data?.message || err.message || 'Failed to load complaint history')
        setComplaintsHistory([])
      } finally {
        if (!cancelled) setComplaintsLoading(false)
      }
    }

    fetchHistory()
    return () => {
      cancelled = true
    }
  }, [userId])

  const previewComplaints = complaintsHistory.slice(0, 2)
  const canSeeMore = complaintsHistory.length > previewComplaints.length
  const complaintsToShow = showAllComplaints ? complaintsHistory : previewComplaints

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl card-3d shadow-sm flex items-center justify-between">
          <div>
            <p className="text-on-surface-variant font-medium text-sm">Room No</p>
            <h2 className="text-3xl font-extrabold font-headline text-primary mt-1">{stats.roomNumber}</h2>
          </div>
          <div className="w-12 h-12 bg-primary-fixed rounded-lg flex items-center justify-center">
            <DoorOpen className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl card-3d shadow-sm flex items-center justify-between">
          <div>
            <p className="text-on-surface-variant font-medium text-sm">Complaint Status</p>
            <div className="mt-2">
              <StatusBadge status={stats.complaintStatus} />
            </div>
          </div>
          <div className="w-12 h-12 bg-secondary-fixed rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-secondary" />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl card-3d shadow-sm flex items-center justify-between">
          <div>
            <p className="text-on-surface-variant font-medium text-sm">New Notices</p>
            <h2 className="text-3xl font-extrabold font-headline text-primary mt-1">{stats.newNotices}</h2>
          </div>
          <div className="w-12 h-12 bg-tertiary-fixed rounded-lg flex items-center justify-center">
            <Megaphone className="w-6 h-6 text-tertiary" />
          </div>
        </div>
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Complaint Progress + Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Complaint Progress Card */}
          <div className="bg-surface-container-lowest p-8 rounded-xl card-3d shadow-sm">
            <h3 className="text-xl font-bold font-headline mb-8 text-on-surface">Complaint Progress</h3>
            <div className="relative flex justify-between items-start">
              <div className="absolute top-5 left-0 w-full h-1 bg-surface-container-high rounded-full z-0" />
              <div className="absolute top-5 left-0 w-full h-1 bg-primary rounded-full z-0" />
              {[
                { icon: '⏳', label: 'Pending', time: 'Oct 12, 10:30 AM' },
                { icon: '🔧', label: 'Assigned', time: 'Oct 12, 02:15 PM' },
                { icon: '✅', label: 'Resolved', time: 'Oct 13, 11:00 AM' },
              ].map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 text-sm">
                    {step.icon}
                  </div>
                  <p className="mt-3 font-semibold text-sm text-primary">{step.label}</p>
                  <p className="text-xs text-on-surface-variant">{step.time}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 p-4 bg-surface-container rounded-lg border-l-4 border-primary">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-on-surface">Your complaint progress</p>
                {!complaintsLoading && !complaintsError && canSeeMore && (
                  <button
                    type="button"
                    onClick={() => setShowAllComplaints((v) => !v)}
                    className="text-xs font-bold text-primary hover:bg-primary/5 px-3 py-1 rounded-lg border border-primary/15 transition-colors"
                  >
                    {showAllComplaints ? 'see less' : 'see more...'}
                  </button>
                )}
              </div>

              {complaintsLoading && (
                <p className="text-xs text-on-surface-variant mt-2">Loading complaint history...</p>
              )}

              {!complaintsLoading && complaintsError && (
                <p className="text-xs text-error mt-2">{complaintsError}</p>
              )}

              {!complaintsLoading && !complaintsError && (
                <>
                  {complaintsToShow.length === 0 ? (
                    <p className="text-xs text-on-surface-variant mt-2">
                      No in-progress or solved complaints yet
                    </p>
                  ) : (
                    <div className={showAllComplaints ? 'mt-3 max-h-44 overflow-auto pr-1 space-y-2' : 'mt-3 space-y-2'}>
                      {complaintsToShow.map((c) => (
                        <div
                          key={c._id}
                          className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/15"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm text-on-surface truncate">{c.title}</p>
                              <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                                {c.description}
                              </p>
                              <p className="text-[10px] text-on-surface-variant mt-2">
                                {new Date(c.updatedAt || c.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="shrink-0">
                              <StatusBadge status={c.status} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/complaints')}
              className="bg-primary hover:bg-primary-container text-white py-4 px-6 rounded-xl shadow-lg transition-all duration-300 flex flex-col items-center gap-2 group active:scale-95"
            >
              <MessageSquarePlus className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              <span className="font-semibold text-sm">Raise Complaint</span>
            </button>
            <button
              onClick={() => navigate('/rooms')}
              className="bg-surface-container-lowest hover:bg-primary-fixed border border-outline-variant/30 text-primary py-4 px-6 rounded-xl shadow-sm transition-all duration-300 flex flex-col items-center gap-2 active:scale-95"
            >
              <Eye className="w-6 h-6" />
              <span className="font-semibold text-sm">View Room</span>
            </button>
            <button
              onClick={() => navigate('/documents')}
              className="bg-surface-container-lowest hover:bg-primary-fixed border border-outline-variant/30 text-primary py-4 px-6 rounded-xl shadow-sm transition-all duration-300 flex flex-col items-center gap-2 active:scale-95"
            >
              <Download className="w-6 h-6" />
              <span className="font-semibold text-sm">Download Docs</span>
            </button>
          </div>
        </div>

        {/* Right: Notice Board */}
        <aside>
          <div className="bg-surface-container-lowest p-6 rounded-xl card-3d shadow-sm h-full ghost-border relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold font-headline text-on-surface">Notice Board</h3>
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-6">
              {mockNotices.slice(0, 3).map(notice => (
                <div key={notice._id} className="group cursor-pointer">
                  <div className="flex gap-4">
                    <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      notice.color === 'error' ? 'bg-error-container/30 text-error' :
                      notice.color === 'secondary' ? 'bg-secondary-fixed text-secondary' :
                      'bg-primary-fixed text-primary'
                    }`}>
                      <span className="material-symbols-outlined">{notice.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{notice.title}</h4>
                      <p className="text-xs text-on-surface-variant line-clamp-2 mt-1">{notice.message}</p>
                      <p className="text-[10px] font-bold text-primary mt-2 flex items-center gap-1 uppercase">
                        <Clock className="w-3 h-3" />
                        {notice.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative">
              <button
                onClick={() => setIsNoticesOpen(v => !v)}
                className="w-full mt-8 py-3 rounded-lg border border-primary/20 text-primary text-sm font-bold hover:bg-primary/5 transition-colors"
                aria-expanded={isNoticesOpen}
              >
              View All Notices
              </button>

              {isNoticesOpen && (
                <div
                  ref={noticesPopoverRef}
                  className="absolute right-0 top-[calc(100%+0.5rem)] w-[22rem] max-w-[calc(100vw-2rem)] z-50"
                >
                  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 soft-shadow overflow-hidden">
                    <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
                      <div className="font-headline font-bold text-on-surface">All Notices</div>
                      <button
                        type="button"
                        onClick={() => setIsNoticesOpen(false)}
                        className="text-on-surface-variant hover:text-on-surface transition-colors"
                        aria-label="Close"
                      >
                        <span className="text-lg leading-none">&times;</span>
                      </button>
                    </div>
                    <div className="max-h-72 overflow-auto p-4 space-y-3">
                      {mockNotices.map((notice) => (
                        <div key={notice._id} className="group cursor-default">
                          <div className="flex gap-4">
                            <div
                              className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                                notice.color === 'error'
                                  ? 'bg-error-container/30 text-error'
                                  : notice.color === 'secondary'
                                  ? 'bg-secondary-fixed text-secondary'
                                  : 'bg-primary-fixed text-primary'
                              }`}
                            >
                              <span className="material-symbols-outlined">{notice.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-on-surface line-clamp-1">
                                {notice.title}
                              </h4>
                              <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                                {notice.message}
                              </p>
                              <p className="text-[10px] font-bold text-primary mt-2 flex items-center gap-1 uppercase">
                                <Clock className="w-3 h-3" />
                                {notice.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {mockNotices.length === 0 && (
                        <div className="text-xs text-on-surface-variant text-center py-6">
                          No notices available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
