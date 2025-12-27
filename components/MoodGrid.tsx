"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { BASELOG_ABI, BASELOG_CONTRACT_ADDRESS } from "@/lib/contract";

export function MoodGrid() {
  const { address } = useAccount();
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contractError, setContractError] = useState<boolean>(false);

  // Check if contract exists by calling name() function
  const { data: contractName, error: contractCheckError } = useReadContract({
    address: BASELOG_CONTRACT_ADDRESS,
    abi: BASELOG_ABI,
    functionName: "name",
    query: {
      retry: false,
    },
  });

  // Check if user has a token - with better error handling
  const { data: balance, error: balanceError } = useReadContract({
    address: BASELOG_CONTRACT_ADDRESS,
    abi: BASELOG_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !contractError,
      retry: false, // Don't retry on failure
    },
  });

  // Fetch SVG with error handling
  const { data: svg, refetch: refetchSvg, error: svgError } = useReadContract({
    address: BASELOG_CONTRACT_ADDRESS,
    abi: BASELOG_ABI,
    functionName: "generateSVG",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!balance && balance > 0n && !contractError,
      retry: false,
    },
  });

  useEffect(() => {
    // Check if contract exists by checking name() call
    if (contractCheckError) {
      const errorMessage = contractCheckError.message || contractCheckError.toString();
      if (errorMessage.includes("is not a contract") || 
          errorMessage.includes("returned no data") ||
          errorMessage.includes("ContractFunctionZeroDataError")) {
        setContractError(true);
        setError("Contract address not found. Please check your configuration.");
      }
    } else if (contractName) {
      // Contract exists (name() call succeeded)
      setContractError(false);
    }
  }, [contractCheckError, contractName]);

  useEffect(() => {
    // balanceOf errors are not critical - they just mean user has no tokens
    if (balanceError) {
      console.warn("Balance check error (user may have no tokens):", balanceError);
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
    if (svgError && !contractError) {
      console.error("SVG fetch error:", svgError);
      setError("Failed to fetch grid data");
    }
  }, [svgError, contractError]);

  // Refetch SVG when address changes or after a delay (to catch updates)
  useEffect(() => {
    if (address && balance && balance > 0n && !contractError) {
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
  }, [address, balance, refetchSvg, contractError]);

  if (!address) {
    return (
      <div className="mood-grid-container p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <p className="text-center text-gray-500">
          Connect your wallet to view your mood grid
        </p>
      </div>
    );
  }

  // Show contract error message if contract is not found
  if (contractError) {
    return (
      <div className="mood-grid-container p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-32 h-32 bg-gradient-to-br from-red-200 to-orange-200 rounded-lg flex items-center justify-center mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <p className="text-gray-600 text-sm text-center mb-2 font-semibold">
            Contract Not Found
          </p>
          <p className="text-gray-500 text-xs text-center mb-4 max-w-md">
            The contract address <code className="bg-gray-100 px-2 py-1 rounded">{BASELOG_CONTRACT_ADDRESS}</code> is not deployed or invalid.
          </p>
          <p className="text-gray-500 text-xs text-center max-w-md">
            Please make sure the contract is deployed to Base Sepolia and the address is set correctly in your .env.local file as NEXT_PUBLIC_CONTRACT_ADDRESS.
          </p>
        </div>
      </div>
    );
  }

  // If balance is 0 or balanceOf failed (but contract exists), show "log first mood" message
  if ((!balance || balance === 0n) && !contractError) {
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
      
      {error && !contractError ? (
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

