"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount, useReadContract } from "wagmi";
import { BASELOG_ABI, BASELOG_CONTRACT_ADDRESS } from "@/lib/contract";

export function MoodGrid() {
  const { address } = useAccount();
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch SVG
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

  // Listen for transaction success event from MoodSelector
  useEffect(() => {
    const handleTransactionSuccess = () => {
      setIsLoading(true);
      
      // Retry multiple times with increasing delays
      const retries = [2000, 5000, 8000, 12000]; // 2s, 5s, 8s, 12s
      
      retries.forEach((delay, index) => {
        setTimeout(() => {
          refetchSvg().then(() => {
            // Scroll to grid after first successful refetch
            if (index === 0 && gridRef.current) {
              setTimeout(() => {
                gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 500);
            }
          });
        }, delay);
      });

      // Stop loading after all retries
      setTimeout(() => setIsLoading(false), retries[retries.length - 1] + 2000);
    };

    window.addEventListener("moodTransactionSuccess", handleTransactionSuccess);
    return () => {
      window.removeEventListener("moodTransactionSuccess", handleTransactionSuccess);
    };
  }, [refetchSvg]);

  // Update SVG content when SVG data changes
  useEffect(() => {
    if (svg && typeof svg === "string" && svg.trim().length > 0) {
      setSvgContent(svg);
      setIsLoading(false);
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

  // Show loading state during transaction processing
  if (isLoading) {
    return (
      <div className="mood-grid-container p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-center text-gray-600">
            Updating your grid...
          </p>
        </div>
      </div>
    );
  }

  // If no SVG content, show message to log first mood
  if (!svgContent) {
    return (
      <div className="mood-grid-container p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <p className="text-center text-gray-500">
          Log your first mood to mint your BaseLog NFT and see your grid!
        </p>
      </div>
    );
  }

  // Show the grid
  return (
    <div ref={gridRef} className="mood-grid-container p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Your Year in Pixels</h2>
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
