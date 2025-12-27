"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { BASELOG_ABI, BASELOG_CONTRACT_ADDRESS } from "@/lib/contract";

export function MoodGrid() {
  const { address } = useAccount();
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Try to fetch SVG directly - if user has logged mood, this will work
  // We don't check balanceOf first because it may fail even when user has a token
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


  useEffect(() => {
    try {
      if (svg && typeof svg === 'string') {
        setSvgContent(svg);
        setError(null);
      }
    } catch (err) {
      console.error("Error parsing SVG:", err);
      setError("Failed to load grid image");
      setSvgContent(null);
    }
  }, [svg]);

  useEffect(() => {
    if (svgError) {
      console.error("SVG fetch error:", svgError);
      setError("Failed to fetch grid data");
    }
  }, [svgError]);

  // Refetch SVG when address changes, after page focus, or periodically
  useEffect(() => {
    if (address) {
      // Refetch immediately when component mounts or address changes
      const immediateTimer = setTimeout(() => {
        refetchSvg();
      }, 1000); // First refetch after 1 second
      
      // Refetch periodically to catch updates
      const periodicTimer = setInterval(() => {
        refetchSvg();
      }, 5000); // Every 5 seconds
      
      // Refetch when page comes into focus (user returns to tab)
      const handleFocus = () => {
        refetchSvg();
      };
      window.addEventListener('focus', handleFocus);
      
      return () => {
        clearTimeout(immediateTimer);
        clearInterval(periodicTimer);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [address, refetchSvg]);

  if (!address) {
    return (
      <div className="mood-grid-container p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <p className="text-center text-gray-500">
          Connect your wallet to view your mood grid
        </p>
      </div>
    );
  }

  // If SVG fetch failed or returned no data, show "log first mood" message
  // This means user hasn't logged any mood yet
  if (svgError || (!svg && address)) {
    const errorMessage = svgError?.message || svgError?.toString() || "";
    // Only show "log first mood" if it's a legitimate error (not a contract not found error)
    if (!errorMessage.includes("is not a contract")) {
      return (
        <div className="mood-grid-container p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
          <p className="text-center text-gray-500">
            Log your first mood to mint your BaseLog NFT and see your grid!
          </p>
        </div>
      );
    }
  }

  return (
    <div className="mood-grid-container p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Your Year in Pixels</h2>
      </div>
      
      {error ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg flex items-center justify-center mb-4">
            <span className="text-4xl">📊</span>
          </div>
          <p className="text-gray-600 text-sm text-center mb-2">
            {error}
          </p>
          <p className="text-gray-500 text-xs text-center">
            Your mood data is saved on-chain. The grid will appear once the data is indexed.
          </p>
        </div>
      ) : svgContent ? (
        <div className="flex justify-center overflow-x-auto">
          <div
            className="mood-grid-svg"
            dangerouslySetInnerHTML={{ __html: svgContent }}
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
            onError={(e) => {
              console.error("SVG render error:", e);
              setError("Failed to render grid");
            }}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
        </div>
      )}
      
      <p className="mt-4 text-sm text-center text-gray-500">
        Each square represents a day. Log your mood daily to build your on-chain journal.
      </p>
    </div>
  );
}

