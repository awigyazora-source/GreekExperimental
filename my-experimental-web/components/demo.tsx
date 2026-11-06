"use client"

import * as React from "react"
import OldMastersPreloader, { OldMastersTone } from "@/components/ui/old-masters-preloader"
import { Sparkles, Compass, Layers, ArrowUpRight, RotateCcw, Palette, Target } from "lucide-react"

// URL Gambar Patung Unsplash
const APOLLO_UNSPLASH = "https://images.unsplash.com/photo-1574359587026-daf1bfd26baa?q=80&w=1600&auto=format&fit=crop"
const HERCULES_UNSPLASH = "https://images.unsplash.com/photo-1567522874215-d5e2f1bee83d?q=80&w=1600&auto=format&fit=crop"
const FLOWERS_UNSPLASH = "https://images.unsplash.com/photo-1662808141421-54240cbfd45f?q=80&w=1600&auto=format&fit=crop"
const DAVID_BACKDROP = "https://images.unsplash.com/photo-1601887389937-0b02c26b602c?q=80&w=1600&auto=format&fit=crop"

// --- KOMPONEN MINI-GAME: DBD SKILL CHECK SIMULATOR ---
function SkillCheckGame() {
  const CIRCUMFERENCE = 2 * Math.PI * 46

  // States
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [score, setScore] = React.useState(0)
  const [streak, setStreak] = React.useState(0)
  const [bestStreak, setBestStreak] = React.useState(0)
  const [statusMsg, setStatusMsg] = React.useState("")
  
  // Game Settings
  const [mode, setMode] = React.useState("normal")
  const [baseSpeed, setBaseSpeed] = React.useState(6)
  const [hardcore, setHardcore] = React.useState(false)
  const [circleSize, setCircleSize] = React.useState(320)

  // Mutable Game Engine State
  const engine = React.useRef({
    angle: 0,
    pingpongDir: 1,
    shrinkHits: 0,
    canHit: false,
    targetStart: 0,
    targetWidthThick: 45,
    targetWidthThin: 6,
    lastFrame: 0,
    rafId: 0 as number,
    missTimer: null as NodeJS.Timeout | null,
    feedbackTimer: null as NodeJS.Timeout | null,
  })

  // Refs for direct DOM manipulation (Performance optimization over React State for 60fps)
  const needleRef = React.useRef<HTMLDivElement>(null)
  const statusRef = React.useRef<HTMLDivElement>(null)
  const gameAreaRef = React.useRef<HTMLDivElement>(null)

  const getDirection = React.useCallback(() => {
    return mode === "pingpong" ? engine.current.pingpongDir : 1
  }, [mode])

  const getZoneWidths = React.useCallback(() => {
    let thick = hardcore ? 25 : 45
    let thin = hardcore ? 3.5 : 6
    if (mode === "shrink") {
      const factor = Math.max(0.28, 1 - engine.current.shrinkHits * 0.075)
      thick *= factor
      thin = Math.max(1.5, thin * factor)
    }
    return { thick, thin }
  }, [mode, hardcore])

  const generateTarget = React.useCallback(() => {
    const dir = getDirection()
    const { thick, thin } = getZoneWidths()
    engine.current.targetWidthThick = thick
    engine.current.targetWidthThin = thin
    engine.current.targetStart = (engine.current.angle + dir * (95 + Math.random() * 150) + 360) % 360
    engine.current.canHit = true
    if (engine.current.missTimer) clearTimeout(engine.current.missTimer)
  }, [getDirection, getZoneWidths])

  const showFeedback = (result: string) => {
    if (engine.current.feedbackTimer) clearTimeout(engine.current.feedbackTimer)
    setStatusMsg(result)
    
    if (statusRef.current) {
      statusRef.current.style.color = result === "PERFECT" ? "#63ff7d" : result === "GOOD" ? "#d1d5db" : "#ff2a2a"
      statusRef.current.style.textShadow = result === "PERFECT" ? "0 0 20px #fff" : result === "MISS" ? "0 0 15px red" : "0 2px 5px #000"
      statusRef.current.style.animation = "none"
      void statusRef.current.offsetWidth // Trigger reflow
      statusRef.current.style.animation = "dbd-pop 0.4s ease-out forwards"
      
      engine.current.feedbackTimer = setTimeout(() => {
        if (statusRef.current) {
          statusRef.current.style.animation = "none"
          statusRef.current.style.opacity = "0"
        }
      }, 650)
    }
  }

  const angularDistance = (a: number, b: number) => (a - b + 360) % 360

  const evaluateHit = () => {
    const dir = getDirection()
    const diff = dir === 1 
      ? angularDistance(engine.current.angle, engine.current.targetStart) 
      : angularDistance(engine.current.targetStart, engine.current.angle)
    
    if (diff >= 358.5 || diff <= engine.current.targetWidthThin) return "PERFECT"
    if (diff <= engine.current.targetWidthThick) return "GOOD"
    return "MISS"
  }

  const handleHit = React.useCallback(() => {
    if (!isPlaying || !engine.current.canHit) return
    engine.current.canHit = false
    if (engine.current.missTimer) clearTimeout(engine.current.missTimer)

    const result = evaluateHit()
    showFeedback(result)

    if (result === "PERFECT") {
      setScore(s => s + 1)
      setStreak(s => { const newS = s + 1; setBestStreak(b => Math.max(b, newS)); return newS })
      if (mode === "pingpong") engine.current.pingpongDir *= -1
    } else if (result === "GOOD") {
      setScore(s => s + 1)
      setStreak(0)
      if (mode === "pingpong") engine.current.pingpongDir *= -1
    } else {
      setScore(0)
      setStreak(0)
      engine.current.pingpongDir = 1
      if (gameAreaRef.current) {
        gameAreaRef.current.classList.remove("shake")
        void gameAreaRef.current.offsetWidth
        gameAreaRef.current.classList.add("shake")
      }
    }

    if (mode === "shrink" && result !== "MISS") engine.current.shrinkHits++
    
    engine.current.missTimer = setTimeout(() => {
      if (isPlaying) generateTarget()
    }, 120)
  }, [isPlaying, mode, generateTarget])

  // Core Game Loop
  React.useEffect(() => {
    if (!isPlaying) return

    const tick = (timestamp: number) => {
      if (!engine.current.lastFrame) engine.current.lastFrame = timestamp
      const delta = Math.min((timestamp - engine.current.lastFrame) / 16.6667, 3)
      engine.current.lastFrame = timestamp
      
      const speed = baseSpeed + Math.min(streak * 0.2, 4) + (hardcore ? 2 : 0)
      engine.current.angle = (engine.current.angle + getDirection() * speed * delta + 360) % 360
      
      if (needleRef.current) {
        needleRef.current.style.transform = `rotate(${engine.current.angle}deg)`
      }

      // Auto Miss Check
      if (engine.current.canHit) {
        const dir = getDirection()
        const diff = dir === 1 
          ? angularDistance(engine.current.angle, engine.current.targetStart) 
          : angularDistance(engine.current.targetStart, engine.current.angle)
          
        if (diff > engine.current.targetWidthThick + 2) {
          if (diff > engine.current.targetWidthThick + 2 && diff < engine.current.targetWidthThick + 18) {
            engine.current.canHit = false
            showFeedback("MISS")
            setScore(0)
            setStreak(0)
            engine.current.pingpongDir = 1
            if (gameAreaRef.current) gameAreaRef.current.classList.add("shake")
            engine.current.missTimer = setTimeout(() => { if (isPlaying) generateTarget() }, 220)
          }
        }
      }

      engine.current.rafId = requestAnimationFrame(tick)
    }

    engine.current.rafId = requestAnimationFrame(tick)
    
    return () => {
      cancelAnimationFrame(engine.current.rafId)
    }
  }, [isPlaying, baseSpeed, streak, hardcore, getDirection, generateTarget])

  // Keyboard Support
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault()
        handleHit()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [handleHit])

  // Start/Stop Handler
  const toggleGame = (start: boolean) => {
    setIsPlaying(start)
    if (start) {
      engine.current.lastFrame = 0
      engine.current.pingpongDir = 1
      engine.current.shrinkHits = 0
      generateTarget()
    } else {
      if (engine.current.rafId) cancelAnimationFrame(engine.current.rafId)
      if (engine.current.missTimer) clearTimeout(engine.current.missTimer)
      engine.current.canHit = false
      if (statusRef.current) statusRef.current.style.opacity = "0"
    }
  }

  // Pre-calculate SVG Paths
  const dir = mode === "pingpong" && isPlaying ? engine.current.pingpongDir : 1
  const thickLen = (engine.current.targetWidthThick / 360) * CIRCUMFERENCE
  const thinLen = (engine.current.targetWidthThin / 360) * CIRCUMFERENCE
  const thickStart = dir === 1 ? engine.current.targetStart : engine.current.targetStart - engine.current.targetWidthThick
  const thinStart = dir === 1 ? engine.current.targetStart : engine.current.targetStart - engine.current.targetWidthThin

  return (
    <div className="w-full max-w-2xl mx-auto font-sans bg-[#14161c]/90 border border-white/10 rounded-xl shadow-2xl p-6 relative overflow-hidden text-[#f0f0f0]">
      {/* CSS Injections for Keyframes */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dbd-pop {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 1px); }
          40% { transform: translate(2px, -1px); }
          60% { transform: translate(-1px, 2px); }
          80% { transform: translate(1px, -2px); }
        }
        .shake { animation: shake 0.25s ease; }
      `}}/>

      {/* Scoreboard */}
      <div className="flex justify-center gap-6 mb-8 text-center" aria-live="polite">
        <div className="flex-1">
          <h3 className="text-[11px] text-[#858b98] tracking-[2px] mb-1">SCORE</h3>
          <p className="text-3xl font-extrabold">{score}</p>
        </div>
        <div className="flex-1">
          <h3 className="text-[11px] text-[#858b98] tracking-[2px] mb-1">STREAK</h3>
          <p className={`text-3xl font-extrabold ${streak >= 5 ? "text-[#ff2a2a]" : "text-[#fbbf24]"}`}>{streak}</p>
        </div>
        <div className="flex-1">
          <h3 className="text-[11px] text-[#858b98] tracking-[2px] mb-1">BEST</h3>
          <p className="text-3xl font-extrabold">{bestStreak}</p>
        </div>
      </div>

      {/* Game Area */}
      <div className="w-full flex justify-center items-center min-h-[220px] mb-8">
        <div 
          ref={gameAreaRef}
          onPointerDown={(e) => { e.preventDefault(); handleHit() }}
          className="relative cursor-crosshair touch-manipulation drop-shadow-[0_0_25px_rgba(0,0,0,0.8)]"
          style={{ width: circleSize, height: circleSize, maxWidth: '80vw', maxHeight: '80vw', aspectRatio: '1' }}
        >
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-white/20 bg-black/20" />
          
          {/* SVG Targets */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
            {engine.current.canHit && (
              <>
                <circle 
                  cx="50" cy="50" r="46" 
                  fill="none" stroke="rgba(200,200,200,0.78)" strokeWidth="18"
                  strokeDasharray={`${thickLen} ${CIRCUMFERENCE}`}
                  transform={`rotate(${thickStart} 50 50)`}
                />
                <circle 
                  cx="50" cy="50" r="46" 
                  fill="none" stroke="#63ff7d" strokeWidth="18"
                  strokeDasharray={`${thinLen} ${CIRCUMFERENCE}`}
                  transform={`rotate(${thinStart} 50 50)`}
                  style={{ filter: "drop-shadow(0 0 3px rgba(99,255,125,0.5))" }}
                />
              </>
            )}
          </svg>

          {/* Needle & Pivot */}
          <div 
            ref={needleRef}
            className="absolute left-[calc(50%-1.5px)] bottom-1/2 w-[3px] h-1/2 bg-[#ff2a2a] origin-bottom rounded-sm z-10"
            style={{ boxShadow: "0 0 8px #ff2a2a, 0 0 15px #ff2a2a", transform: `rotate(${engine.current.angle}deg)` }}
          />
          <div className="absolute left-[calc(50%-7px)] top-[calc(50%-7px)] w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,0,0,0.3)] z-20" />

          {/* Feedback Text */}
          <div 
            ref={statusRef}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black tracking-[4px] opacity-0 z-30 pointer-events-none whitespace-nowrap"
            style={{ fontSize: "clamp(22px, 4vw, 32px)" }}
          >
            {statusMsg}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 bg-[#0d0f12] p-5 rounded-lg border border-white/5">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold tracking-widest text-[#aaa] w-24 shrink-0">MODE</label>
          <select 
            disabled={isPlaying}
            value={mode}
            onChange={(e) => { setMode(e.target.value); engine.current.shrinkHits = 0; generateTarget() }}
            className="flex-1 p-2.5 bg-[#252a35] text-white border border-white/10 rounded-md text-sm outline-none disabled:opacity-50"
          >
            <option value="normal">NORMAL — 1 TARGET</option>
            <option value="pingpong">PINGPONG — BOLAK-BALIK</option>
            <option value="shrink">SHRINK — TARGET MENYUSUT</option>
          </select>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold tracking-widest text-[#aaa] w-24 shrink-0">UKURAN</label>
          <input 
            type="range" min="200" max="500" 
            disabled={isPlaying}
            value={circleSize} 
            onChange={(e) => setCircleSize(Number(e.target.value))}
            className="flex-1 accent-[#ff2a2a]"
          />
          <span className="w-12 text-right font-mono text-sm text-[#fbbf24]">{(circleSize/320).toFixed(1)}x</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold tracking-widest text-[#aaa] w-24 shrink-0">SPEED</label>
          <input 
            type="range" min="2" max="15" 
            disabled={isPlaying}
            value={baseSpeed} 
            onChange={(e) => setBaseSpeed(Number(e.target.value))}
            className="flex-1 accent-[#ff2a2a]"
          />
          <span className="w-12 text-right font-mono text-sm text-[#fbbf24]">{baseSpeed}</span>
        </div>

        <label className="flex items-center justify-center gap-2 cursor-pointer mt-2">
          <input 
            type="checkbox" 
            disabled={isPlaying}
            checked={hardcore}
            onChange={(e) => setHardcore(e.target.checked)}
            className="w-4 h-4 accent-[#ff2a2a]"
          />
          <span className="text-sm font-extrabold tracking-widest text-[#ff2a2a]">PRO / HARDCORE MODE</span>
        </label>

        <div className="flex gap-3 mt-2">
          <button 
            onClick={() => toggleGame(true)}
            disabled={isPlaying}
            className="flex-1 bg-[#a71919] text-white py-3 rounded-md font-black tracking-widest shadow-[0_0_14px_rgba(255,42,42,0.2)] disabled:opacity-30 hover:brightness-110 active:scale-95 transition-all"
          >
            START
          </button>
          <button 
            onClick={() => toggleGame(false)}
            disabled={!isPlaying}
            className="flex-1 bg-[#343a46] text-white py-3 rounded-md font-black tracking-widest disabled:opacity-30 hover:brightness-110 active:scale-95 transition-all"
          >
            STOP
          </button>
        </div>
        
        <p className="text-center text-xs text-[#999] font-bold mt-2 tracking-wide">
          KLIK LINGKARAN ATAU TEKAN SPASI UNTUK HIT
        </p>
      </div>
    </div>
  )
}

// --- KOMPONEN UTAMA PAGE DEMO ---
export default function Demo() {
  const [tone, setTone] = React.useState<OldMastersTone>("carmine")
  const [mountKey, setMountKey] = React.useState(0)

  const replayPreloader = (newTone?: OldMastersTone) => {
    if (newTone) setTone(newTone)
    setMountKey((prev) => prev + 1)
  }

  return (
    <OldMastersPreloader
      key={mountKey}
      tone={tone}
      wordmark="Arcadia"
      scriptInitial={true}
      tagline="Your craft. Your name. Your rules."
      eyebrow="Experimental Web · MMXXVI"
      brand="A."
      figures={[
        { src: APOLLO_UNSPLASH, alt: "The Apollo Belvedere", x: 58, y: 100, h: 84, depth: 1 },
        { src: HERCULES_UNSPLASH, alt: "The torso of a marble Hercules", x: 24, y: 103, h: 90, depth: 1.25 },
        { src: FLOWERS_UNSPLASH, alt: "A marble figure holding flowers", x: 88, y: 100, h: 100, depth: 0.75, flip: true, phone: false },
      ]}
      backdrop={DAVID_BACKDROP}
      cta={{ label: "Enter Atelier" }}
    >
      <main className="min-h-screen bg-[#0e0c0a] text-[#efe6d6] selection:bg-[#d9b25c] selection:text-[#050403]">
        <header className="border-b border-[#4a4336]/40 px-6 py-5 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#d9b25c]" />
            <span className="font-serif italic text-xl tracking-wide">Arcadia Experimental Lab</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 border border-[#4a4336]/60 rounded-full p-1 text-xs uppercase tracking-widest">
              <Palette className="w-3.5 h-3.5 ml-2 mr-1 text-[#9a917f]" />
              {(["carmine", "noir", "vellum"] as OldMastersTone[]).map((t) => (
                <button
                  key={t}
                  onClick={() => replayPreloader(t)}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    tone === t ? "bg-[#d9b25c] text-[#050403] font-medium" : "text-[#9a917f] hover:text-[#efe6d6]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={() => replayPreloader()}
              className="flex items-center gap-2 border border-[#4a4336] hover:border-[#d9b25c] px-4 py-2 text-xs uppercase tracking-widest transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Replay Stage
            </button>
          </div>
        </header>

        <section className="max-w-6xl mx-auto px-6 py-20 md:py-32">
          <div className="flex items-center gap-4 mb-8">
            <Target className="w-8 h-8 text-[#ff2a2a]" />
            <h2 className="text-4xl md:text-5xl font-serif font-normal leading-tight">
              Skill Check Simulator
            </h2>
          </div>
          <p className="text-[#9a917f] max-w-2xl mb-16 leading-relaxed">
            Ini adalah area eksperimental mini-game yang langsung tertanam di dalam aplikasi Next.js. Game ini menggunakan <span className="text-white">requestAnimationFrame</span> dan <span className="text-white">SVG transform</span> murni tanpa memberatkan React state cycle.
          </p>

          {/* KOMPONEN GAME DIRENDER DI SINI */}
          <SkillCheckGame />

        </section>
      </main>
    </OldMastersPreloader>
  )
}