import { useState } from 'react'

export default function FinalOutput({ data, status, missingFields = [], onResolve }) {
  const isClarificationMode = status === 'needs_clarification'
  const isResolved = status === 'resolved'
  
  // We keep a local state of user inputs for the missing fields
  const [userInputs, setUserInputs] = useState({})

  function handleFieldChange(field, value) {
    setUserInputs(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit() {
    if (onResolve) {
      onResolve(userInputs)
    }
  }

  // Filter out source_quote fields from main display
  const mainFields = Object.entries(data).filter(([key]) => !key.endsWith('_source_quote'))

  // Determine colors based on mode
  const isGreen = status === 'Success' || isResolved
  const borderColor = isGreen ? 'border-emerald-500/30' : isClarificationMode ? 'border-amber-500/30' : 'border-zinc-800'
  const bgColor = isGreen ? 'bg-emerald-950/10' : isClarificationMode ? 'bg-amber-950/10' : 'bg-zinc-950'
  const shadowColor = isGreen ? 'shadow-[0_0_24px_rgba(16,185,129,0.05)]' : isClarificationMode ? 'shadow-[0_0_24px_rgba(245,158,11,0.05)]' : 'shadow-none'

  // Helper to get reason for a missing field
  const getMissingFieldReason = (fieldName) => {
    const found = missingFields.find(m => m.field === fieldName)
    return found ? found.reason : null
  }

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg overflow-hidden ${shadowColor}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${isGreen ? 'border-emerald-500/20' : isClarificationMode ? 'border-amber-500/20' : 'border-zinc-800'}`}>
        {isGreen ? (
          <>
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            <span className="text-xs font-bold text-emerald-500 tracking-widest uppercase">
              {isResolved ? 'HUMAN-REVIEWED OUTPUT — READY FOR DATABASE' : 'VALIDATED OUTPUT — READY FOR DATABASE'}
            </span>
          </>
        ) : isClarificationMode ? (
          <>
            <svg className="w-4 h-4 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span className="text-xs font-bold text-amber-500 tracking-widest uppercase">
              CLARIFICATION NEEDED — HUMAN-IN-THE-LOOP REQUIRED
            </span>
          </>
        ) : null}
      </div>

      {/* Data table */}
      <div className="p-4">
        <table className="w-full text-sm">
          <tbody>
            {mainFields.map(([key, value]) => {
              const reason = getMissingFieldReason(key)
              const needsClarification = isClarificationMode && reason
              const sourceQuote = data[`${key}_source_quote`]
              
              // If we are in clarification mode, the value comes from userInputs if set
              const displayValue = needsClarification && userInputs[key] !== undefined ? userInputs[key] : value

              return (
                <tr key={key} className={`border-b border-zinc-800 last:border-0 ${needsClarification ? 'bg-amber-500/10' : ''}`}>
                  <td className="py-3 pr-4 text-zinc-400 whitespace-nowrap align-top font-medium">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {key}
                        {needsClarification && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold">
                            NEEDS INPUT
                          </span>
                        )}
                      </div>
                      {needsClarification && (
                        <span className="text-[10px] text-red-400 italic whitespace-normal max-w-[200px] font-sans">
                          {reason}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-zinc-100 font-mono">
                    {needsClarification ? (
                      // Editable input for missing fields
                      <input
                        type="text"
                        placeholder={`Enter missing value for ${key}...`}
                        value={userInputs[key] !== undefined ? userInputs[key] : (displayValue !== null && typeof displayValue !== 'object' ? String(displayValue) : '')}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        className="w-full bg-zinc-900 border border-amber-500/40 rounded-md px-3 py-2
                          text-sm text-amber-100 placeholder-zinc-600
                          focus:outline-none focus:border-amber-500
                          focus:ring-1 focus:ring-amber-500/30"
                      />
                    ) : (
                      // Static display for valid fields
                      typeof displayValue === 'number' || typeof displayValue === 'boolean' ? (
                        <span className="text-blue-400">{String(displayValue)}</span>
                      ) : Array.isArray(displayValue) ? (
                        <span className="text-emerald-400">[{displayValue.map(v => `"${v}"`).join(', ')}]</span>
                      ) : (
                        <span>"{displayValue}"</span>
                      )
                    )}
                    
                    {/* Source Quote Display */}
                    {sourceQuote && !needsClarification && (
                      <div className="mt-1.5 text-[10px] text-zinc-500 font-sans italic whitespace-normal">
                        📎 "{sourceQuote}"
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Submit button for human review mode */}
        {isClarificationMode && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <button
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md font-medium text-sm
                bg-amber-500 text-amber-950
                hover:bg-amber-400
                transition-all duration-200 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Submit Clarification to Evidence Gate
            </button>
          </div>
        )}

        {/* Submitted confirmation */}
        {isResolved && (
          <div className="mt-4 pt-4 border-t border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Human clarification validated by Evidence Gate — data merged successfully.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
