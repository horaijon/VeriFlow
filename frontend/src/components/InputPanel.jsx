export default function InputPanel({
  inputText,
  setInputText,
  demoInputs,
  onSubmit,
  onReset,
  isProcessing,
  hasResult,
  useCase,
  setUseCase,
  availableUseCases,
  schema,
  isCustomSchema,
  setIsCustomSchema,
  customSchema,
  setCustomSchema,
}) {
  const addField = () => {
    setCustomSchema([...customSchema, { name: '', type: 'str', description: '', required: true }])
  }

  const updateField = (index, key, value) => {
    const newSchema = [...customSchema]
    newSchema[index] = { ...newSchema[index], [key]: value }
    setCustomSchema(newSchema)
  }

  const removeField = (index) => {
    setCustomSchema(customSchema.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {/* Section label */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <h2 className="text-xs font-semibold text-zinc-400 tracking-widest uppercase">
          Unstructured Data Input
        </h2>
      </div>

      {/* Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Use Case Selector */}
        <div className="px-4 pt-4 pb-2 border-b border-zinc-800/50">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] text-zinc-500 font-medium tracking-wider uppercase">
              USE CASE
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Custom Schema</span>
              <button
                type="button"
                onClick={() => setIsCustomSchema(!isCustomSchema)}
                disabled={isProcessing}
                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                  isCustomSchema ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  isCustomSchema ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
          
          {!isCustomSchema && (
            <select
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              disabled={isProcessing}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm
                text-zinc-100 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {availableUseCases.map((uc) => (
                <option key={uc.id || uc} value={uc.id || uc}>
                  {uc.name || uc}
                </option>
              ))}
              {availableUseCases.length === 0 && (
                <option value="invoice">Invoice</option>
              )}
            </select>
          )}
        </div>

        {/* Quick-fill presets */}
        {!isCustomSchema && (
          <div className="px-4 pt-3 pb-2 border-b border-zinc-800/50">
            <p className="text-[10px] text-zinc-500 font-medium mb-2 tracking-wider uppercase">
              SABOTAGE PRESETS
            </p>
            <div className="flex flex-wrap gap-1.5">
              {demoInputs.map((demo, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(demo.text)}
                  disabled={isProcessing}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition-all duration-150
                    ${inputText === demo.text
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                    }
                    disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text area */}
        <div className="p-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
            placeholder="Paste messy, unstructured text here..."
            rows={6}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm
              text-zinc-100 placeholder-zinc-600 resize-none
              focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200"
          />
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex gap-3">
          <button
            onClick={onSubmit}
            disabled={isProcessing || !inputText.trim() || (isCustomSchema && customSchema.length === 0)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm
              bg-zinc-50 text-zinc-900 hover:bg-zinc-200
              disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed
              transition-all duration-200 active:scale-[0.98]"
          >
            {isProcessing ? (
              <>
                <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                Extract &amp; Validate
              </>
            )}
          </button>

          {hasResult && (
            <button
              onClick={onReset}
              className="px-4 py-3 rounded-lg text-sm font-medium
                bg-zinc-900 text-zinc-400 border border-zinc-800
                hover:border-zinc-700 hover:text-zinc-300
                transition-all duration-200"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Schema reference / Editor */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          <span className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase">
            TARGET SCHEMA {isCustomSchema && "(EDIT MODE)"}
          </span>
        </div>
        
        {isCustomSchema ? (
          <div className="space-y-3">
            {customSchema.map((field, index) => (
              <div key={index} className="flex flex-col gap-2 p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(index, 'name', e.target.value)}
                    placeholder="field_name"
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(index, 'type', e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 font-mono focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="str">str</option>
                    <option value="int">int</option>
                    <option value="float">float</option>
                    <option value="bool">bool</option>
                    <option value="list[str]">list[str]</option>
                    <option value="date">date</option>
                  </select>
                  <button
                    onClick={() => removeField(index)}
                    className="text-zinc-500 hover:text-red-400 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={field.description}
                    onChange={(e) => updateField(index, 'description', e.target.value)}
                    placeholder="Description / prompt instructions..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400 focus:border-emerald-500 focus:outline-none"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(index, 'required', e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20"
                    />
                    Required
                  </label>
                </div>
              </div>
            ))}
            <button
              onClick={addField}
              className="w-full py-2 border border-dashed border-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Field
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {schema ? (
              Object.entries(schema).map(([field, type]) => (
                <div key={field} className="flex justify-between text-[11px] font-mono">
                  <span className={field.endsWith('_source_quote') ? 'text-zinc-600' : 'text-zinc-300'}>
                    {field}
                  </span>
                  <span className="text-zinc-500">{type}</span>
                </div>
              ))
            ) : (
              <div className="text-[11px] text-zinc-500 font-mono">Loading schema...</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
