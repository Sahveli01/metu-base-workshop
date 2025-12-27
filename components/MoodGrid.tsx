"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount, useReadContract } from "wagmi";
import { BASELOG_ABI, BASELOG_CONTRACT_ADDRESS, MOOD_OPTIONS, getDayIndex } from "@/lib/contract";

export function MoodGrid() {
  const { address } = useAccount();
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldShowGrid, setShouldShowGrid] = useState(false);
  const [pendingMood, setPendingMood] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  // Fetch SVG from contract
  const { data: svg, refetch: refetchSvg, error: svgError } = useReadContract({
    address: BASELOG_CONTRACT_ADDRESS,
    abi: BASELOG_ABI,
    functionName: "generateSVG",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      retry: false,
    },
  });

  // Generate a simple placeholder SVG based on selected mood
  const generatePlaceholderSVG = (moodValue: number): string => {
    const dayIndex = getDayIndex();
    const dayOfWeek = dayIndex % 7;
    const week = Math.floor(dayIndex / 7);
    const moodColor = MOOD_OPTIONS[moodValue]?.color || "#F5F5F5";
    
    let cells = "";
    const cols = 7;
    
    for (let i = 0; i < 365; i++) {
      const currentWeek = Math.floor(i / 7);
      const currentDay = i % 7;
      const x = currentDay * 14;
      const y = currentWeek * 14;
      
      // Highlight today's cell
      let color = "#F5F5F5";
      if (i === dayIndex) {
        color = moodColor;
      }
      
      cells += `<rect x="${x}" y="${y}" width="12" height="12" fill="${color}" rx="2"/>`;
    }
    
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 750"><rect width="100%" height="100%" fill="#FFFFFF"/>${cells}</svg>`;
  };

  // Listen for transaction success event
  useEffect(() => {
    const handleTransactionSuccess = (event: CustomEvent) => {
      const moodValue = event.detail?.moodValue ?? null;
      setPendingMood(moodValue);
      setShouldShowGrid(true);
      setIsLoading(true);
      
      // Generate placeholder SVG immediately
      if (moodValue !== null) {
        const placeholderSVG = generatePlaceholderSVG(moodValue);
        setSvgContent(placeholderSVG);
      }
      
      // Scroll to grid immediately
      setTimeout(() => {
        if (gridRef.current && !hasScrolledRef.current) {
          gridRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          hasScrolledRef.current = true;
        }
      }, 100);
      
      // Try to fetch real SVG from contract with retries
      const retries = [3000, 6000, 10000, 15000, 20000];
      
      retries.forEach((delay) => {
        setTimeout(() => {
          refetchSvg().catch(() => {
            // Silently handle errors, keep placeholder
          });
        }, delay);
      });
      
      // Stop loading after all retries
      setTimeout(() => {
        setIsLoading(false);
        hasScrolledRef.current = false;
      }, retries[retries.length - 1] + 3000);
    };

    window.addEventListener("moodTransactionSuccess", handleTransactionSuccess as EventListener);
    return () => {
      window.removeEventListener("moodTransactionSuccess", handleTransactionSuccess as EventListener);
    };
  }, [refetchSvg]);

  // Update SVG content when contract returns data
  useEffect(() => {
    if (svg && typeof svg === "string" && svg.trim().length > 0) {
      setSvgContent(svg);
      setIsLoading(false);
      setPendingMood(null);
    }
  }, [svg]);

  if (!address) {
    return (
      <div className="mood-grid-container p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <p className="text-center text-gray-500">
          Connect your wallet to view your mood grid
        </p>
      </div>
    );
  }

  // Show grid if we have SVG content (either from contract or placeholder)
  if (svgContent) {
    return (
      <div ref={gridRef} className="mood-grid-container p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Your Year in Pixels</h2>
          {pendingMood !== null && (
            <span className="text-xs text-gray-500 bg-yellow-50 px-2 py-1 rounded">
              Updating from blockchain...
            </span>
          )}
        </div>
        
        <div className="flex justify-center overflow-x-auto">
          <div
            className="mood-grid-svg"
            dangerouslySetInnerHTML={{ __html: svgContent }}
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
          />
        </div>
        
        {pendingMood !== null && (
          <p className="mt-4 text-sm text-center text-blue-600">
            ⏳ Your mood has been saved! The grid is updating from the blockchain...
          </p>
        )}
        
        <p className="mt-4 text-sm text-center text-gray-500">
          Each square represents a day. Log your mood daily to build your on-chain journal.
        </p>
      </div>
    );
  }

  // Show loading or empty state
  if (isLoading) {
    return (
      <div className="mood-grid-container p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-center text-gray-600">
            Loading your grid...
          </p>
        </div>
      </div>
    );
  }

  // No grid content yet
  return (
    <div className="mood-grid-container p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
      <p className="text-center text-gray-500">
        Log your first mood to mint your BaseLog NFT and see your grid!
      </p>
    </div>
  );
}
