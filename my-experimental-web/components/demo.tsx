"use client"

import * as React from "react"
import OldMastersPreloader, { OldMastersTone } from "@/components/ui/old-masters-preloader"
import { Sparkles, Compass, Layers, ArrowUpRight, RotateCcw, Palette } from "lucide-react"

// URL Gambar Patung Unsplash
const APOLLO_UNSPLASH = "https://images.unsplash.com/photo-1574359587026-daf1bfd26baa?q=80&w=1600&auto=format&fit=crop"
const HERCULES_UNSPLASH = "https://images.unsplash.com/photo-1567522874215-d5e2f1bee83d?q=80&w=1600&auto=format&fit=crop"
const FLOWERS_UNSPLASH = "https://images.unsplash.com/photo-1662808141421-54240cbfd45f?q=80&w=1600&auto=format&fit=crop"
const DAVID_BACKDROP = "https://images.unsplash.com/photo-1601887389937-0b02c26b602c?q=80&w=1600&auto=format&fit=crop"

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
      wordmark="Awigya"
      scriptInitial={true}
      tagline="Crawla ~ Zora."
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
      {/* Konten Halaman Utama Setelah Preloader Selesai */}
      <main className="min-h-screen bg-[#0e0c0a] text-[#efe6d6] p-12">
        <h1 className="text-4xl font-serif">Terimakasih Crawla, Kamu Artist Sepanjang masa!.</h1>
      </main>
    </OldMastersPreloader>
  )
}