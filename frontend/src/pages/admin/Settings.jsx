import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { Bell, Shield, Database, Globe, Save, RefreshCw } from 'lucide-react'

function Toggle({ value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-all duration-200 relative ${value ? 'bg-primary' : 'bg-gray-300'}`}>
      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 absolute top-0.5 ${value ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true, autoApproveVisitors: false, maintenanceMode: false,
    maxVisitorDuration: 4, lateFeePerDay: 50, maxRoomCapacity: 4,
    hostelName: '', contactEmail: '', contactPhone: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/settings')
      setSettings(s => ({ ...s, ...res.data?.settings }))
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.put('/settings', settings)
      toast.success(res.data?.message || 'Settings saved successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings')
    } finally { setSaving(false) }
  }

  const set = (key, value) => setSettings(s => ({ ...s, [key]: value }))

  if (loading) return <div className="text-center text-on-surface-variant py-16">Loading settings...</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">System Settings</h1>
          <p className="text-on-surface-variant text-sm mt-1">Configure system-wide settings — changes are saved to the database</p>
        </div>
        <button onClick={fetchSettings} className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest ghost-border rounded-xl text-sm text-on-surface-variant hover:bg-surface-container transition-all">
          <RefreshCw className="w-4 h-4" /> Reload
        </button>
      </div>

      {/* Hostel Info */}
      <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow">
        <h3 className="font-headline font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" /> Hostel Information
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface">Hostel Name</label>
            <input type="text" value={settings.hostelName} onChange={e => set('hostelName', e.target.value)} placeholder="Smart Hostel" className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface">Contact Email</label>
              <input type="email" value={settings.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="admin@hostel.com" className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface">Contact Phone</label>
              <input type="text" value={settings.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="+91 XXXXXXXXXX" className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow">
        <h3 className="font-headline font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" /> Notifications
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface">Email Notifications</p>
            <p className="text-xs text-on-surface-variant">Send email alerts for new complaints and visitors</p>
          </div>
          <Toggle value={settings.emailNotifications} onChange={v => set('emailNotifications', v)} />
        </div>
      </div>

      {/* Visitor Policy */}
      <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow">
        <h3 className="font-headline font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" /> Visitor Policy
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface">Auto-Approve Visitors</p>
              <p className="text-xs text-on-surface-variant">Automatically approve visitor requests without manual review</p>
            </div>
            <Toggle value={settings.autoApproveVisitors} onChange={v => set('autoApproveVisitors', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface">Max Visitor Duration (hours)</p>
              <p className="text-xs text-on-surface-variant">Maximum hours a visitor can stay</p>
            </div>
            <input type="number" min="1" max="72" value={settings.maxVisitorDuration}
              onChange={e => set('maxVisitorDuration', parseInt(e.target.value) || 4)}
              className="w-20 py-2 px-3 bg-surface-container border-none rounded-xl text-sm text-right focus:ring-2 focus:ring-primary" />
          </div>
        </div>
      </div>

      {/* Payment Policy */}
      <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow">
        <h3 className="font-headline font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> Payment Policy
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface">Late Fee Per Day (₹)</p>
            <p className="text-xs text-on-surface-variant">Penalty amount for overdue payments</p>
          </div>
          <input type="number" min="0" value={settings.lateFeePerDay}
            onChange={e => set('lateFeePerDay', parseInt(e.target.value) || 0)}
            className="w-24 py-2 px-3 bg-surface-container border-none rounded-xl text-sm text-right focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      {/* System */}
      <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow">
        <h3 className="font-headline font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" /> System
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface">Maintenance Mode</p>
            <p className="text-xs text-on-surface-variant">⚠️ Disables student access to the portal temporarily</p>
          </div>
          <Toggle value={settings.maintenanceMode} onChange={v => set('maintenanceMode', v)} />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="bg-primary-gradient text-white font-bold text-sm px-8 py-3.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50">
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Settings'}
      </button>
    </div>
  )
}
