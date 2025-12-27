"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConnect, useChainId, useSwitchChain } from "wagmi";
import { ConnectButton } from "@coinbase/onchainkit";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { BASELOG_ABI, BASELOG_CONTRACT_ADDRESS, MOOD_OPTIONS, getDayIndex } from "@/lib/contract";

export function MoodSelector() {
  const { address } = useAccount();
  const { connectors, connect } = useConnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { context } = useMiniKit();
  
  // Try to get address from MiniKit context if wagmi address is not available
  const effectiveAddress = address || context?.user?.custodyAddress;
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
    if (!effectiveAddress) return;
    
    // Auto-switch to Base Sepolia if needed (silent)
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
          {!effectiveAddress && (
            <div className="flex flex-col items-center mb-8 animate-slide-in-bottom">
              <p className="text-white/60 mb-6 text-sm md:text-base font-light tracking-wide">
                Please connect your wallet to log your mood
              </p>
              <div className="[&_button]:!px-8 [&_button]:!py-3.5 [&_button]:!rounded-2xl [&_button]:!font-medium [&_button]:!text-white [&_button]:!bg-gradient-to-r [&_button]:!from-purple-600/90 [&_button]:!to-blue-600/90 [&_button]:!hover:from-purple-500 [&_button]:!hover:to-blue-500 [&_button]:!transition-all [&_button]:!duration-300 [&_button]:!shadow-lg [&_button]:!shadow-purple-500/20 [&_button]:!hover:shadow-purple-500/40 [&_button]:!hover:scale-[1.02] [&_button]:!active:scale-[0.98] [&_button]:!backdrop-blur-sm [&_button]:!border [&_button]:!border-white/20 [&_button]:!overflow-hidden">
                <ConnectButton />
              </div>
            </div>
          )}


          {/* Mood Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {MOOD_OPTIONS.map((mood, index) => (
              <button
                key={mood.value}
                onClick={() => handleMoodSelect(mood.value)}
                disabled={!effectiveAddress || isProcessing}
                className={`
                  group relative p-5 md:p-6 rounded-2xl transition-all duration-300 ease-out
                  backdrop-blur-md border overflow-hidden
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
                    className="absolute inset-0 rounded-2xl opacity-50 blur-xl -z-10 animate-pulse"
                    style={{ backgroundColor: mood.color }}
                  />
                )}
                
                {/* Hover glow effect - mood color based */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-md -z-10"
                  style={{ backgroundColor: mood.color }}
                />
                
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <div className="relative text-4xl md:text-5xl mb-2.5 transform transition-all duration-300 group-hover:scale-110">
                    <span className="relative z-10 inline-block">{mood.emoji}</span>
                    <div 
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg -z-0"
                      style={{
                        textShadow: `0 0 20px ${mood.color}, 0 0 40px ${mood.color}CC`,
                      }}
                    >
                      {mood.emoji}
                    </div>
                    <div 
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity duration-300 blur-xl -z-0"
                      style={{
                        textShadow: `0 0 30px ${mood.color}80`,
                      }}
                    >
                      {mood.emoji}
                    </div>
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
            <div className="mt-6 p-4 backdrop-blur-md bg-blue-500/10 border border-blue-400/30 rounded-2xl text-blue-300/90 text-sm text-center animate-slide-in-bottom relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 animate-pulse" />
              <span className="relative z-10 inline-block animate-spin mr-2">⏳</span>
              <span className="relative z-10">Sending transaction...</span>
            </div>
          )}

          {hash && !isPending && (
            <div className="mt-6 p-4 backdrop-blur-md bg-emerald-500/10 border border-emerald-400/30 rounded-2xl text-emerald-300/90 text-sm text-center animate-slide-in-bottom relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 animate-pulse" />
              <span className="relative z-10 inline-flex items-center justify-center mr-2">
                <span className="inline-block animate-bounce">✓</span>
              </span>
              <span className="relative z-10">
                Transaction confirmed! View your grid above.
              </span>
              <div className="absolute inset-0 bg-emerald-500/10 animate-ping opacity-75" />
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
