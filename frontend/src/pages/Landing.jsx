import { Link } from 'react-router-dom'
import { Building2, Shield, Users, BarChart3, BedDouble, ArrowRight } from 'lucide-react'

export default function Landing() {
  return (
    <div className="bg-background min-h-screen">
      {/* Navbar */}
      <header className="bg-slate-50 flex justify-between items-center px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-700" />
          <span className="text-xl font-bold tracking-tight text-indigo-900 font-headline">HostelOS</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-primary hover:text-primary-container transition-colors">Login</Link>
          <Link to="/register" className="bg-primary-gradient text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-20 md:py-32 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-fixed rounded-full text-primary text-sm font-bold mb-8">
          <Shield className="w-4 h-4" /> Smart Hostel Management Platform
        </div>
        <h1 className="text-4xl md:text-6xl font-headline font-extrabold text-on-surface leading-tight mb-6">
          Elevating the<br /><span className="text-primary">Hostel Experience</span>
        </h1>
        <p className="text-lg text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
          Seamlessly manage occupancy, billing, complaints, and resident requests with our intelligent hospitality ecosystem.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login" className="bg-primary-gradient text-white font-bold px-8 py-4 rounded-xl text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 justify-center">
            Enter Portal <ArrowRight className="w-5 h-5" />
          </Link>
          <a href="#features" className="bg-surface-container-lowest text-primary font-bold px-8 py-4 rounded-xl text-lg ghost-border hover:bg-primary-fixed transition-colors">
            Explore Features
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-20 bg-surface-container-low">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-headline font-bold text-center text-on-surface mb-4">Everything You Need</h2>
          <p className="text-on-surface-variant text-center mb-12 max-w-xl mx-auto">A comprehensive suite of tools designed for modern hostel management</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BedDouble, title: 'Room Management', desc: 'Visual heatmaps, real-time occupancy tracking, and smart room allocation.' },
              { icon: Shield, title: 'Role-Based Access', desc: 'Secure access control for admins, staff, and students with granular permissions.' },
              { icon: Users, title: 'Resident Portal', desc: 'Students can raise complaints, apply for leave, and access documents easily.' },
              { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Real-time insights on occupancy, complaints, and financial metrics.' },
              { icon: Building2, title: 'Maintenance Scheduling', desc: 'Automated scheduling and tracking for cleaning and repairs.' },
              { icon: ArrowRight, title: 'Communication Hub', desc: 'Targeted announcements and notifications to specific wings or floors.' },
            ].map(feature => (
              <div key={feature.title} className="bg-surface-container-lowest p-8 rounded-xl soft-shadow card-3d">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4"><feature.icon className="w-6 h-6 text-primary" /></div>
                <h3 className="font-headline font-bold text-on-surface mb-2">{feature.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 px-8 py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" /><span className="text-white font-headline font-bold">HostelOS</span>
          </div>
          <p className="text-sm">© 2025 HostelOS. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
