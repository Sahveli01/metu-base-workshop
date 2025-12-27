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

        {/* Grid Container */}
        <div className="relative mb-6">
          <div className="grid grid-cols-7 gap-1 md:gap-1.5 justify-center max-w-full overflow-x-auto pb-2">
            {daysArray.map((day, index) => {
              const isToday = index === todayIndex;
              const hasData = day !== null;
              const isHovered = hoveredDay === index;

              return (
                <div
                  key={index}
                  className={`
                    aspect-square w-full min-w-[8px] md:min-w-[10px] 
                    rounded-sm transition-all duration-200 cursor-pointer relative
                    ${hasData ? '' : 'bg-slate-700/30 border border-slate-600/20'}
                    ${isToday ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white/50 shadow-lg shadow-white/20' : ''}
                    ${isHovered ? 'scale-110 z-10' : 'hover:scale-105'}
                  `}
                  style={{
                    backgroundColor: hasData ? day.color : undefined,
                    boxShadow: isToday 
                      ? `0 0 12px ${hasData ? day.color : 'rgba(255, 255, 255, 0.3)'}, 0 0 24px ${hasData ? day.color + '40' : 'rgba(255, 255, 255, 0.1)'}`
                      : undefined,
                  }}
                  onMouseEnter={() => handleDayHover(index)}
                  onMouseLeave={handleDayLeave}
                >
                  {/* Tooltip for this day */}
                  {isHovered && day && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 px-3 py-2 bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl pointer-events-none whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{day.emoji}</span>
                        <span className="text-xs font-medium text-white/90">
                          {day.date}
                        </span>
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/20" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
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

