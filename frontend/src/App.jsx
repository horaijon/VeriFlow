import { useState, useEffect } from 'react'
import Header from './components/Header'
import InputPanel from './components/InputPanel'
import ExecutionTimeline from './components/ExecutionTimeline'
import StatusBanner from './components/StatusBanner'
import RetryCounter from './components/RetryCounter'
import Login from './components/Login'
import AuroraBackground from './components/ui/aurora-background'

const API_URL = 'http://localhost:8000'

const USE_CASE_DEMOS = {
  invoice: [
    { label: 'Sabotage Demo', text: 'Client: John Doe. Amount: One hundred dollars. Date: Tomorrow.' },
    { label: 'Clean Invoice', text: 'Invoice for customer Jane Smith, total amount 2499.99, dated 2026-09-15.' },
  ],
  hr_resume: [
    { label: 'Casual Resume', text: 'My name is Sarah Chen, email sarah.chen@gmail.com. I have about 5 years working in Python, React, and AWS. Got my Masters from MIT. Looking for around 150k.' },
    { label: 'Messy LinkedIn', text: 'hi im jake martinez (jake.m@outlook.com), been coding for like 3 yrs mostly javascript and node, got a bachelors from state uni, salary flexible' },
  ],
  clinical_note: [
    { label: 'Diabetes Patient', text: 'Pt: Mary Johnson, 67yo female. Dx: Type 2 diabetes with peripheral neuropathy. Currently on Metformin 500mg bid and Gabapentin 300mg tid. Needs follow-up in 2 weeks. Non-urgent.' },
    { label: 'ER Note', text: 'Patient John Kim age 34. Acute appendicitis confirmed by CT. Started on IV ceftriaxone. Surgery scheduled for tomorrow morning. URGENT.' },
  ],
  legal_contract: [
    { label: 'Service Agreement', text: 'This Service Agreement is entered into between Acme Corp and TechServ LLC, effective March 1, 2025, terminating December 31, 2025. Total contract value is $240,000. Governed by the laws of Delaware.' },
    { label: 'NDA', text: 'Non-Disclosure Agreement between GlobalTech Inc (Disclosing Party) and Sarah Williams (Receiving Party). Effective immediately, valid for 24 months. Estimated IP value: $50,000. Subject to California law.' },
  ],
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  
  const [useCase, setUseCase] = useState('invoice')
  const [availableUseCases, setAvailableUseCases] = useState([])
  const [schema, setSchema] = useState(null)

  const [inputText, setInputText] = useState(USE_CASE_DEMOS['invoice'][0].text)
  const [result, setResult] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [activeStep, setActiveStep] = useState(-1) // for animated reveal

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  // Fetch available use cases on mount
  useEffect(() => {
    if (!token) return
    fetch(`${API_URL}/use-cases`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) { handleLogout(); throw new Error('Unauthorized'); }
        return res.json();
      })
      .then(data => setAvailableUseCases(data))
      .catch(err => console.error('Failed to fetch use cases:', err))
  }, [token])

  // Fetch schema and update text on useCase change
  useEffect(() => {
    if (!useCase || !token) return

    fetch(`${API_URL}/schema/${useCase}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) { handleLogout(); throw new Error('Unauthorized'); }
        return res.json();
      })
      .then(data => setSchema(data))
      .catch(err => console.error('Failed to fetch schema:', err))
    
    if (USE_CASE_DEMOS[useCase]) {
      setInputText(USE_CASE_DEMOS[useCase][0].text)
    }
  }, [useCase, token])

  const [isCustomSchema, setIsCustomSchema] = useState(false)
  const [customSchema, setCustomSchema] = useState([
    { name: 'example_field', type: 'str', description: 'Description of field', required: true }
  ])

  async function handleSubmit() {
    if (!inputText.trim() || isProcessing) return

    setIsProcessing(true)
    setResult(null)
    setError(null)
    setActiveStep(0)

    try {
      const payload = {
        raw_text: inputText,
        use_case: useCase,
      }
      if (isCustomSchema) {
        payload.custom_schema = customSchema
      }

      const response = await fetch(`${API_URL}/process-data`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout()
          throw new Error('Session expired, please log in again')
        }
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || `Server error: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)

      // Animate timeline steps one by one
      for (let i = 0; i < data.attempts.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 600))
        setActiveStep(i + 1)
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to backend')
    } finally {
      setIsProcessing(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError(null)
    setActiveStep(-1)
    setIsProcessing(false)
  }

  const demoInputs = USE_CASE_DEMOS[useCase] || []

  if (!token) {
    return (
      <>
        <AuroraBackground />
        <Login onLogin={(newToken) => {
          localStorage.setItem('token', newToken)
          setToken(newToken)
        }} />
      </>
    )
  }

  const handleResolve = async (userInputs) => {
    try {
      setIsProcessing(true);
      
      const payload = { 
        use_case: useCase,
        partial_data: result.partial_data,
        user_inputs: userInputs 
      }
      if (isCustomSchema) {
        payload.custom_schema = customSchema
      }

      const response = await fetch(`${API_URL}/resolve-clarification`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
          throw new Error('Session expired, please log in again');
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }

      const resolution = await response.json();
      if (resolution.status === "resolved") {
        setResult(prev => ({
          ...prev,
          status: "resolved",
          final_output: resolution.final_data
        }));
      } else {
        const msgs = resolution.errors ? resolution.errors.map(e => `${e.loc[0]}: ${e.msg}`).join(' | ') : "Invalid fields";
        setError(`Still missing or invalid fields: ${msgs}`);
      }
    } catch (err) {
      setError(err.message || "Failed to resolve clarification");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <AuroraBackground />
      <div className="min-h-screen flex flex-col relative z-10">
        <Header onLogout={handleLogout} />

        <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Retry Counter + Status — top bar */}
          {(result || isProcessing) && (
            <div className="mb-6 animate-fade-in-up">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <RetryCounter
                  current={result?.total_attempts || (isProcessing ? 1 : 0)}
                  max={result?.max_retries || 3}
                  isProcessing={isProcessing}
                  attempts={result?.attempts || []}
                />
                <StatusBanner status={result?.status} isProcessing={isProcessing} />
              </div>
            </div>
          )}

          {/* Main 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
            {/* LEFT: Input Panel */}
            <InputPanel
              inputText={inputText}
              setInputText={setInputText}
              demoInputs={demoInputs}
              onSubmit={handleSubmit}
              onReset={handleReset}
              isProcessing={isProcessing}
              hasResult={!!result}
              useCase={useCase}
              setUseCase={setUseCase}
              availableUseCases={availableUseCases}
              schema={schema}
              isCustomSchema={isCustomSchema}
              setIsCustomSchema={setIsCustomSchema}
              customSchema={customSchema}
              setCustomSchema={setCustomSchema}
            />

            <ExecutionTimeline
              result={result}
              isProcessing={isProcessing}
              error={error}
              activeStep={activeStep}
              onResolve={handleResolve}
            />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-800 py-4 text-center">
          <p className="text-xs text-zinc-500 font-medium">
            VeriFlow &middot; Self-Healing Agentic Pipeline &middot; Evidence Gate v1.0
          </p>
        </footer>
      </div>
    </>
  )
}
