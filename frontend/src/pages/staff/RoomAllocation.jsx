import { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import StatusBadge from '../../components/ui/StatusBadge'
import { BedDouble, Search, Users, Wifi, Wind, Bath } from 'lucide-react'

export default function StaffRoomAllocation() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => { fetchRooms() }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const res = await api.getAllRooms()
      setRooms(res.data?.rooms || [])
    } catch { setRooms([]) }
    finally { setLoading(false) }
  }

  const handleAllocate = async (roomId, userId) => {
    try {
      await api.allocateRoom(roomId, { userId })
      toast.success('Room allocated')
      fetchRooms()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Allocation failed')
    }
  }

  const filtered = rooms.filter(r => {
    const matchSearch = (r.roomNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'occupied' && r.currentOccupancy > 0) ||
      (filterStatus === 'vacant' && r.isAvailable && r.currentOccupancy === 0) ||
      (filterStatus === 'maintenance' && !r.isAvailable && r.currentOccupancy === 0)
    return matchSearch && matchStatus
  })

  const stats = {
    total: rooms.length,
    occupied: rooms.filter(r => r.currentOccupancy > 0).length,
    vacant: rooms.filter(r => r.isAvailable && r.currentOccupancy === 0).length,
    maintenance: rooms.filter(r => !r.isAvailable && r.currentOccupancy === 0).length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Room Allocation</h1>
        <p className="text-on-surface-variant text-sm mt-1">Manage rooms and allocations</p>
      </div>

      {/* Stats */}
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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input type="text" placeholder="Search rooms..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary text-sm" />
        </div>
        <div className="flex gap-2">
          {['all', 'occupied', 'vacant', 'maintenance'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              filterStatus === s ? 'bg-primary text-white shadow-md' : 'bg-surface-container-lowest text-on-surface-variant ghost-border hover:bg-surface-container'
            }`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="p-8 text-center text-on-surface-variant">Loading rooms...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(room => {
            const status = room.currentOccupancy > 0 ? 'occupied' : (room.isAvailable ? 'vacant' : 'maintenance')
            return (
              <div key={room._id} className={`p-4 rounded-xl card-3d cursor-pointer ${
                status === 'occupied' ? 'bg-primary/5 ghost-border' :
                status === 'vacant' ? 'bg-green-50 border border-green-200' :
                'bg-error/5 border border-error/20'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <span className="font-headline font-bold text-lg">{room.roomNumber}</span>
                  <StatusBadge status={status} />
                </div>
                <div className="text-xs text-on-surface-variant space-y-1">
                  <p>Floor {room.floor} • {room.building}</p>
                  <p className="capitalize">{room.roomType || room.type} • {room.currentOccupancy}/{room.capacity}</p>
                  <p className="font-medium">₹{(room.monthlyRent || 0).toLocaleString()}/mo</p>
                </div>
                {room.facilities && (
                  <div className="flex gap-1 mt-3">
                    {room.facilities.wifi && <Wifi className="w-3.5 h-3.5 text-primary" />}
                    {room.facilities.ac && <Wind className="w-3.5 h-3.5 text-primary" />}
                    {room.facilities.attached_bathroom && <Bath className="w-3.5 h-3.5 text-primary" />}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
