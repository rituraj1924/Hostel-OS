import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  ArrowLeft, Settings, Edit2, BadgeCheck, CheckCircle2,
  Phone, Mail, Droplets, AlertTriangle, MapPin, Building2,
  Lock, ShieldCheck, User as UserIcon
} from 'lucide-react'
import api from '../../services/api'
import { toast } from 'react-toastify'

export default function Profile() {
  const { user: authUser } = useAuth()
  const [user, setUser] = useState(authUser || {})
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Editable Form State
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    bloodGroup: '',
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    }
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    if (!authUser?._id) return;
    try {
      setLoading(true)
      const res = await api.get(`/users/${authUser._id}`)
      if (res.data.success) {
        setUser(res.data.user)
        const u = res.data.user
        setFormData({
          name: u.name || '',
          phoneNumber: u.phoneNumber || '',
          email: u.email || '',
          bloodGroup: u.bloodGroup || '',
          emergencyContact: {
            name: u.emergencyContact?.name || '',
            phone: u.emergencyContact?.phone || '',
            relation: u.emergencyContact?.relation || ''
          },
          address: {
            street: u.address?.street || '',
            city: u.address?.city || '',
            state: u.address?.state || '',
            pincode: u.address?.pincode || ''
          }
        })
      }
    } catch (err) {
      toast.error("Failed to load profile details")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      setUpdating(true)
      const payload = { ...formData }
      const res = await api.put(`/users/${authUser._id}`, payload)
      if (res.data.success) {
        toast.success("Profile updated successfully")
        setUser(res.data.user)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile")
      console.error(err)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg text-primary"></span></div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      {/* 1. Basic Information Section */}
      <section className="space-y-8">
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100 flex items-center justify-center">
              {user.profilePicture?.url ? (
                <img className="w-full h-full object-cover" src={user.profilePicture.url} alt="Profile" />
              ) : (
                <UserIcon className="w-16 h-16 text-gray-300" />
              )}
            </div>
            <button className="absolute bottom-1 right-1 bg-[#2d3fe2] text-white p-2 rounded-full shadow-lg border-2 border-white hover:scale-110 active:scale-90 transition-transform">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <h2 className="font-headline font-extrabold text-2xl tracking-tight text-gray-900">{user.name}</h2>
              {user.isActive && (
                <span className="bg-[#e1e1f4] text-[#626373] px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3 text-[#2d3fe2]" /> Verified
                </span>
              )}
            </div>
            <p className="text-slate-500 font-medium">
              {user.course || user.specialization || 'Student'} • Year {user.collegeYear || 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="col-span-full mb-2">
            <h3 className="font-headline font-bold text-lg text-[#2D3FE2]">General Information</h3>
          </div>

          <div className="space-y-1">
            <label className="font-label text-xs font-semibold text-slate-400 uppercase tracking-widest">Full Name</label>
            <div className="relative">
              <input 
                className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#001bcc]/30 font-medium transition-all text-gray-900" 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-label text-xs font-semibold text-slate-400 uppercase tracking-widest">Phone Number</label>
            <div className="relative">
              <input 
                className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#001bcc]/30 font-medium transition-all text-gray-900" 
                type="tel" 
                value={formData.phoneNumber}
                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-label text-xs font-semibold text-slate-400 uppercase tracking-widest">Email ID</label>
            <div className="flex gap-2">
              <input 
                className="flex-grow bg-[#f3f4f5] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#001bcc]/30 font-medium transition-all text-gray-900" 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-label text-xs font-semibold text-slate-400 uppercase tracking-widest">Blood Group</label>
            <select 
              className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#001bcc]/30 font-medium transition-all appearance-none text-gray-900"
              value={formData.bloodGroup}
              onChange={e => setFormData({...formData, bloodGroup: e.target.value})}
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A Positive (A+)</option>
              <option value="A-">A Negative (A-)</option>
              <option value="B+">B Positive (B+)</option>
              <option value="B-">B Negative (B-)</option>
              <option value="O+">O Positive (O+)</option>
              <option value="O-">O Negative (O-)</option>
              <option value="AB+">AB Positive (AB+)</option>
              <option value="AB-">AB Negative (AB-)</option>
            </select>
          </div>

          <div className="col-span-full p-4 rounded-xl border-l-4 border-red-500 bg-red-50">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <label className="font-label text-xs font-bold text-red-600 uppercase tracking-widest">Emergency Contact</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input 
                placeholder="Contact Name"
                className="w-full bg-white border border-red-100 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-red-200 font-medium text-gray-900" 
                type="text" 
                value={formData.emergencyContact.name}
                onChange={e => setFormData({...formData, emergencyContact: {...formData.emergencyContact, name: e.target.value}})}
              />
              <input 
                placeholder="Phone Number"
                className="w-full bg-white border border-red-100 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-red-200 font-medium text-gray-900" 
                type="tel" 
                value={formData.emergencyContact.phone}
                onChange={e => setFormData({...formData, emergencyContact: {...formData.emergencyContact, phone: e.target.value}})}
              />
            </div>
          </div>

          <div className="col-span-full space-y-1">
            <label className="font-label text-xs font-semibold text-slate-400 uppercase tracking-widest">Current Address</label>
            <textarea 
              className="w-full bg-[#f3f4f5] border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#001bcc]/30 font-medium transition-all h-24 text-gray-900"
              placeholder="Full physical address..."
              value={formData.address.street}
              onChange={e => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
            ></textarea>
          </div>

          <div className="col-span-full flex justify-end pt-4">
            <button 
              onClick={handleUpdate}
              disabled={updating}
              className="bg-gradient-to-tr from-[#001bcc] to-[#2d3fe2] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-75"
            >
              {updating ? 'Updating...' : 'Update Information'}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Hostel & Room Details Section (Read-Only) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-headline font-bold text-xl flex items-center gap-2 text-gray-900">
            Hostel & Room Details
            <Lock className="w-4 h-4 text-slate-400" />
          </h3>
        </div>

        <div className="relative bg-[#f3f4f5] p-1 rounded-3xl overflow-hidden shadow-inner border border-gray-200">
          <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
            <Building2 className="w-64 h-64 rotate-12 text-slate-600" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded-[calc(1.5rem-2px)] relative z-10 border border-white/50">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Hostel Name</p>
              <p className="font-bold text-gray-900">HostelOS Main</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Block/Floor</p>
              <p className="font-bold text-gray-900">{user.room?.building || 'N/A'} • Floor {user.room?.floor !== undefined ? user.room.floor : 'N/A'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Room Number</p>
              <p className="font-bold text-gray-900">{user.room?.roomNumber || 'Unassigned'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Room Type</p>
              <p className="font-bold text-gray-900 capitalize">{user.room?.roomType || 'N/A'}</p>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-center text-slate-400 italic font-medium">This information is managed by the warden and cannot be changed.</p>
      </section>

      {/* 3. Personal & Official Info (Strictly Non-Editable) */}
      <section className="space-y-6">
        <div className="bg-[#191c1d] rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-4">
            <ShieldCheck className="w-12 h-12 text-white/10" />
          </div>
          
          <h3 className="font-headline font-bold text-xl mb-6 flex items-center gap-2">
            Official Records
            <span className="bg-white/10 text-white/60 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Locked</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Father's Name</span>
              <span className="font-bold text-sm">{user.fatherName || 'Not Provided'}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Mother's Name</span>
              <span className="font-bold text-sm">{user.motherName || 'Not Provided'}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Date of Birth</span>
              <span className="font-bold text-sm">
                {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric'}) : 'Not Provided'}
              </span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Govt ID (Aadhar)</span>
              <span className="font-bold text-sm">{user.governmentId ? 'XXXX XXXX ' + user.governmentId.slice(-4) : 'Not Provided'}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-white/50 text-xs font-medium uppercase tracking-wider">College ID / Roll No</span>
              <span className="font-bold text-sm">{user.studentId || 'Not Provided'}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Admission No.</span>
              <span className="font-bold text-sm">{user.admissionNumber || 'Not Provided'}</span>
            </div>
            
            <div className="col-span-full pt-4">
              <p className="text-white/40 text-[10px] text-center leading-relaxed">
                Official student information is synced from the University records. For corrections, please contact the Registrar's Office or Warden.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
