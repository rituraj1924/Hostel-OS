import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/layout/AppLayout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Student Pages
import StudentDashboard from './pages/student/Dashboard'
import StudentProfile from './pages/student/Profile'
import StudentRooms from './pages/student/Rooms'
import StudentPayments from './pages/student/Payments'
import StudentComplaints from './pages/student/Complaints'
import StudentVisitors from './pages/student/Visitors'
import StudentLeave from './pages/student/Leave'
import StudentRoomAllotment from './pages/student/RoomAllotment'
import StudentDocuments from './pages/admin/Documents' // Shared component
import StudentNotifications from './pages/student/Notifications'

// Staff / Warden Pages
import StaffDashboard from './pages/staff/Dashboard'
import StaffComplaints from './pages/admin/Complaints'
import StaffRooms from './pages/admin/Rooms'
import StaffVisitors from './pages/admin/VisitorManagement'
import StaffPayments from './pages/admin/PaymentManagement'
import StaffStudents from './pages/admin/UserManagement'
import StaffLeaveRequests from './pages/admin/Applications'
import StaffReports from './pages/admin/Reports'
import StaffDocuments from './pages/admin/Documents'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/UserManagement'
import AdminRooms from './pages/admin/Rooms'
import AdminComplaints from './pages/admin/Complaints'
import AdminVisitors from './pages/admin/VisitorManagement'
import AdminPayments from './pages/admin/PaymentManagement'
import AdminApplications from './pages/admin/Applications'
import AdminMaintenance from './pages/admin/Maintenance'
import AdminCommunication from './pages/admin/Communication'
import AdminAnalytics from './pages/admin/Analytics'
import AdminReports from './pages/admin/Reports'
import AdminDocuments from './pages/admin/Documents'
import AdminSettings from './pages/admin/Settings'

// Role-based home redirect
function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  switch (user.role) {
    case 'admin': return <Navigate to="/admin/dashboard" replace />
    case 'warden':
    case 'staff': return <Navigate to="/staff/dashboard" replace />
    default: return <Navigate to="/dashboard" replace />
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop theme="colored" />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Home redirect */}
          <Route path="/" element={<HomeRedirect />} />

          {/* ─── Student Routes ─── */}
          <Route element={<ProtectedRoute roles={['student']} />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/rooms" element={<StudentRooms />} />
              <Route path="/payments" element={<StudentPayments />} />
              <Route path="/complaints" element={<StudentComplaints />} />
              <Route path="/visitors" element={<StudentVisitors />} />
              <Route path="/leave" element={<StudentLeave />} />
              <Route path="/room-allotment" element={<StudentRoomAllotment />} />
              <Route path="/documents" element={<StudentDocuments />} />
              <Route path="/notifications" element={<StudentNotifications />} />
            </Route>
          </Route>

          {/* ─── Staff / Warden Routes ─── */}
          <Route element={<ProtectedRoute roles={['warden', 'staff']} />}>
            <Route element={<Layout />}>
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route path="/staff/rooms" element={<StaffRooms />} />
              <Route path="/staff/complaints" element={<StaffComplaints />} />
              <Route path="/staff/visitors" element={<StaffVisitors />} />
              <Route path="/staff/payments" element={<StaffPayments />} />
              <Route path="/staff/students" element={<StaffStudents />} />
              <Route path="/staff/leave-requests" element={<StaffLeaveRequests />} />
              <Route path="/staff/reports" element={<StaffReports />} />
              <Route path="/staff/documents" element={<StaffDocuments />} />
            </Route>
          </Route>

          {/* ─── Admin Routes ─── */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route element={<Layout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/rooms" element={<AdminRooms />} />
              <Route path="/admin/complaints" element={<AdminComplaints />} />
              <Route path="/admin/visitors" element={<AdminVisitors />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/applications" element={<AdminApplications />} />
              <Route path="/admin/maintenance" element={<AdminMaintenance />} />
              <Route path="/admin/communication" element={<AdminCommunication />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/documents" element={<AdminDocuments />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* ─── Shared Route (Profile — all roles) ─── */}
          <Route element={<ProtectedRoute roles={['student', 'warden', 'staff', 'admin']} />}>
            <Route element={<Layout />}>
              <Route path="/profile" element={<StudentProfile />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
