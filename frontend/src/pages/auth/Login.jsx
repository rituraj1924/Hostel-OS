import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Building2, BadgeCheck, Lock, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [activeRole, setActiveRole] = useState('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(email, password)
    if (result.success) {
      const roleRoutes = { admin: '/admin/dashboard', warden: '/staff/panel', student: '/dashboard' }
      navigate(roleRoutes[result.user?.role] || '/dashboard')
    }
  }

  const roles = ['Student', 'Staff', 'Admin']

  return (
    <div className="bg-background text-on-background font-body min-h-screen flex flex-col">
      <header className="bg-slate-50 flex items-center w-full px-6 py-4 fixed top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-700" />
          <span className="text-xl font-bold tracking-tight text-indigo-900 font-headline">HostelOS</span>
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center pt-20 pb-24 px-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-xl bg-surface-container-lowest shadow-premium min-h-[700px]">
          {/* Left: Hero */}
          <div className="hidden lg:flex flex-col justify-center p-16 bg-primary-gradient relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-container/20 rounded-full -ml-20 -mb-20 blur-2xl" />
            <div className="relative z-10">
              <h1 className="text-5xl font-headline font-extrabold leading-tight mb-6">
                Elevating the<br />Hostel Experience.
              </h1>
              <p className="text-lg opacity-90 max-w-md mb-12 leading-relaxed">
                Seamlessly manage occupancy, billing, and resident requests with our intelligent hospitality ecosystem.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Smart Allocation', 'Real-time Analytics', '24/7 Concierge'].map(tag => (
                  <span key={tag} className="px-4 py-2 bg-white/10 rounded-full text-xs font-medium backdrop-blur-sm border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Login Form */}
          <div className="flex flex-col items-center justify-center p-8 lg:p-20 relative">
            <div className="w-full max-w-md">
              <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
                <Building2 className="w-8 h-8 text-primary" />
                <span className="text-2xl font-headline font-extrabold text-on-surface">HostelOS</span>
              </div>

              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-headline font-bold text-on-surface mb-2">Welcome Back</h2>
                <p className="text-on-surface-variant">Access your workspace and manage your stay.</p>
              </div>

              <div className="flex p-1 bg-surface-container-low rounded-xl mb-8">
                {roles.map(role => (
                  <button key={role} type="button" onClick={() => setActiveRole(role.toLowerCase())}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      activeRole === role.toLowerCase()
                        ? 'bg-surface-container-lowest text-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}>{role}</button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface ml-1">Email / ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <BadgeCheck className="w-5 h-5 text-outline" />
                    </div>
                    <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email or ID" required
                      className="w-full pl-11 pr-4 py-3 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all text-on-surface" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="block text-sm font-semibold text-on-surface">Password</label>
                    <a href="#" className="text-xs font-semibold text-primary hover:underline">Forgot Password?</a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-outline" />
                    </div>
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                      className="w-full pl-11 pr-12 py-3 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all text-on-surface" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-1">
                  <input type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)}
                    className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" />
                  <label htmlFor="remember" className="text-sm text-on-surface-variant font-medium select-none">Remember me for 30 days</label>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-4 bg-primary-gradient text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all duration-150 disabled:opacity-60">
                  {loading ? 'Signing in...' : 'Log In'}
                </button>
              </form>

              <p className="mt-8 text-center text-on-surface-variant text-sm">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-primary font-bold hover:underline">Apply here</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-50 flex flex-col md:flex-row justify-between items-center px-8 py-6 gap-4">
        <div className="text-slate-400 text-xs font-medium">© 2025 HostelOS Management. All rights reserved.</div>
        <div className="flex gap-6">
          {['Privacy Policy', 'Terms of Service', 'Support'].map(link => (
            <a key={link} href="#" className="text-slate-400 hover:text-indigo-500 text-xs font-medium transition-opacity opacity-80 hover:opacity-100">{link}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
