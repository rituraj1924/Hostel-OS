import { Building2, Plus } from 'lucide-react'
import { useState } from 'react'
import Modal from '../../components/ui/Modal'

export default function RoomAllotment() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Room Allotment</h1>
          <p className="text-on-surface-variant text-sm mt-1">Apply for room change or new allotment</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary-gradient text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> New Application
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-primary-gradient text-white p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          <h2 className="font-headline font-bold text-xl mb-2">Current Room Assignment</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6">
            {[{ label: 'Room', value: '302' }, { label: 'Floor', value: '3rd' }, { label: 'Wing', value: 'A' }, { label: 'Type', value: 'Double' }].map(item => (
              <div key={item.label}>
                <p className="text-white/60 text-xs uppercase tracking-wider">{item.label}</p>
                <p className="font-headline text-2xl font-extrabold mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest p-6 rounded-xl soft-shadow">
        <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Room Change Guidelines</h3>
        <ul className="space-y-3 text-sm text-on-surface-variant">
          <li className="flex items-start gap-3"><span className="w-6 h-6 bg-primary-fixed rounded-full flex items-center justify-center text-primary text-xs font-bold shrink-0">1</span>Applications are reviewed within 7 working days</li>
          <li className="flex items-start gap-3"><span className="w-6 h-6 bg-primary-fixed rounded-full flex items-center justify-center text-primary text-xs font-bold shrink-0">2</span>Room changes are subject to availability</li>
          <li className="flex items-start gap-3"><span className="w-6 h-6 bg-primary-fixed rounded-full flex items-center justify-center text-primary text-xs font-bold shrink-0">3</span>Priority given to medical and accessibility needs</li>
        </ul>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Room Allotment Application">
        <form className="space-y-4">
          <div className="space-y-2"><label className="text-sm font-semibold text-on-surface">Application Type</label>
            <select className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary"><option>Room Change</option><option>New Allotment</option></select></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-semibold text-on-surface">Preferred Floor</label><select className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary"><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
            <div className="space-y-2"><label className="text-sm font-semibold text-on-surface">Room Type</label><select className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm focus:ring-2 focus:ring-primary"><option>Single</option><option>Double</option></select></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-semibold text-on-surface">Reason</label><textarea rows={3} className="w-full py-3 px-4 bg-surface-container border-none rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary" /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-primary-gradient text-white font-bold text-sm rounded-xl">Submit</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
