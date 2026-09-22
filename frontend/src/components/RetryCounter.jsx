export default function RetryCounter({ current, max, isProcessing }) {
  const dots = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-mono text-[#555568] tracking-widest">
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
                className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-mono font-bold
                  border transition-all duration-300
                  ${state === 'active'
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 animate-pulse-glow'
                    : state === 'done'
                    ? 'bg-[#1c1c28] border-[#3a3a4a] text-[#8888a0]'
                    : 'bg-[#111118] border-[#1e1e2e] text-[#3a3a4a]'
                  }`}
              >
                {n}
              </div>
              {n < max && (
                <div className={`w-3 h-px ${state === 'done' ? 'bg-[#3a3a4a]' : 'bg-[#1e1e2e]'}`} />
              )}
            </div>
          )
        })}
      </div>

      <span className="text-[11px] font-mono text-[#555568]">
        {current}/{max}
      </span>
    </div>
  )
}
