"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { BASELOG_ABI, BASELOG_CONTRACT_ADDRESS } from "@/lib/contract";

export function MoodGrid() {
  const { address } = useAccount();
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [shouldRefetch, setShouldRefetch] = useState(0);

  // Fetch SVG - only when address exists or when shouldRefetch changes
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
      // Wait a bit for blockchain to index, then refetch
      setTimeout(() => {
        setShouldRefetch((prev) => prev + 1);
        refetchSvg();
      }, 3000); // Wait 3 seconds after transaction confirmation
    };

    window.addEventListener("moodTransactionSuccess", handleTransactionSuccess);
    return () => {
      window.removeEventListener("moodTransactionSuccess", handleTransactionSuccess);
    };
  }, [refetchSvg]);

  // Update SVG content when SVG data changes
  useEffect(() => {
    if (svg && typeof svg === "string") {
      setSvgContent(svg);
    }
  }, [svg]);

  // Refetch when shouldRefetch changes (triggered by transaction success)
  useEffect(() => {
    if (shouldRefetch > 0 && address) {
      refetchSvg();
    }
  }, [shouldRefetch, address, refetchSvg]);

  if (!address) {
    return (
      <div className="mood-grid-container p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <p className="text-center text-gray-500">
          Connect your wallet to view your mood grid
        </p>
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
    <div className="mood-grid-container p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
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
