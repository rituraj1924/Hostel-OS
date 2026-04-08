import { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Users, Search, Plus, Edit, Trash2, Shield, MoreVertical } from 'lucide-react'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'student', phoneNumber: '', password: '' })

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await api.getAllUsers()
      setUsers(res.data?.users || [])
    } catch { setUsers([]) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await api.deleteUser(id)
      toast.success('User deleted')
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editUser) {
        const { password, ...updateData } = form
        await api.updateUser(editUser._id, updateData)
        toast.success('User updated')
      } else {
        await api.post('/auth/register', form)
        toast.success('User created')
      }
      setShowModal(false)
      setEditUser(null)
      setForm({ name: '', email: '', role: 'student', phoneNumber: '', password: '' })
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    }
  }

  const openEdit = (user) => {
    setEditUser(user)
    setForm({ name: user.name, email: user.email, role: user.role, phoneNumber: user.phoneNumber || '', password: '' })
    setShowModal(true)
  }

  const filtered = users.filter(u => {
    const matchSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  const roleCounts = {
    all: users.length,
    student: users.filter(u => u.role === 'student').length,
    warden: users.filter(u => u.role === 'warden').length,
    admin: users.filter(u => u.role === 'admin').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">User Management</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage all system users</p>
        </div>
        <button onClick={() => { setEditUser(null); setForm({ name: '', email: '', role: 'student', phoneNumber: '', password: '' }); setShowModal(true) }}
          className="bg-primary-gradient text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Role Filters */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(roleCounts).map(([role, count]) => (
          <button key={role} onClick={() => setFilterRole(role)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              filterRole === role ? 'bg-primary text-white shadow-md' : 'bg-surface-container-lowest text-on-surface-variant ghost-border'
            }`}>{role} ({count})</button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
        <input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary text-sm" />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="p-8 text-center text-on-surface-variant">Loading...</div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl soft-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((u, i) => (
                  <tr key={u._id} className={`hover:bg-surface-container-high transition-colors ${i % 2 === 1 ? 'bg-surface-container-low' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                          {u.name?.split(' ').map(n => n[0]).join('') || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{u.name}</div>
                          <div className="text-xs text-on-surface-variant">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-error-container text-error' :
                        u.role === 'warden' ? 'bg-primary-fixed text-primary' :
                        'bg-secondary-fixed text-secondary'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">{u.phoneNumber || '-'}</td>
                    <td className="px-6 py-4"><StatusBadge status={u.isActive !== false ? 'active' : 'inactive'} /></td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="p-2 hover:bg-primary-fixed rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4 text-primary" />
                        </button>
                        <button onClick={() => handleDelete(u._id)} className="p-2 hover:bg-error-container rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4 text-error" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditUser(null) }} title={editUser ? 'Edit User' : 'Create User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Full Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary">
                <option value="student">Student</option>
                <option value="warden">Warden</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Phone</label>
              <input type="tel" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          {!editUser && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" required />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); setEditUser(null) }} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-primary-gradient text-white font-bold text-sm rounded-xl hover:scale-[1.01] active:scale-95 transition-all">{editUser ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
