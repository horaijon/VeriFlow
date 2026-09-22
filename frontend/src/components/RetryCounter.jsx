export default function RetryCounter({ current, max, isProcessing }) {
  const dots = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-medium text-zinc-500 tracking-widest uppercase">
        RETRY COUNTER
      </span>

      <div className="flex items-center gap-1.5">
        {dots.map((n) => {
          let state = 'idle'
          if (n < current) state = 'done'
          else if (n === current && isProcessing) state = 'active'
          else if (n === current && !isProcessing) state = 'done'

          return (
            <div key={n} className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-medium
                  border transition-all duration-300
                  ${state === 'active'
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 animate-pulse-glow'
                    : state === 'done'
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                  }`}
              >
                {n}
              </div>
              {n < max && (
                <div className={`w-3 h-px ${state === 'done' ? 'bg-zinc-700' : 'bg-zinc-800'}`} />
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
