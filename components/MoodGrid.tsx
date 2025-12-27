"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount, useReadContract } from "wagmi";
import { BASELOG_ABI, BASELOG_CONTRACT_ADDRESS, MOOD_OPTIONS, getDayIndex } from "@/lib/contract";

export function MoodGrid() {
  const { address } = useAccount();
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [pendingMood, setPendingMood] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch SVG from contract (optional, we'll use placeholder)
  const { data: svg, refetch: refetchSvg } = useReadContract({
    address: BASELOG_CONTRACT_ADDRESS,
    abi: BASELOG_ABI,
    functionName: "generateSVG",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      retry: false,
    },
  });

  // Generate placeholder SVG based on mood (dark theme optimized)
  const generatePlaceholderSVG = (moodValue: number): string => {
    const dayIndex = getDayIndex();
    const moodColor = MOOD_OPTIONS[moodValue]?.color || "#374151";
    
    let cells = "";
    const cols = 7;
    
    for (let i = 0; i < 365; i++) {
      const x = (i % cols) * 14;
      const y = Math.floor(i / cols) * 14;
      
      // Highlight today's cell with selected mood color, others are dark gray
      const color = i === dayIndex ? moodColor : "#374151";
      
      cells += `<rect x="${x}" y="${y}" width="12" height="12" fill="${color}" rx="2"/>`;
    }
    
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 750"><rect width="100%" height="100%" fill="#1e293b"/>${cells}</svg>`;
  };

  // Listen for transaction success event - AGGRESSIVE MODE
  useEffect(() => {
    const handleTransactionSuccess = (event: CustomEvent) => {
      console.log("MoodGrid received transaction success event:", event.detail);
      const moodValue = event.detail?.moodValue ?? null;
      
      if (moodValue !== null) {
        setPendingMood(moodValue);
        
        // IMMEDIATELY show placeholder grid
        const placeholderSVG = generatePlaceholderSVG(moodValue);
        setSvgContent(placeholderSVG);
        
        // Scroll to grid after a brief delay to ensure DOM is updated
        setTimeout(() => {
          if (gridRef.current) {
            gridRef.current.scrollIntoView({ 
              behavior: "smooth", 
              block: "start",
              inline: "nearest"
            });
          }
        }, 300);
        
        // Try to fetch real SVG in background (don't wait for it)
        setTimeout(() => {
          refetchSvg().catch(() => {
            // Keep placeholder if contract fails
          });
        }, 2000);
      }
    };

    window.addEventListener("moodTransactionSuccess", handleTransactionSuccess as EventListener);
    return () => {
      window.removeEventListener("moodTransactionSuccess", handleTransactionSuccess as EventListener);
    };
  }, [refetchSvg]);

  // Update SVG if contract returns data and scroll to grid
  useEffect(() => {
    if (svg && typeof svg === "string" && svg.trim().length > 0) {
      setSvgContent(svg);
      setPendingMood(null);
      
      // Scroll to grid when contract SVG is loaded
      setTimeout(() => {
        if (gridRef.current) {
          gridRef.current.scrollIntoView({ 
            behavior: "smooth", 
            block: "start",
            inline: "nearest"
          });
        }
      }, 200);
    }
  }, [svg]);

  if (!address) {
    return (
      <div className="relative backdrop-blur-xl bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 rounded-3xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-center text-white/60 text-sm md:text-base font-light tracking-wide">
            Connect your wallet to view your mood grid
          </p>
        </div>
      </div>
    );
  }

  // Show grid if we have SVG content
  if (svgContent) {
    return (
      <div 
        ref={gridRef} 
        className="relative backdrop-blur-xl bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl animate-fade-in"
        id="mood-grid-container"
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 rounded-3xl pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-light text-white/95 tracking-tight mb-1">
                Your Year in Pixels
              </h2>
              <p className="text-xs md:text-sm text-white/50 font-light">
                Track your daily mood journey
              </p>
            </div>
            {pendingMood !== null && (
              <div className="flex items-center gap-2 px-4 py-2 backdrop-blur-md bg-emerald-500/20 border border-emerald-400/30 rounded-full animate-slide-in-top">
                <span className="text-emerald-300 text-sm">✓</span>
                <span className="text-xs md:text-sm text-emerald-300/90 font-medium">Saved!</span>
              </div>
            )}
          </div>
          
          {/* Grid Container */}
          <div className="relative mb-6">
            <div className="flex justify-center overflow-x-auto pb-2 -mx-2 px-2">
              <div
                className="mood-grid-svg rounded-2xl overflow-hidden backdrop-blur-sm bg-slate-800/30 p-4 border border-white/5"
                dangerouslySetInnerHTML={{ __html: svgContent }}
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  filter: "drop-shadow(0 4px 16px rgba(0, 0, 0, 0.3))",
                }}
              />
            </div>
          </div>
          
          {/* Footer Text */}
          <p className="text-xs md:text-sm text-center text-white/50 font-light tracking-wide">
            Each square represents a day. Log your mood daily to build your on-chain journal.
          </p>
        </div>
      </div>
    );
  }

  // No grid content yet
  return (
    <div className="relative backdrop-blur-xl bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 rounded-3xl pointer-events-none" />
      <div className="relative z-10">
        <p className="text-center text-white/60 text-sm md:text-base font-light tracking-wide">
          Log your first mood to mint your BaseLog NFT and see your grid!
        </p>
      </div>
    </div>
  );
}
