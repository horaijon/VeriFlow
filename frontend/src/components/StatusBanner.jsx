export default function StatusBanner({ status, isProcessing }) {
  const isSuccess = status === 'Success'
  const isReview = status === 'Requires Human Review'
  const isResolved = status === 'resolved'
  const isClarification = status === 'needs_clarification'

  let config;
  
  if (isProcessing) {
    config = {
      bg: 'bg-blue-500/10 border-blue-500/30 text-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.1)]',
      icon: (
        <svg className="w-5 h-5 animate-spin-slow" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ),
      label: 'PIPELINE RUNNING',
    }
  } else if (isSuccess || isResolved) {
    config = {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.1)]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'PIPELINE PASSED',
    }
  } else if (isReview || isClarification) {
    config = {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.1)]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      label: 'HUMAN REVIEW REQUIRED',
    }
  } else {
    config = {
      bg: 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_16px_rgba(239,68,68,0.1)]',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'PIPELINE FAILED',
    }
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm ${config.bg}`}
    >
      {config.icon}
      {config.label}
    </div>
  )
}
