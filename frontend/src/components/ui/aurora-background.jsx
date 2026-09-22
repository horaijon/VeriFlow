"use client"
import React from "react"
import { motion } from "framer-motion"

const AuroraBackground = ({
  className = "",
  starCount = 50,
  gradientColors = [
    "var(--aurora-color1, rgba(59,130,246,0.15))",
    "var(--aurora-color2, rgba(6,182,212,0.15))",
  ],
  pulseDuration = 10,
  ariaLabel = "Animated aurora background",
}) => {
  const [colorA, colorB] = gradientColors

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={`fixed inset-0 w-screen h-screen overflow-hidden z-[-1] pointer-events-none ${className}`}
      style={{ backgroundColor: "var(--bg-deep, #09090b)" }}
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Pulsing radial gradients */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, ${colorA} 0%, transparent 60%),
              radial-gradient(circle at 80% 70%, ${colorB} 0%, transparent 60%)
            `,
            backgroundSize: "100% 100%",
            animation: `pulse ${pulseDuration}s infinite`,
          }}
        />

        {/* Blurred color blobs - Customized to BLUE SHADES */}
        <motion.div
          className="absolute inset-0 mix-blend-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-600/30 rounded-full filter blur-[100px]"
            animate={{
              x: [-50, 50, -50],
              y: [-20, 20, -20],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-600/30 rounded-full filter blur-[100px]"
            animate={{
              x: [50, -50, 50],
              y: [20, -20, 20],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 40,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-sky-600/20 rounded-full filter blur-[100px]"
            animate={{
              x: [20, -20, 20],
              y: [-30, 30, -30],
              rotate: [0, 360, 0],
            }}
            transition={{
              duration: 50,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Twinkling stars */}
        {Array.from({ length: starCount }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-blue-100 rounded-full"
            initial={{
              x: `${Math.random() * 100}vw`,
              y: `${Math.random() * 100}vh`,
              opacity: 0,
            }}
            animate={{
              opacity: [0, Math.random() * 0.8, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default AuroraBackground
