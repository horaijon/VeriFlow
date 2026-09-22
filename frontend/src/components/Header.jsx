export default function Header({ onLogout }) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <h1 className="text-zinc-50 font-bold text-sm tracking-widest uppercase">
              VERIFLOW
            </h1>
            <p className="text-[10px] text-zinc-500 font-medium tracking-widest mt-0.5 uppercase">
              SELF-HEALING DATA EXTRACTION
            </p>
          </div>
        </div>

        {/* Right: Logout & Status */}
        <div className="flex items-center gap-4">
          {onLogout && (
            <button 
              onClick={onLogout}
              className="text-[11px] font-medium text-zinc-400 hover:text-zinc-100 px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 rounded transition-colors"
            >
              LOGOUT
            </button>
          )}
          <div className="flex items-center gap-3 text-[11px] font-medium">
            <span className="text-zinc-500">PIPELINE v1.0</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span className="text-emerald-500 font-semibold tracking-wider">SYSTEM READY</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
