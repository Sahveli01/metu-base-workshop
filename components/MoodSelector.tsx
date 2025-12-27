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
    <div className="mood-selector w-full">
      {/* Glassmorphism Card Container */}
      <div className="relative backdrop-blur-xl bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl animate-fade-in">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 rounded-3xl pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-light mb-8 text-center text-white/95 tracking-tight">
            How was your day?
          </h2>
          
          {/* Wallet Connection State */}
          {!address && (
            <div className="flex flex-col items-center mb-8 animate-slide-in-bottom">
              <p className="text-white/60 mb-6 text-sm md:text-base font-light tracking-wide">
                Please connect your wallet to log your mood
              </p>
              <button
                onClick={() => {
                  if (connectors && connectors.length > 0) {
                    connect({ connector: connectors[0] });
                  }
                }}
                className="group relative px-8 py-3.5 rounded-2xl font-medium text-white bg-gradient-to-r from-purple-600/90 to-blue-600/90 hover:from-purple-500 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm border border-white/20"
              >
                <span className="relative z-10">Connect Wallet</span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          )}

          {/* Network Warning */}
          {address && chainId !== 84532 && (
            <div className="mb-6 p-4 backdrop-blur-md bg-amber-500/10 border border-amber-400/30 rounded-2xl text-amber-300/90 text-sm text-center animate-slide-in-top">
              <span className="inline-block mb-2">⚠️</span> Please switch to Base Sepolia network to log your mood
              <button
                onClick={() => switchChain({ chainId: 84532 })}
                className="ml-3 underline font-medium text-amber-200 hover:text-amber-100 transition-colors duration-200"
              >
                Switch Network
              </button>
            </div>
          )}

          {/* Mood Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {MOOD_OPTIONS.map((mood, index) => (
              <button
                key={mood.value}
                onClick={() => handleMoodSelect(mood.value)}
                disabled={!address || isProcessing}
                className={`
                  group relative p-5 md:p-6 rounded-2xl transition-all duration-300 ease-out
                  backdrop-blur-md border
                  ${selectedMood === mood.value
                    ? "scale-105 border-white/40 shadow-2xl shadow-current/30 ring-2 ring-white/20"
                    : "border-white/10 hover:border-white/20 hover:scale-[1.03] hover:shadow-xl"
                  }
                  ${isProcessing ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:scale-[0.97]"}
                  opacity-0 animate-fade-in
                `}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'forwards',
                  backgroundColor: selectedMood === mood.value 
                    ? `${mood.color}CC` 
                    : `${mood.color}80`,
                  boxShadow: selectedMood === mood.value
                    ? `0 8px 32px ${mood.color}40, 0 0 0 1px ${mood.color}60`
                    : "0 4px 16px rgba(0,0,0,0.2)",
                }}
              >
                {/* Glow effect on selected */}
                {selectedMood === mood.value && (
                  <div 
                    className="absolute inset-0 rounded-2xl opacity-50 blur-xl -z-10"
                    style={{ backgroundColor: mood.color }}
                  />
                )}
                
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <div className="text-4xl md:text-5xl mb-2.5 transform transition-transform duration-300 group-hover:scale-110">
                    {mood.emoji}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-white/90 tracking-wide">
                    {mood.label}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Status Messages */}
          {isPending && (
            <div className="mt-6 p-4 backdrop-blur-md bg-blue-500/10 border border-blue-400/30 rounded-2xl text-blue-300/90 text-sm text-center animate-slide-in-bottom">
              <span className="inline-block animate-spin mr-2">⏳</span>
              Sending transaction...
            </div>
          )}

          {hash && !isPending && (
            <div className="mt-6 p-4 backdrop-blur-md bg-emerald-500/10 border border-emerald-400/30 rounded-2xl text-emerald-300/90 text-sm text-center animate-slide-in-bottom">
              <span className="inline-block mr-2">✓</span>
              Transaction sent! View your grid above. {isConfirming && <span className="text-emerald-200/70">(Confirming...)</span>}
            </div>
          )}

          {writeError && (
            <div className="mt-6 p-4 backdrop-blur-md bg-red-500/10 border border-red-400/30 rounded-2xl text-red-300/90 text-sm text-center animate-slide-in-bottom">
              <span className="inline-block mr-2">✕</span>
              Error: {writeError.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
