export default function StatusBanner({ status }) {
  const isSuccess = status === 'Success'
  const isReview = status === 'Requires Human Review'

  const config = isSuccess
    ? {
        bg: 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_16px_rgba(34,197,94,0.1)]',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        label: 'PIPELINE PASSED',
      }
    : isReview
    ? {
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.1)]',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        ),
        label: 'HUMAN REVIEW REQUIRED',
      }
    : {
        bg: 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_16px_rgba(239,68,68,0.1)]',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        label: 'PIPELINE FAILED',
      }

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-mono text-sm font-bold ${config.bg}`}
    >
      {config.icon}
      {config.label}
    </div>
  )
}
