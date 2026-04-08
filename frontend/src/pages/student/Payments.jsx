import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { toast } from 'react-toastify'
import {
  CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, X,
  Wallet, Home, Utensils, Wrench, Sparkles, ShieldCheck,
  ArrowUpRight, RefreshCw, IndianRupee, Lock, CalendarDays,
  TrendingUp, Star, Zap, CreditCard, Clock, Package
} from 'lucide-react'

// ─── Static fee-item metadata (amounts filled dynamically from backend) ───────
const FEE_META = [
  { key: 'monthly_rent',     icon: Home,          label: 'Base Rent',        sub: 'Standard Monthly Room Fee',  color: '#2D3FE2', bg: '#EEF0FF' },
  { key: 'mess_fee',         icon: Utensils,       label: 'Mess Fee',         sub: 'Unlimited Meals Plan',       color: '#059669', bg: '#ECFDF5' },
  { key: 'maintenance',      icon: Wrench,         label: 'Maintenance',      sub: 'General Upkeep & Repairs',   color: '#D97706', bg: '#FFFBEB' },
  { key: 'laundry',          icon: Sparkles,       label: 'Laundry',          sub: 'Weekly Wash & Fold',         color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'fine',             icon: AlertTriangle,  label: 'Fine / Penalty',   sub: 'Late Fee Applied',           color: '#DC2626', bg: '#FEF2F2' },
  { key: 'security_deposit', icon: ShieldCheck,    label: 'Security Deposit', sub: 'Refundable on Checkout',     color: '#0891B2', bg: '#ECFEFF' },
]

/** Recurring monthly bundle (matches admin Settings + backend full_month). Excludes one-time security deposit. */
const MONTHLY_KEYS = ['monthly_rent', 'mess_fee', 'maintenance', 'laundry', 'fine']

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

function fmt(n) { return (n || 0).toLocaleString('en-IN') }

// ─── Date Logic ───────────────────────────────────────────────────────────────
// Academic year runs July(6) → June(5) of next year
function getAcademicYear(now = new Date()) {
  const m = now.getMonth()
  const y = now.getFullYear()
  const start = m >= 6 ? y : y - 1
  return { start, end: start + 1, label: `${start}-${start + 1}` }
}

function getAcademicMonths(now = new Date()) {
  const { start } = getAcademicYear(now)
  // 12 months starting July of start year
  return Array.from({ length: 12 }, (_, i) => {
    const mIdx = (6 + i) % 12          // 6,7,8,9,10,11,0,1,2,3,4,5
    const yr   = (6 + i) < 12 ? start : start + 1
    return { monthIndex: mIdx, year: yr, slot: i }
  })
}

/**
 * Determines the calendar "status" of a given month slot based purely on date:
 *  - PAST  (before current month): should be paid; if no completed payment → OVERDUE
 *  - CURRENT: if unpaid → PENDING (due this month); if paid → COMPLETED
 *  - FUTURE: UPCOMING (locked)
 */
function getMonthDateStatus(monthIndex, year, now = new Date()) {
  const curM = now.getMonth()
  const curY = now.getFullYear()
  if (year < curY || (year === curY && monthIndex < curM)) return 'past'
  if (year === curY && monthIndex === curM) return 'current'
  return 'future'
}

function getDaysOverdue(dueDate, now = new Date()) {
  if (!dueDate) return 0
  const diff = now - new Date(dueDate)
  return diff > 0 ? Math.floor(diff / 86400000) : 0
}

function getStatusConfig(status) {
  switch (status) {
    case 'completed': return { label: 'Paid',     bg: '#DCFCE7', color: '#16A34A', dot: '#22C55E' }
    case 'pending':   return { label: 'Due',      bg: '#FEF9C3', color: '#B45309', dot: '#EAB308' }
    case 'overdue':   return { label: 'Overdue',  bg: '#FEE2E2', color: '#DC2626', dot: '#EF4444' }
    case 'upcoming':  return { label: 'Upcoming', bg: '#F1F5F9', color: '#94A3B8', dot: '#CBD5E1' }
    case 'failed':    return { label: 'Failed',   bg: '#FEE2E2', color: '#DC2626', dot: '#EF4444' }
    case 'refunded':  return { label: 'Refunded', bg: '#E0E7FF', color: '#4338CA', dot: '#6366F1' }
    default:          return { label: status,     bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' }
  }
}

function StatusPill({ status }) {
  const cfg = getStatusConfig(status)
  return (
    <span style={{ background: cfg.bg, color: cfg.color }}
      className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
      <span style={{ background: cfg.dot }} className="w-1.5 h-1.5 rounded-full flex-shrink-0" />
      {cfg.label}
    </span>
  )
}

// ─── Razorpay loader ──────────────────────────────────────────────────────────
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true); s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

async function initiateRazorpay({ amount, paymentType, description, user, onSuccess, onFail, year, month }) {
  const loaded = await loadRazorpay()
  if (!loaded) { toast.error('Payment gateway unavailable'); return }
  try {
    const res = await api.createPaymentOrder({ amount, paymentType, description, year, month })
    if (!res.data?.order) throw new Error('Order creation failed')
    const { order, payment: paymentRecord, key: rzpKey } = res.data
    const options = {
      key: rzpKey,
      amount: order.amount,
      currency: order.currency,
      name: 'HostelOS',
      description,
      order_id: order.id,
      prefill: { name: user?.name || '', email: user?.email || '' },
      theme: { color: '#2D3FE2' },
      handler: async (resp) => {
        try {
          const v = await api.verifyPayment({
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
            paymentId: paymentRecord._id,
          })
          if (v.data?.success) { toast.success('🎉 Payment successful!'); onSuccess?.() }
          else { toast.error('Verification failed'); onFail?.() }
        } catch { toast.error('Verification error'); onFail?.() }
      },
      modal: { ondismiss: onFail },
    }
    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (r) => { toast.error(`Failed: ${r.error.description}`); onFail?.() })
    rzp.open()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Payment initiation failed')
    onFail?.()
  }
}

// ─── Individual Pay Modal ─────────────────────────────────────────────────────
function PayModal({ isOpen, onClose, defaultType, monthLabel, feeItems, onSuccess, billingYear, billingMonthIndex }) {
  const [paymentType, setPaymentType] = useState(defaultType || 'monthly_rent')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => { if (defaultType) setPaymentType(defaultType) }, [defaultType])
  useEffect(() => {
    const fee = feeItems.find(f => f.key === paymentType)
    setAmount(String(fee?.amount || ''))
  }, [paymentType, feeItems])

  const handlePay = async (e) => {
    e.preventDefault()
    const parsedAmt = parseFloat(amount)
    if (!parsedAmt || parsedAmt <= 0) { toast.error('Enter a valid amount'); return }
    setLoading(true)
    await initiateRazorpay({
      amount: parsedAmt, paymentType,
      description: `${monthLabel} · ${paymentType.replace(/_/g, ' ')}`,
      user,
      year: billingYear,
      month: billingMonthIndex,
      onSuccess: () => { setLoading(false); onSuccess(); onClose() },
      onFail: () => setLoading(false),
    })
  }

  if (!isOpen) return null
  const selectedFee = feeItems.find(f => f.key === paymentType) || feeItems[0]
  const Icon = selectedFee?.icon || CreditCard

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      style={{ background: 'rgba(15,17,25,0.65)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 32px 80px rgba(15,17,25,0.25)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4"
          style={{ background: 'linear-gradient(135deg, #0f1119, #1a1f3a)' }}>
          <div>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', color: '#fff' }} className="text-lg font-extrabold">
              Make Payment
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {monthLabel && <><CalendarDays className="w-3 h-3 inline mr-1" />{monthLabel} · </>}
              Powered by Razorpay
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.7)' }} />
          </button>
        </div>

        <form onSubmit={handlePay} className="px-6 pb-6 pt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Fee Category</label>
            <div className="grid grid-cols-2 gap-2">
              {feeItems.map(({ key, icon: Ic, label, color, bg }) => (
                <button key={key} type="button" onClick={() => setPaymentType(key)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all"
                  style={{
                    background: paymentType === key ? bg : '#F8FAFC',
                    color: paymentType === key ? color : '#6B7280',
                    border: `1.5px solid ${paymentType === key ? color + '40' : 'transparent'}`,
                    transform: paymentType === key ? 'scale(1.02)' : 'scale(1)',
                  }}>
                  <Ic className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold" style={{ color: selectedFee?.color }}>₹</span>
              <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
                className="w-full pl-8 pr-4 py-3.5 rounded-xl text-base font-bold outline-none"
                style={{ background: '#F8FAFC', color: '#111827', border: `1.5px solid ${(selectedFee?.color || '#e2e8f0') + '30'}` }} />
            </div>
          </div>

          {selectedFee && (
            <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: selectedFee.bg }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fff' }}>
                <Icon className="w-5 h-5" style={{ color: selectedFee.color }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: selectedFee.color }}>{selectedFee.label}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{selectedFee.sub}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={{ background: '#F1F5F9', color: '#6B7280' }}>Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: loading ? '#93A8F4' : 'linear-gradient(135deg,#001bcc,#2D3FE2)', boxShadow: loading ? 'none' : '0 4px 16px rgba(45,63,226,0.35)' }}>
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
              {loading ? 'Processing…' : 'Pay Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Shared Month Data Compute ────────────────────────────────────────────────
function computeMonthData({ monthIndex, year, payments, feeItems, dueDayOfMonth, now }) {
  const monthLabel = `${MONTHS[monthIndex]} ${year}`
  const cycleLabel = `Academic Cycle ${monthIndex < 6 ? '02' : '01'}`
  const dateStatus = getMonthDateStatus(monthIndex, year, now) // 'past'|'current'|'future'
  const isFuture = dateStatus === 'future'

  // Payments for this billing month (prefer server billingYear/billingMonth)
  const monthPayments = payments.filter(p => {
    if (p.billingYear != null && p.billingMonth != null) {
      return p.billingYear === year && p.billingMonth === monthIndex
    }
    const d = new Date(p.dueDate || p.createdAt)
    return d.getMonth() === monthIndex && d.getFullYear() === year
  })

  const dueDate = new Date(year, monthIndex, Math.min(Math.max(1, dueDayOfMonth || 15), 28))
  const daysLate = getDaysOverdue(dueDate, now)
  const isLate = !isFuture && daysLate > 0

  const monthlyBundleTotal = feeItems
    .filter(f => MONTHLY_KEYS.includes(f.key))
    .reduce((s, f) => s + f.amount, 0)

  const hasFullMonth = monthPayments.some(p => p.paymentType === 'full_month' && p.status === 'completed')
  let paidTowardBundle = 0
  for (const p of monthPayments) {
    if (p.status !== 'completed') continue
    if (p.paymentType === 'full_month') {
      paidTowardBundle = monthlyBundleTotal
      break
    }
    if (MONTHLY_KEYS.includes(p.paymentType)) paidTowardBundle += (p.amount || 0)
  }
  const isMonthlyBundlePaid = monthlyBundleTotal > 0 && paidTowardBundle >= monthlyBundleTotal - 1

  let displayStatus =
    isFuture ? 'upcoming'
    : isMonthlyBundlePaid ? 'completed'
    : isLate ? 'overdue'
    : dateStatus === 'current' ? 'pending'
    : 'overdue'

  function itemPaid(key) {
    if (MONTHLY_KEYS.includes(key) && hasFullMonth) return true
    return monthPayments.some(p => p.paymentType === key && p.status === 'completed')
  }
  
  return { monthLabel, cycleLabel, isFuture, displayStatus, isLate, daysLate, dueDate, monthlyBundleTotal, isMonthlyBundlePaid, itemPaid }
}

// ─── Month Details Modal ──────────────────────────────────────────────────────
function MonthDetailsModal({ selectedMonth, feeItems, dueDayOfMonth, now, onPayItem, onPayFull, payments, onClose }) {
  if (!selectedMonth) return null;
  const { monthIndex, year } = selectedMonth;

  const data = computeMonthData({ monthIndex, year, payments, feeItems, dueDayOfMonth, now })
  const { monthLabel, isFuture, displayStatus, isLate, daysLate, dueDate, monthlyBundleTotal, isMonthlyBundlePaid, itemPaid } = data;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center p-4"
      style={{ background: 'rgba(15,17,25,0.65)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ background: '#fff', boxShadow: '0 32px 80px rgba(15,17,25,0.25)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <div>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', color: '#0F1119' }} className="text-xl font-extrabold">
              {monthLabel} Details
            </h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto w-full p-2 flex-1">
          {/* Overdue banner */}
          {(displayStatus === 'overdue') && (
            <div className="mx-4 mt-2 rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#DC2626' }} />
              <p className="text-xs" style={{ color: '#B91C1C' }}>
                <strong>Overdue</strong> — {monthLabel} payment is {daysLate} day{daysLate !== 1 ? 's' : ''} past due (due {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
              </p>
            </div>
          )}

          {/* Due date info */}
          {!isFuture && displayStatus !== 'completed' && (
            <div className="mx-4 mt-3 rounded-xl px-4 py-2.5 flex items-center gap-2"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#6B7280' }} />
              <p className="text-xs" style={{ color: '#6B7280' }}>
                Due date: <strong>{dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </p>
            </div>
          )}

          {/* Fee line items */}
          <div className="mt-3 divide-y" style={{ borderColor: '#F8FAFC' }}>
            {feeItems.map(({ key, icon: Icon, label, sub, color, bg, amount }) => {
              const paid = itemPaid(key)
              return (
                <div key={key}
                  className="flex items-center justify-between px-5 py-3 group transition-colors"
                  style={{ cursor: !paid ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (!paid) {
                       onPayItem(key, monthLabel, year, monthIndex);
                       onClose(); // Close details modal when opening payment modal
                    }
                  }}>
                  <div className="flex items-center gap-3 hover:opacity-80">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: paid ? '#DCFCE7' : bg }}>
                      {paid
                        ? <CheckCircle2 className="w-4 h-4" style={{ color: '#16A34A' }} />
                        : <Icon className="w-4 h-4" style={{ color }} />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold"
                        style={{ color: paid ? '#9CA3AF' : '#111827', textDecoration: paid ? 'line-through' : 'none' }}>
                        {label}
                      </p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>{sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tabular-nums"
                      style={{ color: paid ? '#9CA3AF' : '#111827', fontFamily: 'Manrope,sans-serif' }}>
                      ₹{fmt(amount)}
                    </span>
                    {paid
                      ? <CheckCircle2 className="w-4 h-4" style={{ color: '#16A34A' }} />
                      : <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }} />
                    }
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-auto bg-white border-t border-gray-100" style={{ padding: '0 0.5rem' }}>
          <div className="flex items-center justify-between px-5 py-3"
            style={{ background: '#F8FAFC' }}>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
              Monthly bundle (excl. security deposit)
            </span>
            <span style={{ fontFamily: 'Manrope,sans-serif', color: '#111827' }} className="text-xl font-extrabold">
              ₹{fmt(monthlyBundleTotal)}
            </span>
          </div>

          <div className="px-5 py-4 space-y-2">
            {!isMonthlyBundlePaid ? (
              <>
                <button
                  onClick={() => {
                    onPayFull(monthLabel, feeItems, year, monthIndex);
                    onClose();
                  }}
                  className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all active:scale-95"
                  style={{
                    background: displayStatus === 'overdue'
                      ? 'linear-gradient(135deg,#7f1d1d,#DC2626)' : 'linear-gradient(135deg,#001bcc,#2D3FE2)',
                    boxShadow: displayStatus === 'overdue'
                      ? '0 6px 20px rgba(220,38,38,0.3)' : '0 6px 20px rgba(45,63,226,0.3)',
                  }}>
                  <Package className="w-4 h-4" />
                  Pay Full Month — ₹{fmt(monthlyBundleTotal)}
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                     onPayItem('monthly_rent', monthLabel, year, monthIndex);
                     onClose();
                  }}
                  className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-95"
                  style={{ background: '#EEF0FF', color: '#2D3FE2' }}>
                  <CreditCard className="w-4 h-4" />
                  Pay Individual Items
                </button>
              </>
            ) : (
              <div className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ background: '#DCFCE7', color: '#16A34A' }}>
                <CheckCircle2 className="w-4 h-4" />
                Payment Complete
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Month Card (Grid Item) ───────────────────────────────────────────────────
function MonthCard({ monthIndex, year, payments, onToggle, isCurrentMonth, feeItems, dueDayOfMonth, now }) {
  const data = computeMonthData({ monthIndex, year, payments, feeItems, dueDayOfMonth, now })
  const { monthLabel, cycleLabel, isFuture, displayStatus, isLate, daysLate, isMonthlyBundlePaid } = data;

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300 h-full flex flex-col"
      style={{
        background: '#fff',
        boxShadow: '0 2px 12px rgba(15,17,25,0.06)',
        opacity: isFuture ? 0.72 : 1,
      }}>
      <button className="w-full flex-1 flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors" onClick={onToggle}>
        <div className="flex gap-4 w-full h-full items-center">
          <div className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 font-extrabold text-sm"
            style={{
              background: displayStatus === 'completed' ? '#DCFCE7'
                : displayStatus === 'overdue'   ? '#FEE2E2'
                : displayStatus === 'upcoming'  ? '#F1F5F9' : '#FEF9C3',
              color: displayStatus === 'completed' ? '#16A34A'
                : displayStatus === 'overdue'   ? '#DC2626'
                : displayStatus === 'upcoming'  ? '#94A3B8' : '#B45309',
              fontFamily: 'Manrope,sans-serif',
            }}>
            {isFuture ? <Lock className="w-4 h-4" /> : <span>{String(monthIndex + 1).padStart(2, '0')}</span>}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p style={{ fontFamily: 'Manrope,sans-serif', color: '#111827' }} className="font-extrabold text-base">
                {monthLabel}
              </p>
              {isCurrentMonth && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#EEF0FF', color: '#2D3FE2' }}>
                  Current
                </span>
              )}
            </div>
            <p className="text-xs flex items-center gap-1.5" style={{ color: '#9CA3AF' }}>
              <span>{cycleLabel}</span>
              {isLate && !isMonthlyBundlePaid && (
                <span className="font-bold" style={{ color: '#DC2626' }}>· {daysLate}d late</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex sm:justify-end items-center mt-2 sm:mt-0 flex-shrink-0">
          <StatusPill status={displayStatus} />
        </div>
      </button>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function StudentPayments() {
  const { user } = useAuth()
  const now = new Date()

  const [payments,    setPayments]    = useState([])
  const [feeConfig,   setFeeConfig]   = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [defaultType, setDefaultType] = useState('monthly_rent')
  const [payingMonth, setPayingMonth] = useState('')
  const [fullPayLoading, setFullPayLoading] = useState(false)
  const [payingYear, setPayingYear] = useState(() => new Date().getFullYear())
  const [payingMonthIndex, setPayingMonthIndex] = useState(() => new Date().getMonth())
  const [selectedMonthDetails, setSelectedMonthDetails] = useState(null)

  const { label: academicLabel } = getAcademicYear(now)
  const months = getAcademicMonths(now)
  const curM = now.getMonth()
  const curY = now.getFullYear()

  // Build fee items with amounts from backend config
  const feeItems = FEE_META.map(meta => ({
    ...meta,
    amount: feeConfig ? (feeConfig[meta.key] || 0) : 0,
  }))
  const monthBundleTotal = feeItems
    .filter(f => MONTHLY_KEYS.includes(f.key))
    .reduce((s, f) => s + f.amount, 0)
  const dueDayOfMonth = feeConfig?.dueDayOfMonth || 15

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [paymentsRes, feeRes] = await Promise.all([
        api.getAllPayments({ user: user?._id || user?.id }),
        api.getFeeConfig(),
      ])
      setPayments(paymentsRes.data?.payments || [])
      setFeeConfig(feeRes.data?.feeConfig || null)
    } catch (err) {
      console.error('Failed to fetch payment data:', err)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Derived stats ──
  const totalPaid    = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0)
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0)

  // Count months that are OVERDUE (past & not fully paid)
  const overdueMonths = months.filter(({ monthIndex, year }) => {
    const ds = getMonthDateStatus(monthIndex, year, now)
    if (ds === 'future') return false
    const monthPmts = payments.filter(p => {
      if (p.billingYear != null && p.billingMonth != null) {
        return p.billingYear === year && p.billingMonth === monthIndex
      }
      const d = new Date(p.dueDate || p.createdAt)
      return d.getMonth() === monthIndex && d.getFullYear() === year
    })
    const hasFull = monthPmts.some(p => p.paymentType === 'full_month' && p.status === 'completed')
    let paidToward = 0
    for (const p of monthPmts) {
      if (p.status !== 'completed') continue
      if (p.paymentType === 'full_month') { paidToward = monthBundleTotal; break }
      if (MONTHLY_KEYS.includes(p.paymentType)) paidToward += (p.amount || 0)
    }
    return !(monthBundleTotal > 0 && paidToward >= monthBundleTotal - 1)
  })
  const overdueCount = overdueMonths.length
  const overdueAmount = overdueCount * monthBundleTotal

  const openPayItem = (type, monthLabel, year, monthIndex) => {
    setDefaultType(type)
    setPayingMonth(monthLabel)
    setPayingYear(year)
    setPayingMonthIndex(monthIndex)
    setShowModal(true)
  }

  const handlePayFull = async (monthLabel, items, year, monthIndex) => {
    const total = items
      .filter(f => MONTHLY_KEYS.includes(f.key))
      .reduce((s, f) => s + f.amount, 0)
    if (!total) { toast.error('Fee amounts not configured'); return }
    setFullPayLoading(true)
    await initiateRazorpay({
      amount: total,
      paymentType: 'full_month',
      description: `Full month payment — ${monthLabel}`,
      user,
      year,
      month: monthIndex,
      onSuccess: () => { setFullPayLoading(false); fetchData() },
      onFail: () => setFullPayLoading(false),
    })
  }

  return (
    <div style={{ fontFamily: 'Inter,system-ui,sans-serif', background: '#F0F2FA', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-3 flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'Manrope,sans-serif', fontSize: 26, fontWeight: 800, color: '#0F1119', lineHeight: 1.2 }}>
            Payments
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>{academicLabel} Academic Year</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openPayItem('monthly_rent', `${MONTHS[curM]} ${curY}`, curY, curM)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#001bcc,#2D3FE2)', boxShadow: '0 4px 16px rgba(45,63,226,0.35)' }}>
            <Zap className="w-4 h-4" />
            Quick Pay
          </button>
        </div>
      </div>

      <div className="px-4 pb-24 space-y-4">
        {/* ── Overdue Alert Banner ── */}
        {overdueCount > 0 && (
          <div className="rounded-2xl p-5"
            style={{ background: 'linear-gradient(135deg,#7f1d1d,#DC2626)', boxShadow: '0 8px 28px rgba(220,38,38,0.28)' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-200" />
              <span className="text-xs font-bold text-red-200 uppercase tracking-widest">Overdue Alert</span>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {overdueCount} month{overdueCount > 1 ? 's' : ''} past due
                </p>
                <p className="text-3xl font-extrabold text-white" style={{ fontFamily: 'Manrope,sans-serif' }}>
                  ₹{fmt(overdueAmount)}
                </p>
              </div>
              <button onClick={() => openPayItem('monthly_rent', `${MONTHS[curM]} ${curY}`, curY, curM)}
                className="px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold flex-shrink-0 transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', backdropFilter: 'blur(8px)' }}>
                <IndianRupee className="w-4 h-4" />
                Pay Now
              </button>
            </div>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Paid',   value: `₹${fmt(totalPaid)}`,    icon: CheckCircle2, color: '#16A34A', bg: '#DCFCE7' },
            { label: 'Pending',      value: `₹${fmt(totalPending)}`, icon: Clock,        color: '#B45309', bg: '#FEF9C3' },
            { label: 'Transactions', value: String(payments.length), icon: TrendingUp,   color: '#2D3FE2', bg: '#EEF0FF' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl p-4 text-center"
              style={{ background: '#fff', boxShadow: '0 2px 12px rgba(15,17,25,0.06)' }}>
              <div className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-base font-extrabold leading-none"
                style={{ color: '#111827', fontFamily: 'Manrope,sans-serif', fontSize: 13 }}>
                {value}
              </p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Monthly total chip ── */}
        {feeConfig && (
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(15,17,25,0.06)' }}>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" style={{ color: '#2D3FE2' }} />
              <span className="text-sm font-semibold" style={{ color: '#374151' }}>Monthly bundle</span>
            </div>
            <span className="font-extrabold text-base" style={{ fontFamily: 'Manrope,sans-serif', color: '#2D3FE2' }}>
              ₹{fmt(monthBundleTotal)} / mo
            </span>
          </div>
        )}

        {/* ── Section heading ── */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" style={{ color: '#6B7280' }} />
            <h2 style={{ fontFamily: 'Manrope,sans-serif', color: '#111827' }} className="font-extrabold text-base">
              Payment Timeline
            </h2>
          </div>
          <button onClick={fetchData} className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        {/* ── Cards ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#EEF0FF' }}>
              <RefreshCw className="w-6 h-6 animate-spin" style={{ color: '#2D3FE2' }} />
            </div>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading payment timeline…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {months.map(({ monthIndex, year }) => (
              <MonthCard
                key={`${monthIndex}-${year}`}
                monthIndex={monthIndex}
                year={year}
                payments={payments}
                feeItems={feeItems}
                dueDayOfMonth={dueDayOfMonth}
                now={now}
                onToggle={() => setSelectedMonthDetails({ monthIndex, year })}
                isCurrentMonth={monthIndex === curM && year === curY}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 py-2">
          <Star className="w-3.5 h-3.5" style={{ color: '#CBD5E1' }} />
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Payments secured by Razorpay</p>
          <Star className="w-3.5 h-3.5" style={{ color: '#CBD5E1' }} />
        </div>
      </div>

      {/* ── Month Details Modal ── */}
      <MonthDetailsModal 
        selectedMonth={selectedMonthDetails}
        onClose={() => setSelectedMonthDetails(null)}
        payments={payments}
        feeItems={feeItems}
        dueDayOfMonth={dueDayOfMonth}
        now={now}
        onPayItem={openPayItem}
        onPayFull={handlePayFull}
      />

      {/* ── Pay Modal ── */}
      <PayModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        defaultType={defaultType}
        monthLabel={payingMonth}
        feeItems={feeItems}
        billingYear={payingYear}
        billingMonthIndex={payingMonthIndex}
        onSuccess={fetchData}
      />
    </div>
  )
}
