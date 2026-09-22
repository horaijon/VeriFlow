import { useState } from 'react'

export default function FinalOutput({ data, fieldsNeedingReview = [], onHumanSubmit }) {
  const isReviewMode = fieldsNeedingReview.length > 0
  const [editedData, setEditedData] = useState(() => ({ ...data }))
  const [submitted, setSubmitted] = useState(false)

  function handleFieldChange(key, value) {
    setEditedData(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit() {
    setSubmitted(true)
    if (onHumanSubmit) {
      onHumanSubmit(editedData)
    }
  }

  const displayData = submitted ? editedData : data

  // Filter out source_quote fields from main display
  const mainFields = Object.entries(displayData).filter(([key]) => !key.endsWith('_source_quote'))

  // Determine colors based on mode
  const borderColor = submitted
    ? 'border-green-500/30'
    : isReviewMode
    ? 'border-amber-500/30'
    : 'border-green-500/30'
  const bgColor = submitted
    ? 'bg-green-500/5'
    : isReviewMode
    ? 'bg-amber-500/5'
    : 'bg-green-500/5'
  const shadowColor = submitted
    ? 'shadow-[0_0_24px_rgba(34,197,94,0.08)]'
    : isReviewMode
    ? 'shadow-[0_0_24px_rgba(245,158,11,0.08)]'
    : 'shadow-[0_0_24px_rgba(34,197,94,0.08)]'

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg overflow-hidden ${shadowColor}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${submitted ? 'border-green-500/20' : isReviewMode ? 'border-amber-500/20' : 'border-green-500/20'} flex items-center gap-2`}>
        {submitted ? (
          <>
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            <span className="text-xs font-bold font-mono text-green-300 tracking-widest">
              HUMAN-REVIEWED OUTPUT — READY FOR DATABASE
            </span>
          </>
        ) : isReviewMode ? (
          <>
            <svg className="w-4 h-4 text-amber-400 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span className="text-xs font-bold font-mono text-amber-300 tracking-widest">
              ACTION REQUIRED — FILL IN MISSING FIELDS
            </span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            <span className="text-xs font-bold font-mono text-green-300 tracking-widest">
              VALIDATED OUTPUT — READY FOR DATABASE
            </span>
          </>
        )}
      </div>

      {/* Data table */}
      <div className="p-4">
        <table className="w-full text-sm font-mono">
          <tbody>
            {mainFields.map(([key, value]) => {
              const needsReview = fieldsNeedingReview.includes(key) && !submitted
              const isEmpty = value === null || value === '' || (Array.isArray(value) && value.length === 0)
              const sourceQuote = displayData[`${key}_source_quote`]

              return (
                <tr key={key} className={`border-b border-[#1e1e2e] last:border-0 ${needsReview ? 'bg-amber-500/5' : ''}`}>
                  <td className="py-2 pr-4 text-[#555568] whitespace-nowrap align-top">
                    <div className="flex items-center gap-2">
                      {key}
                      {needsReview && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          NEEDS INPUT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 text-green-200 font-medium">
                    {needsReview && !submitted ? (
                      // Editable input for missing fields
                      key === 'is_paid' ? (
                        <select
                          value={editedData[key] === null ? '' : String(editedData[key])}
                          onChange={(e) => {
                            const v = e.target.value
                            handleFieldChange(key, v === '' ? null : v === 'true')
                          }}
                          className="w-full bg-[#0a0a0f] border border-amber-500/40 rounded px-3 py-1.5
                            text-sm text-amber-200 focus:outline-none focus:border-amber-400
                            focus:ring-1 focus:ring-amber-400/30"
                        >
                          <option value="">— Select —</option>
                          <option value="true">true (Paid)</option>
                          <option value="false">false (Unpaid)</option>
                        </select>
                      ) : (
                        <input
                          type={key === 'invoice_amount' ? 'number' : 'text'}
                          step={key === 'invoice_amount' ? '0.01' : undefined}
                          placeholder={
                            key === 'customer_name' ? 'e.g. John Doe'
                            : key === 'invoice_amount' ? 'e.g. 100.00'
                            : key === 'currency' ? 'e.g. USD'
                            : key === 'date' ? 'YYYY-MM-DD'
                            : key === 'line_items' ? 'Item 1, Item 2, Item 3'
                            : `Enter ${key}...`
                          }
                          value={
                            key === 'line_items'
                              ? (Array.isArray(editedData[key]) ? editedData[key].join(', ') : '')
                              : (editedData[key] ?? '')
                          }
                          onChange={(e) => {
                            const v = e.target.value
                            if (key === 'invoice_amount') {
                              handleFieldChange(key, v === '' ? null : parseFloat(v))
                            } else if (key === 'line_items') {
                              handleFieldChange(key, v.split(',').map(s => s.trim()).filter(Boolean))
                            } else {
                              handleFieldChange(key, v)
                            }
                          }}
                          className="w-full bg-[#0a0a0f] border border-amber-500/40 rounded px-3 py-1.5
                            text-sm text-amber-200 placeholder-amber-700
                            focus:outline-none focus:border-amber-400
                            focus:ring-1 focus:ring-amber-400/30"
                        />
                      )
                    ) : (
                      // Static display for valid fields
                      typeof value === 'number' || typeof value === 'boolean' ? (
                        <span className="text-cyan-300">{String(value)}</span>
                      ) : Array.isArray(value) ? (
                        <span className="text-emerald-300">[{value.map(v => `"${v}"`).join(', ')}]</span>
                      ) : (
                        <span>"{value}"</span>
                      )
                    )}
                    
                    {/* Source Quote Display */}
                    {sourceQuote && (
                      <div className="mt-1 text-[10px] text-amber-400/70 font-mono italic whitespace-normal">
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
        {isReviewMode && !submitted && (
          <div className="mt-4 pt-4 border-t border-[#1e1e2e]">
            <button
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm
                bg-gradient-to-r from-amber-600 to-amber-500 text-white
                hover:from-amber-500 hover:to-amber-400
                transition-all duration-200 active:scale-[0.98]
                shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Confirm & Submit to Database
            </button>
          </div>
        )}

        {/* Submitted confirmation */}
        {submitted && (
          <div className="mt-4 pt-4 border-t border-green-500/20">
            <div className="flex items-center gap-2 text-green-400 text-xs font-mono">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Human review complete — data submitted successfully.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
