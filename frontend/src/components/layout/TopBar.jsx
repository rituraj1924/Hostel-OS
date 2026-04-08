import { Bell, Menu, AlertTriangle, Info, CheckCircle, Megaphone } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { mockNotices } from '../../data/mockData'

export default function TopBar({ onMenuClick }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState(null)
  const containerRef = useRef(null)

  const hasAnyAlerts = alerts?.length > 0
  const notifSections = useMemo(() => {
    // “Admin/Warden messages” in the bell popup currently maps to the existing mock notices.
    // Actionable alerts come from /api/dashboard/notifications.
    return {
      alerts,
      notices: mockNotices,
    }
  }, [alerts])

  useEffect(() => {
    if (!isNotifOpen) return

    const onPointerDown = (e) => {
      const el = containerRef.current
      if (!el) return
      if (el.contains(e.target)) return
      setIsNotifOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [isNotifOpen])

  useEffect(() => {
    if (!isNotifOpen) return

    let cancelled = false
    const fetchAlerts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const res = await api.getDashboardNotifications()
        if (cancelled) return
        setAlerts(res.data?.notifications || [])
      } catch (err) {
        if (cancelled) return
        setError(err?.response?.data?.message || err.message || 'Failed to load notifications')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchAlerts()
    return () => {
      cancelled = true
    }
    // Intentionally refetch on every open for fresher counts.
  }, [isNotifOpen])

  const getTypeIcon = (type) => {
    switch (type) {
      case 'warning':
        return AlertTriangle
      case 'error':
        return AlertTriangle
      case 'info':
        return Info
      default:
        return Info
    }
  }

  const getTypeClasses = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-500/15 text-amber-600 border-amber-500/25'
      case 'error':
        return 'bg-error-container/30 text-error border-error/25'
      case 'info':
        return 'bg-primary-fixed/15 text-primary border-primary/25'
      default:
        return 'bg-primary-fixed/15 text-primary border-primary/25'
    }
  }

  const handleAction = (action) => {
    if (!action) return
    setIsNotifOpen(false)
    navigate(action)
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-40 glass-panel flex justify-between items-center px-4 sm:px-8 py-4 border-b border-outline-variant/10">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-indigo-50 rounded-full transition-colors">
          <Menu className="w-5 h-5 text-on-surface-variant" />
        </button>
        <h1 className="font-headline text-xl sm:text-2xl font-bold text-primary tracking-tight">Management Console</h1>
      </div>
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="relative" ref={containerRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen(v => !v)}
            className="group cursor-pointer p-2 hover:bg-indigo-50 rounded-full transition-colors"
            aria-label="Open notifications"
          >
            <Bell className="w-5 h-5 text-on-surface-variant group-active:scale-95 transition-transform" />
            {hasAnyAlerts && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary border-2 border-white rounded-full" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-[22rem] max-w-[calc(100vw-2rem)] z-50">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 soft-shadow overflow-hidden">
                <div className="px-4 py-3 border-b border-outline-variant/20 flex items-start justify-between">
                  <div>
                    <div className="font-headline font-bold text-on-surface">Notifications</div>
                    <div className="text-xs text-on-surface-variant mt-0.5">Alerts + messages for residents</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-on-surface-variant hover:text-on-surface transition-colors"
                    aria-label="Close"
                  >
                    <span className="text-lg leading-none">&times;</span>
                  </button>
                </div>

                <div className="max-h-[24rem] overflow-auto px-2 py-2">
                  {/* Alerts */}
                  <div className="px-2 py-2">
                    <div className="text-[11px] font-bold tracking-wide text-on-surface-variant uppercase mb-2">
                      Alerts
                    </div>
                    {isLoading && (
                      <div className="text-xs text-on-surface-variant px-2 py-2">Loading...</div>
                    )}
                    {!isLoading && error && (
                      <div className="text-xs text-error px-2 py-2">{error}</div>
                    )}
                    {!isLoading && !error && (!notifSections.alerts || notifSections.alerts.length === 0) && (
                      <div className="text-xs text-on-surface-variant px-2 py-2">No alerts right now</div>
                    )}
                    {!isLoading && !error && notifSections.alerts?.map((n, idx) => {
                      const Icon = getTypeIcon(n.type)
                      const isError = n.type === 'error'
                      return (
                        <button
                          key={`${n.title}-${idx}`}
                          type="button"
                          onClick={() => handleAction(n.action)}
                          className="w-full text-left mb-2 px-2 py-2 rounded-lg hover:bg-surface-container transition-colors border border-outline-variant/15 flex items-start gap-3"
                        >
                          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${getTypeClasses(n.type)}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-on-surface truncate">{n.title}</div>
                            <div className="text-xs text-on-surface-variant mt-0.5 leading-snug">{n.message}</div>
                          </div>
                          {n.action ? (
                            <CheckCircle className={`w-4 h-4 ${isError ? 'text-error' : 'text-primary'} opacity-60 mt-0.5`} />
                          ) : null}
                        </button>
                      )
                    })}
                  </div>

                  {/* Messages */}
                  <div className="px-2 py-2">
                    <div className="text-[11px] font-bold tracking-wide text-on-surface-variant uppercase mb-2">
                      Messages
                    </div>
                    {mockNotices?.slice(0, 4).map((notice) => (
                      <button
                        key={notice._id}
                        type="button"
                        className="w-full text-left mb-2 px-2 py-2 rounded-lg hover:bg-surface-container transition-colors border border-outline-variant/15 flex items-start gap-3"
                        onClick={() => {
                          setIsNotifOpen(false)
                          navigate('/notifications')
                        }}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                            notice.color === 'error'
                              ? 'bg-error-container/30 text-error border-error/25'
                              : notice.color === 'secondary'
                              ? 'bg-secondary-fixed/20 text-secondary border-secondary-fixed/25'
                              : notice.color === 'tertiary'
                              ? 'bg-tertiary-fixed/20 text-tertiary border-tertiary-fixed/25'
                              : 'bg-primary-fixed/15 text-primary border-primary/25'
                          }`}
                        >
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-on-surface truncate">{notice.title}</div>
                          <div className="text-xs text-on-surface-variant mt-0.5 leading-snug line-clamp-2">{notice.message}</div>
                          <div className="text-[10px] font-bold text-primary mt-1 flex items-center gap-1">
                            <span className="opacity-80">{notice.time}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-outline-variant/20 flex items-center justify-between">
                  <div className="text-xs text-on-surface-variant">
                    Tip: View all notices for full list
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotifOpen(false)
                      navigate('/notifications')
                    }}
                    className="text-xs font-bold text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors border border-primary/15"
                  >
                    View all notices
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 bg-secondary-container/20 py-1.5 pl-1.5 pr-4 rounded-full border border-outline-variant/20 cursor-pointer hover:bg-secondary-container/40 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-primary text-xs font-bold">
            {getInitials(user?.name)}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-on-secondary-container leading-none">{user?.name || 'User'}</span>
            <span className="text-[10px] text-on-surface-variant leading-none mt-0.5 capitalize">{user?.role || 'student'}</span>
          </div>
        </button>
      </div>
    </header>
  )
}
