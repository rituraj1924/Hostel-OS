import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { MessageSquare, Send, Bell, Clock, Trash2 } from 'lucide-react'

const AUDIENCES = ['All Residents', 'Wing A', 'Wing B', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4']
const PRIORITIES = ['normal', 'info', 'urgent']

const colorMap = { urgent: 'bg-error-container/30 text-error', info: 'bg-secondary-fixed text-secondary', normal: 'bg-primary-fixed text-primary' }

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs/60)}m ago`
  if (secs < 86400) return `${Math.floor(secs/3600)}h ago`
  return `${Math.floor(secs/86400)}d ago`
}

export default function Communication() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState('All Residents')
  const [priority, setPriority] = useState('normal')
  const [sending, setSending] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await api.get('/announcements')
      setAnnouncements(res.data?.announcements || [])
    } catch { setAnnouncements([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAnnouncements() }, [fetchAnnouncements])

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return toast.error('Title and message are required')
    setSending(true)
    try {
      await api.post('/announcements', { title, message, audience, priority })
      toast.success('Announcement sent successfully!')
      setTitle(''); setMessage(''); setAudience('All Residents'); setPriority('normal')
      fetchAnnouncements()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send') }
    finally { setSending(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return
    try {
      await api.delete(`/announcements/${id}`)
      toast.success('Deleted')
      fetchAnnouncements()
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Communication Center</h1>
        <p className="text-on-surface-variant text-sm mt-1">Send announcements and notifications to residents</p>
      </div>

      {/* Compose */}
      <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow">
        <h3 className="font-headline font-bold text-sm text-on-surface mb-4">New Announcement</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Target Audience</label>
              <select value={audience} onChange={e => setAudience(e.target.value)} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary">
                {AUDIENCES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary">
                {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title..." className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Message</label>
            <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your message here..." className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary" />
          </div>
          <button onClick={handleSend} disabled={sending}
            className="bg-primary-gradient text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
            <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send Announcement'}
          </button>
        </div>
      </div>

      {/* Recent Announcements */}
      <div>
        <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Recent Announcements</h3>
        {loading ? <div className="text-center text-on-surface-variant py-4">Loading...</div> : announcements.length === 0 ? (
          <div className="text-center text-on-surface-variant py-8 bg-surface-container-lowest rounded-xl">No announcements yet</div>
        ) : (
          <div className="space-y-3">
            {announcements.map(notice => (
              <div key={notice._id} className="bg-surface-container-lowest p-5 rounded-xl soft-shadow card-3d flex items-start gap-4 group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorMap[notice.priority] || colorMap.normal}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-on-surface">{notice.title}</h4>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${colorMap[notice.priority] || colorMap.normal}`}>{notice.priority}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">{notice.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-[10px] font-bold text-primary flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(notice.createdAt)}</p>
                    <span className="text-[10px] text-on-surface-variant">→ {notice.audience}</span>
                    {notice.createdBy && <span className="text-[10px] text-on-surface-variant">by {notice.createdBy.name}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(notice._id)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-error/10 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4 text-error" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
