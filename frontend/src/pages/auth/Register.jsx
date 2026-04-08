import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Building2, User, Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', role: 'student' })
  const [showPassword, setShowPassword] = useState(false)
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) return
    const result = await register(formData)
    if (result.success) navigate('/dashboard')
  }

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <header className="bg-slate-50 flex items-center px-6 py-4 fixed top-0 z-50 w-full">
        <Link to="/" className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-700" />
          <span className="text-xl font-bold tracking-tight text-indigo-900 font-headline">HostelOS</span>
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center pt-20 pb-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-premium">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-headline font-bold text-on-surface mb-2">Create Account</h2>
              <p className="text-on-surface-variant">Join the HostelOS ecosystem</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { name: 'name', label: 'Full Name', icon: User, type: 'text', placeholder: 'Enter your full name' },
                { name: 'email', label: 'Email', icon: Mail, type: 'email', placeholder: 'your@email.com' },
                { name: 'phone', label: 'Phone', icon: Phone, type: 'tel', placeholder: 'Your phone number' },
              ].map(field => (
                <div key={field.name} className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface ml-1">{field.label}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><field.icon className="w-5 h-5 text-outline" /></div>
                    <input name={field.name} type={field.type} value={formData[field.name]} onChange={handleChange} placeholder={field.placeholder} required
                      className="w-full pl-11 pr-4 py-3 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary transition-all" />
                  </div>
                </div>
              ))}

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface ml-1">Role</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="w-5 h-5 text-outline" /></div>
                  <select name="role" value={formData.role} onChange={handleChange} required
                    className="w-full pl-11 pr-4 py-3 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer">
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {['password', 'confirmPassword'].map(field => (
                <div key={field} className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface ml-1">
                    {field === 'password' ? 'Password' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="w-5 h-5 text-outline" /></div>
                    <input name={field} type={showPassword ? 'text' : 'password'} value={formData[field]} onChange={handleChange} placeholder="••••••••" required
                      className="w-full pl-11 pr-12 py-3 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary transition-all" />
                    {field === 'password' && (
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-primary-gradient text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-60">
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>

            <p className="mt-6 text-center text-on-surface-variant text-sm">
              Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
