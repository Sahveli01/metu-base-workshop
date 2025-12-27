"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { BASELOG_ABI, BASELOG_CONTRACT_ADDRESS } from "@/lib/contract";

export function MoodGrid() {
  const { address } = useAccount();
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user has a token
  // Note: If contract doesn't exist, this will fail silently and balance will be undefined
  const { data: balance, error: balanceError } = useReadContract({
    address: BASELOG_CONTRACT_ADDRESS,
    abi: BASELOG_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      retry: false,
    },
  });

  // Fetch SVG with error handling
  const { data: svg, refetch: refetchSvg, error: svgError } = useReadContract({
    address: BASELOG_CONTRACT_ADDRESS,
    abi: BASELOG_ABI,
    functionName: "generateSVG",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!balance && balance > 0n,
      retry: false,
    },
  });

  useEffect(() => {
    // Log balance errors but don't treat them as critical
    // They could mean: user has no tokens, contract doesn't exist, or RPC issue
    if (balanceError) {
      console.warn("Balance check error:", balanceError);
    }
  }, [balanceError]);

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

  // Refetch SVG when address changes or after a delay (to catch updates)
  useEffect(() => {
    if (address && balance && balance > 0n) {
      const timer = setTimeout(() => {
        try {
          refetchSvg();
        } catch (err) {
          console.error("Error refetching SVG:", err);
          setError("Failed to refresh grid");
        }
      }, 3000); // Refetch after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [address, balance, refetchSvg]);

  if (!address) {
    return (
      <div className="mood-grid-container p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <p className="text-center text-gray-500">
          Connect your wallet to view your mood grid
        </p>
      </div>
    );
  }

  // If balance is 0 or balanceOf failed, show "log first mood" message
  if (!balance || balance === 0n) {
    return (
      <div className="mood-grid-container p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <p className="text-center text-gray-500">
          Log your first mood to mint your BaseLog NFT and see your grid!
        </p>
      </div>
    );
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

