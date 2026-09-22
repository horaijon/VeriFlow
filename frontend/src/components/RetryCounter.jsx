export default function RetryCounter({ current, max, isProcessing, attempts = [] }) {
  const dots = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-medium text-zinc-500 tracking-widest uppercase">
        RETRY COUNTER
      </span>

      <div className="flex items-center gap-1.5">
        {dots.map((n) => {
          let state = 'idle'
          
          const attempt = attempts[n - 1]
          if (attempt && attempt.validation) {
            state = attempt.validation.is_valid ? 'success' : 'error'
          } else if (n === current && isProcessing) {
            state = 'active'
          }

          let bgColor = 'bg-zinc-950 border-zinc-800 text-zinc-600'
          let lineColor = 'bg-zinc-800'

          if (state === 'active') {
            bgColor = 'bg-blue-500/20 border-blue-500/50 text-blue-300 animate-pulse-glow'
          } else if (state === 'success') {
            bgColor = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            lineColor = 'bg-emerald-500/30'
          } else if (state === 'error') {
            bgColor = 'bg-red-500/10 border-red-500/30 text-red-400'
            lineColor = 'bg-red-500/30'
          }

          return (
            <div key={n} className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-medium
                  border transition-all duration-300 ${bgColor}`}
              >
                {n}
              </div>
              {n < max && (
                <div className={`w-3 h-px transition-colors duration-300 ${lineColor}`} />
              )}
            </div>
          )
        })}
      </div>

      <span className="text-[11px] font-medium text-zinc-500">
        {current}/{max}
      </span>
    </div>
  )
}
