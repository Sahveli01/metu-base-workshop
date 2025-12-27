"use client";

import { useState, useMemo } from "react";

interface DailyMood {
  date: string;
  color: string;
  emoji: string;
  isMinted: boolean;
}

interface YearInPixelsProps {
  dailyMoods: DailyMood[];
  onMint?: () => void;
  onShare?: () => void;
  showSaved?: boolean;
}

export function YearInPixels({ 
  dailyMoods, 
  onMint, 
  onShare,
  showSaved = false 
}: YearInPixelsProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // Get today's date index (0-364)
  const todayIndex = useMemo(() => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const diffTime = today.getTime() - startOfYear.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(diffDays, 364);
  }, []);

  // Generate 365 days array
  const daysArray = useMemo(() => {
    const days: (DailyMood | null)[] = [];
    const moodMap = new Map<string, DailyMood>();
    
    // Create a map for quick lookup
    dailyMoods.forEach(mood => {
      moodMap.set(mood.date, mood);
    });

    // Generate all 365 days
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    for (let i = 0; i < 365; i++) {
      const currentDate = new Date(startOfYear);
      currentDate.setDate(startOfYear.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      days.push(moodMap.get(dateString) || null);
    }

    return days;
  }, [dailyMoods]);

  const handleDayHover = (index: number) => {
    setHoveredDay(index);
  };

  const handleDayLeave = () => {
    setHoveredDay(null);
  };

  return (
    <div className="relative backdrop-blur-xl bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 rounded-3xl pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl md:text-3xl font-light text-white/95 tracking-tight mb-1">
              Your Year in Pixels
            </h2>
            <p className="text-xs md:text-sm text-white/50 font-light">
              Track your daily mood journey throughout the year
            </p>
          </div>
          {showSaved && (
            <div className="flex items-center gap-2 px-4 py-2 backdrop-blur-md bg-emerald-500/20 border border-emerald-400/30 rounded-full animate-slide-in-top">
              <span className="text-emerald-300 text-sm">✓</span>
              <span className="text-xs md:text-sm text-emerald-300/90 font-medium">Saved!</span>
            </div>
          )}
        </div>

        {/* Grid Container - NFT Style Frame */}
        <div className="relative mb-6 flex justify-center">
          <div className="relative inline-block p-5 md:p-7 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border-2 border-white/15 rounded-2xl shadow-2xl shadow-black/20">
            {/* Outer glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-transparent rounded-2xl blur-xl -z-10" />
            
            {/* Decorative corner accents - NFT style */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white/25 rounded-tl" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white/25 rounded-tr" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-white/25 rounded-bl" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-white/25 rounded-br" />
            
            {/* Subtle inner border */}
            <div className="absolute inset-3 border border-white/5 rounded-lg pointer-events-none" />
            
            {/* Pixel Grid - 7 columns for weeks, ~52 rows for days */}
            <div className="grid grid-cols-7 gap-[2.5px] md:gap-[3px] relative p-1">
              {daysArray.map((day, index) => {
                const isToday = index === todayIndex;
                const hasData = day !== null;
                const isHovered = hoveredDay === index;

                return (
                  <div
                    key={index}
                    className={`
                      aspect-square w-3.5 h-3.5 md:w-4.5 md:h-4.5
                      transition-all duration-200 cursor-pointer relative
                      ${hasData ? 'border border-black/15 shadow-sm' : 'bg-slate-700/50 border border-slate-600/40'}
                      ${isToday ? 'ring-2 ring-offset-1 ring-offset-slate-800 ring-white/70 shadow-[0_0_10px_currentColor,0_0_20px_currentColor]' : ''}
                      ${isHovered ? 'scale-150 z-30 shadow-xl' : 'hover:scale-125 hover:z-20'}
                    `}
                    style={{
                      backgroundColor: hasData ? day.color : undefined,
                      color: hasData ? day.color : undefined,
                      boxShadow: isToday && hasData
                        ? `0 0 10px ${day.color}, 0 0 20px ${day.color}90, 0 0 30px ${day.color}50, inset 0 0 6px ${day.color}60`
                        : isToday
                        ? '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)'
                        : hasData
                        ? `inset 0 0 3px ${day.color}30, 0 1px 2px rgba(0,0,0,0.2)`
                        : undefined,
                    }}
                    onMouseEnter={() => handleDayHover(index)}
                    onMouseLeave={handleDayLeave}
                    title={day ? `${day.date} ${day.emoji}` : undefined}
                  >
                    {/* Tooltip for this day */}
                    {isHovered && day && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 z-50 px-3 py-2 bg-slate-900/98 backdrop-blur-md border border-white/30 rounded-lg shadow-2xl pointer-events-none whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{day.emoji}</span>
                          <span className="text-xs font-medium text-white/95">
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        {/* Tooltip arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-white/30" />
                      </div>
                    )}
                    
                    {/* Subtle inner glow for filled days */}
                    {hasData && !isToday && (
                      <div 
                        className="absolute inset-0 opacity-40"
                        style={{
                          background: `radial-gradient(circle at center, ${day.color}60, transparent 60%)`,
                        }}
                      />
                    )}
                    
                    {/* Pixel art style inner highlight */}
                    {hasData && (
                      <div 
                        className="absolute top-0 left-0 w-1/2 h-1/2 opacity-20"
                        style={{
                          background: `linear-gradient(135deg, ${day.color}80, transparent)`,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Grid info text */}
            <div className="mt-5 text-center">
              <p className="text-xs text-white/40 font-light tracking-wide">
                365 days • {dailyMoods.filter(m => m.isMinted).length} minted
              </p>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-xs md:text-sm text-center text-white/50 font-light tracking-wide mb-6">
          Each square represents a day. Log your mood daily to build your on-chain journal.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          {/* Mint Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onMint}
              className="w-full px-6 py-3 bg-white text-slate-900 font-medium rounded-xl hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              Mint Your Year in Pixels NFT
            </button>
            <p className="text-xs text-gray-400 font-light">
              Soulbound NFT (Non-transferable)
            </p>
          </div>

          {/* Share Button */}
          <button
            onClick={onShare}
            className="w-full px-6 py-3 border-2 border-white/20 text-white font-medium rounded-xl hover:border-white/30 hover:bg-white/5 transition-all duration-200 active:scale-[0.98]"
          >
            Share on Farcaster
          </button>
        </div>
      </div>
    </div>
  );
}

