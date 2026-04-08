import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, BedDouble, AlertTriangle, FileText, Users, Wrench,
  ClipboardCheck, MessageSquare, Settings, LogOut, Shield, UserCog,
  CalendarCheck, FolderOpen, ArrowLeftRight, Building2, CreditCard,
  UserPlus, Bell, BarChart3, Eye, PieChart
} from 'lucide-react'

// ─── Student Navigation ───
// Per RBAC: Dashboard, Room Booking, Payments, Complaints (own), Visitors (register + own), Documents, Leave, Room Allotment, Notifications
const studentNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Room Booking', icon: BedDouble, path: '/rooms' },
  { label: 'Payments', icon: CreditCard, path: '/payments' },
  { label: 'Complaints', icon: AlertTriangle, path: '/complaints' },
  { label: 'Visitor Registration', icon: UserPlus, path: '/visitors' },
  { label: 'Leave', icon: ArrowLeftRight, path: '/leave' },
  { label: 'Room Allotment', icon: Building2, path: '/room-allotment' },
  { label: 'Documents', icon: FileText, path: '/documents' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
]

// ─── Warden / Staff Navigation ───
// Per RBAC: Dashboard, Room Allocation, Complaint Management, Visitor Approval, Payment Overview, Reports, Student Records
const wardenNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
  { label: 'Room Allocation', icon: BedDouble, path: '/staff/rooms' },
  { label: 'Complaints', icon: AlertTriangle, path: '/staff/complaints' },
  { label: 'Visitor Approval', icon: Eye, path: '/staff/visitors' },
  { label: 'Payments', icon: CreditCard, path: '/staff/payments' },
  { label: 'Student Records', icon: Users, path: '/staff/students' },
  { label: 'Leave Requests', icon: ArrowLeftRight, path: '/staff/leave-requests' },
  { label: 'Reports', icon: BarChart3, path: '/staff/reports' },
  { label: 'Documents', icon: FolderOpen, path: '/staff/documents' },
]

// ─── Admin Navigation ───
// Per RBAC: Everything warden has + User Management, Analytics, System Settings, Communication, Roles
const adminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'User Management', icon: Users, path: '/admin/users' },
  { label: 'Room Management', icon: BedDouble, path: '/admin/rooms' },
  { label: 'Complaints', icon: AlertTriangle, path: '/admin/complaints' },
  { label: 'Visitors', icon: Eye, path: '/admin/visitors' },
  { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
  { label: 'Applications', icon: ClipboardCheck, path: '/admin/applications' },
  { label: 'Maintenance', icon: Wrench, path: '/admin/maintenance' },
  { label: 'Communication', icon: MessageSquare, path: '/admin/communication' },
  { label: 'Analytics', icon: PieChart, path: '/admin/analytics' },
  { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  { label: 'Documents', icon: FolderOpen, path: '/admin/documents' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const getNavItems = () => {
    if (!user) return studentNav
    switch (user.role) {
      case 'admin': return adminNav
      case 'warden':
      case 'staff': return wardenNav
      default: return studentNav
    }
  }

  const getRoleLabel = () => {
    if (!user) return 'Student'
    switch (user.role) {
      case 'admin': return 'Administrator'
      case 'warden': return 'Warden'
      case 'staff': return 'Staff'
      default: return 'Student'
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = getNavItems()

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        h-screen w-64 fixed left-0 top-0 bg-slate-900 flex flex-col z-50
        shadow-2xl transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-400" />
            <span className="text-xl font-bold text-white font-headline tracking-tight">HostelOS</span>
          </div>
          <div className="mt-2 px-2 py-1 bg-indigo-500/10 rounded-md inline-block">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{getRoleLabel()}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 py-2.5 px-4 mb-0.5 transition-all duration-200 rounded-lg text-sm
                ${isActive
                  ? 'bg-indigo-600/20 text-indigo-100 border-l-4 border-indigo-500 translate-x-1'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent hover:translate-x-1'
                }
              `}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-2 border-t border-slate-800 py-3">
          {/* Profile link */}
          <NavLink to="/profile" onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 py-2.5 px-4 mb-0.5 transition-all duration-200 rounded-lg text-sm
              ${isActive ? 'bg-indigo-600/20 text-indigo-100' : 'text-slate-400 hover:text-white hover:bg-white/5'}
            `}
          >
            <UserCog className="w-[18px] h-[18px]" />
            <span className="font-medium">Profile</span>
          </NavLink>
          {/* Logout */}
          <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/5 py-2.5 px-4 mb-0.5 transition-all duration-200 rounded-lg w-full text-sm">
            <LogOut className="w-[18px] h-[18px]" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
