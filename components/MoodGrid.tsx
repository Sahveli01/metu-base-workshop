"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAccount } from "wagmi";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { MOOD_OPTIONS, getDayIndex, BASELOG_CONTRACT_ADDRESS } from "@/lib/contract";

interface DayData {
  date: string;
  color: string;
  emoji: string;
  moodValue: number | null;
}

export function MoodGrid() {
  const { address } = useAccount();
  const { context } = useMiniKit();
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [pendingMood, setPendingMood] = useState<number | null>(null);
  const [moodData, setMoodData] = useState<Map<number, DayData>>(new Map());
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Try to get address from MiniKit context if wagmi address is not available
  const effectiveAddress = address || context?.user?.custodyAddress;

  // Get today's index
  const todayIndex = useMemo(() => getDayIndex(), []);
  
  // Check if year is complete (must wait until end of year)
  const isYearComplete = useMemo(() => {
    const today = new Date();
    const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
    return today >= endOfYear;
  }, []);
  
  // Calculate days remaining until end of year
  const daysRemaining = useMemo(() => {
    const today = new Date();
    const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
    const diffTime = endOfYear.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, []);

  // Generate 365 days array with data
  const daysArray = useMemo(() => {
    const days: (DayData | null)[] = [];
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    
    for (let i = 0; i < 365; i++) {
      const currentDate = new Date(startOfYear);
      currentDate.setDate(startOfYear.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      const dayData = moodData.get(i);
      
      if (dayData) {
        days.push(dayData);
      } else {
        days.push({
          date: dateString,
          color: "#374151",
          emoji: "",
          moodValue: null,
        });
      }
    }
    
    return days;
  }, [moodData]);

  // Listen for transaction success
  useEffect(() => {
    const handleTransactionSuccess = (event: CustomEvent) => {
      const moodValue = event.detail?.moodValue ?? null;
      
      if (moodValue !== null) {
        setPendingMood(moodValue);
        const mood = MOOD_OPTIONS[moodValue];
        
        // Update today's mood
        const newData = new Map(moodData);
        newData.set(todayIndex, {
          date: new Date().toISOString().split('T')[0],
          color: mood.color,
          emoji: mood.emoji,
          moodValue: moodValue,
        });
        setMoodData(newData);
        
        // Scroll to grid
        setTimeout(() => {
          if (gridRef.current) {
            gridRef.current.scrollIntoView({ 
              behavior: "smooth", 
              block: "start",
              inline: "nearest"
            });
          }
        }, 300);
      }
    };

    window.addEventListener("moodTransactionSuccess", handleTransactionSuccess as EventListener);
    return () => {
      window.removeEventListener("moodTransactionSuccess", handleTransactionSuccess as EventListener);
    };
  }, [moodData, todayIndex]);

  if (!effectiveAddress) {
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

  return (
    <div 
      ref={gridRef} 
      className="relative backdrop-blur-xl bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl animate-fade-in"
      id="mood-grid-container"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 rounded-3xl pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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

        {/* NFT Pixel Art Grid - Horizontal Layout */}
        <div className="relative mb-4 flex justify-center w-full">
          <div className="relative w-full" style={{ maxWidth: '66.666%' }}>
            {/* NFT Frame */}
            <div className="relative p-3 md:p-4 bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-sm border-2 border-white/25 rounded-xl shadow-2xl shadow-black/40">
              {/* Outer glow */}
              <div className="absolute -inset-2 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-transparent rounded-xl blur-xl -z-10" />
              
              {/* Corner decorations */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/40 rounded-bl" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br" />
              
              {/* Inner border */}
              <div className="absolute inset-2 border border-white/15 rounded-lg pointer-events-none" />
              
              {/* 365 Pixel Grid - Horizontal Layout (21 columns x ~17 rows) */}
              <div className="relative flex flex-wrap gap-[1px] md:gap-[1.5px] justify-center" style={{ width: '100%' }}>
                {daysArray.map((day, index) => {
                  const isToday = index === todayIndex;
                  const hasData = day !== null && day.moodValue !== null;
                  const isHovered = hoveredDay === index;

                  return (
                    <div
                      key={index}
                      className="relative group"
                      onMouseEnter={() => setHoveredDay(index)}
                      onMouseLeave={() => setHoveredDay(null)}
                      onClick={() => setHoveredDay(hoveredDay === index ? null : index)}
                      onTouchStart={() => setHoveredDay(hoveredDay === index ? null : index)}
                      style={{
                        width: 'calc((100% - 20px) / 21)',
                        maxWidth: 'calc((100% - 20px) / 21)',
                        aspectRatio: '1',
                      }}
                    >
                      {/* Pixel Square */}
                      <div
                        className={`
                          w-full h-full
                          transition-all duration-150 cursor-pointer relative
                          ${hasData ? '' : 'bg-slate-700/80 border border-slate-600/70'}
                          ${isToday ? 'ring-2 ring-white/90 ring-offset-1 ring-offset-slate-800' : ''}
                          ${isHovered ? 'scale-150 z-30' : 'hover:scale-125 hover:z-20'}
                        `}
                        style={{
                          backgroundColor: hasData && day ? day.color : undefined,
                          boxShadow: isToday && hasData && day
                            ? `0 0 8px ${day.color}, 0 0 16px ${day.color}CC, inset 0 0 4px ${day.color}80`
                            : isToday
                            ? '0 0 8px rgba(255, 255, 255, 0.6), 0 0 16px rgba(255, 255, 255, 0.4)'
                            : hasData && day
                            ? `inset 0 0 2px ${day.color}30, 0 1px 2px rgba(0,0,0,0.4)`
                            : undefined,
                          border: hasData && day ? `1px solid ${day.color}40` : undefined,
                        }}
                      >
                        {/* Pixel art 3D effect */}
                        {hasData && day && (
                          <>
                            <div 
                              className="absolute top-0 left-0 right-0 h-[30%] opacity-40"
                              style={{
                                background: `linear-gradient(to bottom, ${day.color}CC, transparent)`,
                              }}
                            />
                            <div 
                              className="absolute top-0 left-0 bottom-0 w-[30%] opacity-40"
                              style={{
                                background: `linear-gradient(to right, ${day.color}CC, transparent)`,
                              }}
                            />
                            <div 
                              className="absolute bottom-0 left-0 right-0 h-[30%] opacity-30"
                              style={{
                                background: `linear-gradient(to top, rgba(0,0,0,0.4), transparent)`,
                              }}
                            />
                            <div 
                              className="absolute top-0 right-0 bottom-0 w-[30%] opacity-30"
                              style={{
                                background: `linear-gradient(to left, rgba(0,0,0,0.4), transparent)`,
                              }}
                            />
                          </>
                        )}
                      </div>
                      
                      {/* Tooltip */}
                      {isHovered && hasData && day && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 px-3 py-2 bg-slate-900/98 backdrop-blur-md border border-white/30 rounded-lg shadow-2xl pointer-events-none whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{day.emoji}</span>
                            <span className="text-xs font-medium text-white/95">
                              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-white/30" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Grid info */}
              <div className="mt-3 text-center">
                <p className="text-xs text-white/50 font-light tracking-wide">
                  365 days • {moodData.size} logged
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-xs md:text-sm text-center text-white/50 font-light tracking-wide mb-4">
          Each square represents a day. Log your mood daily to build your on-chain journal.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2">
            {!isYearComplete ? (
              <div className="w-full">
                <button
                  disabled
                  className="group relative w-full px-6 py-3 bg-slate-700/50 text-slate-400 font-medium rounded-xl cursor-not-allowed transition-all duration-200 shadow-lg overflow-hidden opacity-60"
                >
                  <span className="relative z-10">Mint Your Year in Pixels NFT</span>
                </button>
                <div className="mt-2 p-3 backdrop-blur-md bg-amber-500/10 border border-amber-400/30 rounded-lg text-amber-300/90 text-xs text-center animate-slide-in-top">
                  <span className="inline-block mr-1">⏳</span>
                  Minting requires a full year of data. {daysRemaining > 0 ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining until you can mint.` : 'Complete the year to mint your NFT.'}
                </div>
              </div>
            ) : (
              <button
                onClick={() => console.log("Mint clicked")}
                className="group relative w-full px-6 py-3 bg-white text-slate-900 font-medium rounded-xl hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98] overflow-hidden"
              >
                <span className="relative z-10">Mint Your Year in Pixels NFT</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
            )}
            <p className="text-xs text-gray-400 font-light">
              Soulbound NFT (Non-transferable)
            </p>
          </div>

          <button
            onClick={() => {
              if (effectiveAddress) {
                // Create Farcaster share link with NFT preview
                const nftPreviewUrl = `${window.location.origin}?address=${effectiveAddress}`;
                const shareText = `Check out my Year in Pixels NFT on ONPIXEL! 🎨✨\n\n${nftPreviewUrl}`;
                const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
                window.open(farcasterUrl, '_blank');
              } else {
                console.log("Connect wallet to share");
              }
            }}
            className="group relative w-full px-6 py-3 border-2 border-white/20 text-white font-medium rounded-xl hover:border-white/30 hover:bg-white/5 transition-all duration-200 active:scale-[0.98] overflow-hidden"
          >
            <span className="relative z-10">Share on Farcaster</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
