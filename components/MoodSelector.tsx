"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConnect, useChainId, useSwitchChain } from "wagmi";
import { BASELOG_ABI, BASELOG_CONTRACT_ADDRESS, MOOD_OPTIONS, getDayIndex } from "@/lib/contract";

export function MoodSelector() {
  const { address } = useAccount();
  const { connectors, connect } = useConnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const dayIndex = getDayIndex();
  const eventDispatchedRef = useRef<string | null>(null);

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
      query: {
        enabled: !!hash,
        retry: false,
      },
    });

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleMoodSelect = async (moodValue: number) => {
    if (!address) return;
    
    if (chainId !== 84532) {
      try {
        await switchChain({ chainId: 84532 });
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("Failed to switch chain:", error);
        return;
      }
    }
    
    setSelectedMood(moodValue);
    eventDispatchedRef.current = null;
    
    writeContract({
      address: BASELOG_CONTRACT_ADDRESS,
      abi: BASELOG_ABI,
      functionName: "logMood",
      args: [BigInt(dayIndex), moodValue as number],
    });
  };

  const isProcessing = isPending || isConfirming;

  // RADICAL APPROACH: Dispatch event AS SOON AS hash is available (not pending)
  useEffect(() => {
    if (hash && !isPending && selectedMood !== null) {
      // Only dispatch once per hash
      if (eventDispatchedRef.current !== hash) {
        console.log("Transaction hash received, dispatching event immediately:", hash);
        eventDispatchedRef.current = hash;
        setShowSuccessMessage(true);
        
        // Dispatch immediately, don't wait for confirmation
        window.dispatchEvent(new CustomEvent("moodTransactionSuccess", {
          detail: { moodValue: selectedMood, hash }
        }));
        
        // Also dispatch on confirmation (if it happens)
        if (isConfirmed) {
          console.log("Transaction also confirmed!");
        }
      }
    }
  }, [hash, isPending, selectedMood, isConfirmed]);

  // Clear success message after delay
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  return (
    <div className="mood-selector">
      <h2 className="text-2xl font-semibold mb-4 text-center text-gray-900">
        How was your day?
      </h2>
      
      {!address && (
        <div className="flex flex-col items-center mb-6">
          <p className="text-gray-500 mb-3">Please connect your wallet to log your mood</p>
          <button
            onClick={() => {
              if (connectors && connectors.length > 0) {
                connect({ connector: connectors[0] });
              }
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {address && chainId !== 84532 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-amber-800 text-sm text-center">
          ⚠️ Please switch to Base Sepolia network to log your mood
          <button
            onClick={() => switchChain({ chainId: 84532 })}
            className="ml-2 underline font-semibold text-amber-900 hover:text-amber-950"
          >
            Switch Network
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {MOOD_OPTIONS.map((mood) => (
          <button
            key={mood.value}
            onClick={() => handleMoodSelect(mood.value)}
            disabled={!address || isProcessing}
            className={`
              relative p-4 rounded-xl transition-all duration-200
              ${selectedMood === mood.value
                ? "ring-4 ring-offset-2 ring-gray-300 scale-105"
                : "hover:scale-105 hover:shadow-lg"
              }
              ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
            style={{
              backgroundColor: mood.color,
              boxShadow: selectedMood === mood.value
                ? `0 0 0 3px ${mood.color}40`
                : "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <div className="text-3xl mb-2">{mood.emoji}</div>
            <div className="text-sm font-medium text-gray-700">{mood.label}</div>
          </button>
        ))}
      </div>

      {isPending && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm text-center">
          ⏳ Sending transaction...
        </div>
      )}

      {hash && !isPending && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
          ✓ Transaction sent! View your grid above. {isConfirming && "(Confirming...)"}
        </div>
      )}

      {writeError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
          Error: {writeError.message}
        </div>
      )}
    </div>
  );
}
