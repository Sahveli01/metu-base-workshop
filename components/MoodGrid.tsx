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

  // Generate placeholder SVG based on mood
  const generatePlaceholderSVG = (moodValue: number): string => {
    const dayIndex = getDayIndex();
    const moodColor = MOOD_OPTIONS[moodValue]?.color || "#F5F5F5";
    
    let cells = "";
    const cols = 7;
    
    for (let i = 0; i < 365; i++) {
      const x = (i % cols) * 14;
      const y = Math.floor(i / cols) * 14;
      
      // Highlight today's cell with selected mood color
      const color = i === dayIndex ? moodColor : "#F5F5F5";
      
      cells += `<rect x="${x}" y="${y}" width="12" height="12" fill="${color}" rx="2"/>`;
    }
    
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 750"><rect width="100%" height="100%" fill="#FFFFFF"/>${cells}</svg>`;
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
        
        // IMMEDIATELY scroll to grid
        setTimeout(() => {
          if (gridRef.current) {
            gridRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
        
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

  // Update SVG if contract returns data (optional enhancement)
  useEffect(() => {
    if (svg && typeof svg === "string" && svg.trim().length > 0) {
      setSvgContent(svg);
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

  // Show grid if we have SVG content
  if (svgContent) {
    return (
      <div ref={gridRef} className="mood-grid-container p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Your Year in Pixels</h2>
          {pendingMood !== null && (
            <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
              Saved!
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
        
        <p className="mt-4 text-sm text-center text-gray-500">
          Each square represents a day. Log your mood daily to build your on-chain journal.
        </p>
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
