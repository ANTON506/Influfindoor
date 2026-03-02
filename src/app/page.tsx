"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen grid-bg text-foreground relative overflow-hidden flex flex-col">
      {/* Dynamic Grid Overlay & Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90 pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full p-8 flex justify-between items-start z-10 relative">
        <div className="flex flex-col">
          <h1 className="font-pixel text-3xl tracking-wider hover:text-primary transition-colors cursor-pointer">
            INFLU<br />FINDOOR
          </h1>
          <p className="font-pixel text-xs mt-4 text-muted-foreground w-48 uppercase leading-snug">
            The marketplace bridging <br />
            the gap between brands <br />
            and creators.
          </p>
        </div>

        <div className="hidden md:flex gap-16 text-sm font-pixel tracking-widest uppercase">
          <div className="flex flex-col gap-2">
            <span className="text-primary mb-2">■ PLATFORM</span>
            <Link href="/login" className="hover:text-primary transition-colors">For Brands</Link>
            <Link href="/register" className="hover:text-primary transition-colors">For Creators</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground mb-2">SERVICES</span>
            <span className="opacity-70">Campaigns</span>
            <span className="opacity-70">Escrow Payments</span>
            <span className="opacity-70">Content Review</span>
          </div>
          <div className="flex flex-col gap-2">
            {isLoading ? null : user ? (
              <Link href={user.role === 'COMPANY' ? '/company/dashboard' : '/influencer/dashboard'} className="text-primary hover:text-white transition-colors">
                ENTER DASHBOARD
              </Link>
            ) : (
              <Link href="/login" className="hover:text-primary transition-colors">LOGIN</Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Center Stage */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 h-full w-full">
        {/* Abstract central element simulating the red glow object */}
        <div className="relative group cursor-pointer mb-24">
          <div className="absolute inset-0 bg-primary opacity-20 blur-3xl group-hover:opacity-40 transition-opacity duration-700 rounded-full" />
          <div className="w-48 h-48 border-[1px] border-primary/30 flex items-center justify-center relative font-pixel text-8xl text-primary animate-pulse shadow-[0_0_60px_-15px_rgba(255,0,0,0.5)] bg-black/40 backdrop-blur-sm">
            [I]
          </div>
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 whitespace-nowrap">
            <Link href="/register" className="flex items-center justify-center gap-2 font-pixel text-[13px] tracking-widest text-black bg-primary hover:bg-primary/80 transition-colors px-6 py-2 border border-primary w-full">
              <Sparkles className="w-3 h-3 text-black" /> CREATE ACCOUNT
            </Link>
            <Link href="/login" className="flex items-center justify-center gap-2 font-pixel text-[13px] tracking-widest text-primary hover:text-white transition-colors bg-black/80 px-6 py-2 border border-primary/20 w-full">
              LOGIN
            </Link>
          </div>
        </div>
      </main>

      {/* Massive Bottom Text Area */}
      <footer className="w-full p-8 pb-12 flex flex-col justify-end z-10 relative mt-auto">
        <h2 className="font-pixel text-[4rem] sm:text-[6rem] lg:text-[8rem] leading-[0.85] uppercase max-w-5xl tracking-tight text-white/90 drop-shadow-2xl mix-blend-plus-lighter">
          WE BRING THE <br />
          UNEXPECTED <br />
          <span className="text-primary/90">TO CREATOR & <br /> BRAND EXPERIENCES</span>
        </h2>

        <div className="mt-16 flex justify-between items-end border-t border-border/40 pt-6">
          <p className="font-pixel text-xs text-muted-foreground">
            Open for campaigns, contracts or full-time... <Link href="/register" className="text-primary hover:underline">Create an account</Link>
          </p>
          <div className="hidden md:flex gap-4 opacity-50 font-pixel text-xs">
            <span>TRUSTED BY 100+ BRANDS</span>
            <span>•</span>
            <span>VERIFIED INFLUENCERS ONLY</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
