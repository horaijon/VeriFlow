import * as React from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "../lib/utils";
import { Button } from "./ui/button";

const ENTER =
  "animate-in fade-in slide-in-from-bottom-4 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] fill-mode-both motion-reduce:animate-none";

const stagger = (index, step = 60) => ({
  animationDelay: `${index * step}ms`,
});

const BrandMark = ({ className }) => {
  return (
    <div className={cn("bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30", className)}>
      <svg className="w-[60%] h-[60%] text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    </div>
  );
};

const jitter = (i) => {
  const value = Math.sin(i + 1) * 10_000;
  return value - Math.floor(value);
};

const FloatingPaths = ({ position }) => {
  const reduceMotion = useReducedMotion();
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full text-blue-500"
        fill="none"
        viewBox="0 0 696 316"
      >
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            initial={{ pathLength: 0.3 }}
            animate={
              reduceMotion
                ? undefined
                : { pathLength: 1, pathOffset: [0, 1, 0] }
            }
            stroke="currentColor"
            className="opacity-60"
            strokeOpacity={0.1 + path.id * 0.03}
            strokeWidth={path.width}
            transition={{
              duration: 20 + jitter(path.id) * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
};

const Login = ({ onLogin }) => {
  const [email, setEmail] = React.useState('')
  const [otp, setOtp] = React.useState('')
  const [step, setStep] = React.useState(1) // 1 = Email, 2 = OTP
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)

  const API_URL = 'http://localhost:8000'

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (!res.ok) throw new Error('Failed to request OTP')
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })
      
      if (!res.ok) throw new Error('Invalid or expired OTP')
      
      const data = await res.json()
      onLogin(data.access_token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      data-slot="login"
      className="relative min-h-svh overflow-hidden bg-[#0a0a0f] lg:grid lg:grid-cols-2 font-mono"
    >
      <aside
        data-slot="login-aside"
        className="relative hidden h-full flex-col overflow-hidden border-e border-[#2a2a3a] bg-[#111118] p-10 lg:flex"
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, transparent, transparent, #0a0a0f)",
          }}
        />

        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        <div className={cn(ENTER, "relative z-10 flex items-center gap-2")}>
          <BrandMark className="size-8" />
          <span className="text-base font-bold tracking-widest text-[#e4e4ef]">
            VERIFLOW
          </span>
        </div>

        <figure
          style={stagger(4)}
          className={cn(ENTER, "relative z-10 mt-auto flex flex-col gap-3")}
        >
          <blockquote className="font-serif text-2xl leading-[1.25] tracking-tight md:text-3xl text-[#e4e4ef]">
            We swapped out our legacy parsers and{" "}
            <span className="italic text-blue-400">never looked back</span>.
            Dynamic schemas adapt instantly to anything we throw at them.
          </blockquote>
          <figcaption className="flex items-center gap-2 text-xs uppercase text-[#8888a0]">
            <span>Data Engineering Team</span>
            <span aria-hidden className="text-[#2a2a3a]">
              |
            </span>
            <span>GlobalHealth Corp</span>
          </figcaption>
        </figure>
      </aside>

      <div
        data-slot="login-main"
        className="relative flex min-h-svh flex-col justify-center px-8 lg:min-h-0"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-60"
        >
          <div
            className="absolute end-0 top-0 h-320 w-140 -translate-y-88 rounded-full"
            style={{
              background:
                "radial-gradient(68.54% 68.72% at 55.02% 31.46%, rgba(228,228,239,0.06) 0, rgba(228,228,239,0.02) 50%, rgba(228,228,239,0.01) 80%, transparent 100%)",
            }}
          />
          <div
            className="absolute end-0 top-0 h-320 w-60 translate-x-[5%] -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(228,228,239,0.04) 0, rgba(228,228,239,0.01) 80%, transparent 100%)",
            }}
          />
        </div>

        <div
          data-slot="login-panel"
          className="relative z-10 mx-auto w-full space-y-6 sm:max-w-sm"
        >
          <div className={cn(ENTER, "flex items-center gap-2 lg:hidden mb-8")}>
            <BrandMark className="size-8" />
            <span className="text-base font-bold tracking-widest text-[#e4e4ef]">
              VERIFLOW
            </span>
          </div>

          <div data-slot="login-header" className="flex flex-col gap-2">
            <h1
              style={stagger(1)}
              className={cn(
                ENTER,
                "font-serif text-3xl font-medium tracking-tight sm:text-4xl text-[#e4e4ef]",
              )}
            >
              {step === 1 ? "Sign in or join." : "Check your email."}
            </h1>
            <p
              style={stagger(2)}
              className={cn(ENTER, "text-sm text-[#8888a0]")}
            >
              {step === 1
                ? "Passwordless authentication. Enter your email to receive a secure OTP."
                : `We've sent a 6-digit code to ${email}.`}
            </p>
          </div>

          {error && (
            <div style={stagger(2.5)} className={cn(ENTER, "p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 text-center")}>
              {error}
            </div>
          )}

          <div style={stagger(3)} className={ENTER}>
            {step === 1 ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#111118] border border-[#2a2a3a] rounded-lg px-4 py-3 text-sm text-[#e4e4ef] placeholder-[#555568] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
                <Button type="submit" size="lg" disabled={loading} className="w-full gap-2 font-mono tracking-wide">
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Send OTP
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-[#111118] border border-[#2a2a3a] rounded-lg px-4 py-3 text-center tracking-[0.5em] text-lg font-bold text-[#e4e4ef] placeholder-[#555568] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
                <Button type="submit" size="lg" disabled={loading} className="w-full gap-2 font-mono tracking-wide">
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Verify & Login
                </Button>
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); }}
                  className="w-full mt-2 text-[#8888a0] hover:text-[#e4e4ef] text-xs transition-colors"
                >
                  &larr; Back to Email
                </button>
              </form>
            )}
          </div>

          <p
            style={stagger(4)}
            className={cn(ENTER, "text-xs text-[#555568]")}
          >
            By continuing, you agree to the{" "}
            <a
              href="#"
              className="text-[#8888a0] underline-offset-4 hover:underline"
            >
              terms
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-[#8888a0] underline-offset-4 hover:underline"
            >
              privacy policy
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
};

export default Login;
