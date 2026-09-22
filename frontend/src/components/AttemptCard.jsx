import { useState } from 'react'

function formatJson(jsonString) {
  try {
    return JSON.stringify(JSON.parse(jsonString), null, 2)
  } catch {
    return jsonString
  }
}

// Highlight specific problem fields in the JSON output
function highlightErrors(jsonString, errorDetails) {
  if (!errorDetails) return null

  const errorLower = errorDetails.toLowerCase()
  const fieldHighlights = {}

  if (errorLower.includes('invoice_amount') || errorLower.includes('amount')) {
    fieldHighlights['invoice_amount'] = true
  }
  if (errorLower.includes('date')) {
    fieldHighlights['date'] = true
  }
  if (errorLower.includes('customer_name') || errorLower.includes('customer')) {
    fieldHighlights['customer_name'] = true
  }

  return fieldHighlights
}

export default function AttemptCard({ attempt, isLast }) {
  const [expanded, setExpanded] = useState(true)
  const isValid = attempt.validation?.is_valid
  const formatted = attempt.agent_output ? formatJson(attempt.agent_output) : null
  const errorHighlights = !isValid ? highlightErrors(formatted, attempt.validation?.error_details) : null

  // Render JSON with line-by-line highlighting
  function renderHighlightedJson() {
    if (!formatted) return <span className="text-zinc-500 italic">No output</span>

    const lines = formatted.split('\n')
    return lines.map((line, i) => {
      let isErrorLine = false
      if (errorHighlights) {
        for (const field of Object.keys(errorHighlights)) {
          if (line.includes(`"${field}"`)) {
            isErrorLine = true
            break
          }
        }
      }

      return (
        <div
          key={i}
          className={`px-3 ${
            isErrorLine
              ? 'bg-red-500/10 border-l-2 border-red-500'
              : ''
          }`}
        >
          <span className="select-none text-zinc-600 mr-3 inline-block w-4 text-right">
            {i + 1}
          </span>
          <span className={isErrorLine ? 'text-red-400' : 'text-zinc-300'}>
            {line}
          </span>
        </div>
      )
    })
  }

  return (
    <div className="relative pl-10">
      {/* Timeline node */}
      <div className={`absolute left-0 top-1 w-10 h-10 flex items-center justify-center`}>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-bold font-mono
            ${isValid
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
              : 'bg-red-500/10 border-red-500/50 text-red-400'
            }`}
        >
          {attempt.attempt_number}
        </div>
      </div>

      {/* Card */}
      <div
        className={`ml-4 rounded-lg border overflow-hidden transition-all duration-300
          ${isValid
            ? 'border-emerald-500/30 bg-emerald-950/10'
            : 'border-red-500/30 bg-red-950/10'
          }`}
      >
        {/* Card Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full px-4 py-3 flex items-center justify-between text-left bg-zinc-950
            ${isValid ? 'hover:bg-emerald-500/5' : 'hover:bg-red-500/5'}
            transition-colors duration-150`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              ATTEMPT {attempt.attempt_number}
            </span>

            {/* Status badge */}
            {isValid ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono
                bg-emerald-500/15 text-emerald-400 border border-emerald-500/30
                shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                VALIDATION PASSED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono
                bg-red-500/15 text-red-400 border border-red-500/30
                shadow-[0_0_12px_rgba(239,68,68,0.15)]">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                VALIDATION FAILED
              </span>
            )}
          </div>

          <svg
            className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {/* Card Body */}
        {expanded && (
          <div className="border-t border-zinc-800 bg-zinc-950">
            {/* Agent output section */}
            <div className="px-4 pt-4 pb-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[10px] font-medium text-blue-400/80 tracking-widest uppercase">
                  AGENT OUTPUT (LLM RESPONSE)
                </span>
              </div>
              <div className="bg-zinc-900 rounded-md border border-zinc-800 overflow-hidden">
                <pre className="text-[11px] leading-5 font-mono py-2 overflow-x-auto">
                  {renderHighlightedJson()}
                </pre>
              </div>
            </div>

            {/* Evidence Gate section */}
            <div className="px-4 pt-3 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isValid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className={`text-[10px] font-medium tracking-widest uppercase ${isValid ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                  EVIDENCE GATE (PYDANTIC VALIDATION)
                </span>
              </div>

              {isValid ? (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-md px-4 py-3">
                  <p className="text-xs font-mono text-emerald-400">
                    All fields validated successfully. Schema contract satisfied.
                  </p>
                </div>
              ) : (
                <div className="bg-red-500/5 border border-red-500/20 rounded-md px-4 py-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div>
                      <p className="text-[10px] font-bold text-red-400/80 mb-1 tracking-wider uppercase">
                        PYDANTIC VALIDATION ERROR
                      </p>
                      <p className="text-xs font-mono text-red-300/90 leading-relaxed whitespace-pre-wrap">
                        {attempt.validation?.error_details}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Self-healing arrow for failed attempts */}
            {!isValid && !isLast && (
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 py-2 px-3 rounded-md bg-amber-500/5 border border-amber-500/20">
                  <svg className="w-4 h-4 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  <span className="text-[10px] font-bold text-amber-400/90 tracking-wider uppercase">
                    SELF-HEALING → FEEDING ERROR BACK TO AGENT FOR RETRY
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
