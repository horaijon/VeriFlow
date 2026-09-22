import AttemptCard from './AttemptCard'
import FinalOutput from './FinalOutput'

export default function ExecutionTimeline({ result, isProcessing, error, activeStep, onResolve }) {
  const isEmpty = !result && !isProcessing && !error

  return (
    <div className="space-y-4">
      {/* Section label */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
        </svg>
        <h2 className="text-xs font-semibold text-[#8888a0] tracking-widest uppercase">
          Execution Log
        </h2>
        {isProcessing && (
          <span className="ml-2 text-[10px] font-mono text-blue-400 animate-pulse">
            ● RUNNING
          </span>
        )}
      </div>

      {/* Timeline container */}
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl overflow-hidden min-h-[400px]">
        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-[400px] text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-[#1c1c28] border border-[#2a2a3a] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#3a3a4a]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <p className="text-sm text-[#555568] font-medium mb-1">
              No execution yet
            </p>
            <p className="text-xs text-[#3a3a4a] max-w-xs">
              Submit messy data to watch the agent extract, fail, self-heal, and validate in real time.
            </p>
          </div>
        )}

        {/* Processing spinner */}
        {isProcessing && !result && (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-[#2a2a3a] border-t-blue-500 animate-spin-slow" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-blue-500/20" />
              </div>
            </div>
            <p className="mt-4 text-sm text-blue-300 font-mono animate-pulse">
              Agent processing...
            </p>
            <p className="mt-1 text-[10px] text-[#555568] font-mono">
              Calling LLM → Validating → Self-healing if needed
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span className="text-sm font-semibold text-red-400">Connection Error</span>
              </div>
              <p className="text-xs text-red-300/80 font-mono">{error}</p>
              <p className="text-[10px] text-[#555568] mt-2 font-mono">
                Make sure the backend is running: uvicorn main:app --reload --port 8000
              </p>
            </div>
          </div>
        )}

        {/* Attempt timeline */}
        {result && result.attempts.length > 0 && (
          <div className="p-4 sm:p-6">
            {/* Timeline line */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[19px] top-6 bottom-6 w-px bg-[#2a2a3a]" />

              <div className="space-y-6">
                {result.attempts.map((attempt, index) => (
                  <div
                    key={attempt.attempt_number}
                    className={`transition-all duration-500 ${
                      activeStep > index ? 'opacity-100' : 'opacity-0 translate-y-4'
                    }`}
                    style={{ transitionDelay: `${index * 150}ms` }}
                  >
                    <AttemptCard attempt={attempt} isLast={index === result.attempts.length - 1} />
                  </div>
                ))}
              </div>
            </div>

            {/* Final output — show for Success, needs_clarification, and resolved */}
            {(result.status === 'Success' || result.status === 'needs_clarification' || result.status === 'resolved') && (result.final_output || result.partial_data) && (
              <div
                className={`mt-6 transition-all duration-500 ${
                  activeStep > result.attempts.length - 1 ? 'opacity-100' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${result.attempts.length * 150 + 200}ms` }}
              >
                {result.status === 'resolved' && (
                  <div className="mb-4 relative">
                    <div className="absolute left-[19px] top-[-24px] bottom-full w-px bg-green-500/50" />
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#111118] border-2 border-green-500/30 flex items-center justify-center shrink-0 z-10">
                        <span className="text-green-400">👤</span>
                      </div>
                      <div className="flex-1 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-green-400 flex items-center gap-2">
                            User Provided Missing Data → Evidence Gate Passed
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <FinalOutput
                  data={result.final_output || result.partial_data}
                  status={result.status}
                  missingFields={result.missing_fields || []}
                  onResolve={onResolve}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
