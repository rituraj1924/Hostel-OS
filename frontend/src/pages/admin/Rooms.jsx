import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Search, BedDouble, Plus, X, Edit2, User, AlertCircle, Trash2 } from 'lucide-react'

const TYPE_CAPACITY = { single: 1, double: 2, triple: 3, quad: 4 }

const defaultForm = { roomNumber: '', building: 'Block A', floor: 0, monthlyRent: 5000, securityDeposit: 10000, roomType: 'double', status: 'available' }

export default function AdminRooms() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('grid')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showOccupantsModal, setShowOccupantsModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [editForm, setEditForm] = useState({})
  const [loadingRoom, setLoadingRoom] = useState(false)

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getAllRooms()
      setRooms(res.data?.rooms || [])
    } catch { setRooms([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRooms() }, [fetchRooms])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const capacity = TYPE_CAPACITY[form.roomType]
      await api.createRoom({ ...form, capacity })
      toast.success('Room created!')
      setShowCreateModal(false)
      setForm(defaultForm)
      fetchRooms()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create room') }
  }

  const openEdit = async (room) => {
    setSelectedRoom(room)
    setEditForm({ status: room.status, monthlyRent: room.monthlyRent, securityDeposit: room.securityDeposit })
    setShowEditModal(true)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    try {
      await api.updateRoom(selectedRoom._id, editForm)
      toast.success('Room updated!')
      setShowEditModal(false)
      fetchRooms()
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
  }

  const openOccupants = async (room) => {
    setShowOccupantsModal(true)
    setLoadingRoom(true)
    try {
      const res = await api.getRoomById(room._id)
      setSelectedRoom(res.data?.room || room)
    } catch { setSelectedRoom(room) }
    finally { setLoadingRoom(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this room?')) return
    try {
      await api.deleteRoom(id)
      toast.success('Room deleted')
      fetchRooms()
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
  }

  const getStatus = (room) => room.status || (room.currentOccupancy > 0 ? 'occupied' : 'available')

  const filtered = rooms.filter(r => filterStatus === 'all' || getStatus(r) === filterStatus)

  const stats = {
    total: rooms.length,
    occupied: rooms.filter(r => getStatus(r) === 'occupied').length,
    vacant: rooms.filter(r => getStatus(r) === 'available').length,
    maintenance: rooms.filter(r => getStatus(r) === 'maintenance').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Room Management</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage all hostel rooms and allocations</p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'admin' && (
            <button onClick={() => setShowCreateModal(true)} className="bg-primary-gradient text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> Add Room
            </button>
          )}
          <button onClick={() => setView('grid')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'grid' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>Grid</button>
          <button onClick={() => setView('list')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'list' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>List</button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Rooms', value: stats.total, color: 'primary' },
          { label: 'Occupied', value: stats.occupied, color: 'blue-600' },
          { label: 'Vacant', value: stats.vacant, color: 'green-600' },
          { label: 'Maintenance', value: stats.maintenance, color: 'error' },
        ].map(s => (
          <div key={s.label} className="bg-surface-container-lowest p-4 rounded-xl soft-shadow">
            <div className={`text-2xl font-headline font-extrabold text-${s.color}`}>{loading ? '...' : s.value}</div>
            <div className="text-xs text-on-surface-variant font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'occupied', 'available', 'maintenance'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
            filterStatus === s ? 'bg-primary text-white' : 'bg-surface-container-lowest text-on-surface-variant ghost-border hover:bg-surface-container'
          }`}>{s === 'available' ? 'Vacant' : s}</button>
        ))}
      </div>

      {/* Grid / List */}
      {loading ? <div className="p-8 text-center text-on-surface-variant">Loading rooms...</div> : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(room => {
            const status = getStatus(room)
            return (
              <div key={room._id} onClick={() => openEdit(room)}
                className={`p-4 rounded-xl card-3d cursor-pointer relative group ${
                  status === 'occupied' ? 'bg-primary/5 ghost-border' :
                  status === 'available' ? 'bg-green-50 border border-green-200' :
                  'bg-error/5 border border-error/20'
                }`}>
                <div className="flex justify-between items-start mb-3">
                  <span className="font-headline font-bold text-lg">{room.roomNumber}</span>
                  <StatusBadge status={status} />
                </div>
                <div className="text-xs text-on-surface-variant space-y-1">
                  <p>Floor {room.floor} • {room.building}</p>
                  <p className="capitalize">{room.roomType} • {room.capacity} beds</p>
                  <p className="font-medium">₹{(room.monthlyRent || 0).toLocaleString()}/mo</p>
                </div>
                {user?.role === 'admin' && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); handleDelete(room._id) }} className="p-1 rounded bg-white/80 hover:bg-error hover:text-white text-error transition-colors shadow-sm">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {status === 'occupied' && (
                  <button onClick={e => { e.stopPropagation(); openOccupants(room) }}
                    className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-bold text-primary bg-primary-fixed rounded-lg py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <User className="w-3 h-3" /> View Occupants
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl soft-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Room</th><th className="px-6 py-4">Floor</th><th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Capacity</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Rent</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((room, i) => (
                  <tr key={room._id} className={`hover:bg-surface-container-high transition-colors ${i % 2 === 1 ? 'bg-surface-container-low' : ''}`}>
                    <td className="px-6 py-4 font-bold text-sm">{room.roomNumber}</td>
                    <td className="px-6 py-4 text-sm">Floor {room.floor}</td>
                    <td className="px-6 py-4 text-sm capitalize">{room.roomType}</td>
                    <td className="px-6 py-4 text-sm">{room.capacity}</td>
                    <td className="px-6 py-4"><StatusBadge status={getStatus(room)} /></td>
                    <td className="px-6 py-4 text-sm font-medium">₹{(room.monthlyRent || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {getStatus(room) === 'occupied' && (
                          <button onClick={() => openOccupants(room)} className="text-xs text-primary hover:text-primary/80 font-medium">Occupants</button>
                        )}
                        <button onClick={() => openEdit(room)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                        {user?.role === 'admin' && (
                          <button onClick={() => handleDelete(room._id)} className="text-xs text-error hover:text-error/80 font-medium">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Room">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Room Number</label>
              <input type="text" value={form.roomNumber} onChange={e => setForm({...form, roomNumber: e.target.value})} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Building</label>
              <input type="text" value={form.building} onChange={e => setForm({...form, building: e.target.value})} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Floor</label>
              <input type="number" min="0" value={form.floor} onChange={e => setForm({...form, floor: parseInt(e.target.value)})} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Room Type</label>
              <select value={form.roomType} onChange={e => setForm({...form, roomType: e.target.value})} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary">
                <option value="single">Single (1 bed)</option>
                <option value="double">Double (2 beds)</option>
                <option value="triple">Triple (3 beds)</option>
                <option value="quad">Quad (4 beds)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Initial Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary">
                <option value="available">Vacant</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Monthly Rent (₹)</label>
              <input type="number" min="0" value={form.monthlyRent} onChange={e => setForm({...form, monthlyRent: parseInt(e.target.value)})} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Security Deposit (₹)</label>
              <input type="number" min="0" value={form.securityDeposit} onChange={e => setForm({...form, securityDeposit: parseInt(e.target.value)})} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-primary-gradient text-white font-bold text-sm rounded-xl hover:scale-[1.01] active:scale-95 transition-all">Create Room</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Edit Room ${selectedRoom?.roomNumber}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surface">Status</label>
            <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary">
              <option value="available">Vacant (Available)</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Monthly Rent (₹)</label>
              <input type="number" min="0" value={editForm.monthlyRent} onChange={e => setEditForm({...editForm, monthlyRent: parseInt(e.target.value)})} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Security Deposit (₹)</label>
              <input type="number" min="0" value={editForm.securityDeposit} onChange={e => setEditForm({...editForm, securityDeposit: parseInt(e.target.value)})} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-primary-gradient text-white font-bold text-sm rounded-xl hover:scale-[1.01] active:scale-95 transition-all">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Occupants Modal */}
      <Modal isOpen={showOccupantsModal} onClose={() => setShowOccupantsModal(false)} title={`Occupants — Room ${selectedRoom?.roomNumber}`}>
        {loadingRoom ? (
          <div className="text-center py-8 text-on-surface-variant">Loading occupant details...</div>
        ) : (
          <div className="space-y-3">
            {(selectedRoom?.beds || []).filter(b => b.isOccupied).length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant text-sm">No occupants found</div>
            ) : (
              (selectedRoom?.beds || []).map((bed, i) => bed.isOccupied && (
                <div key={i} className="flex items-center gap-4 p-4 bg-surface-container rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold">
                    {(bed.occupant?.name || '?').charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-on-surface">{bed.occupant?.name || 'Unknown'}</p>
                    <p className="text-xs text-on-surface-variant">ID: {bed.occupant?.studentId || '—'} • Bed {bed.bedNumber}</p>
                    {bed.allocationDate && <p className="text-[10px] text-on-surface-variant mt-0.5">Since {new Date(bed.allocationDate).toLocaleDateString()}</p>}
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-lg">Bed {bed.bedNumber}</span>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
