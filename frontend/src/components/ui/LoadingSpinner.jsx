import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`flex items-center justify-center p-12 ${className}`}>
      <Loader2 className={`${sizes[size]} text-primary animate-spin`} />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-on-surface-variant text-sm font-medium">Loading...</p>
    </div>
  )
}
