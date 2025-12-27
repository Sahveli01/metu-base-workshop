"use client";

import { useEffect, Suspense } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { MoodSelector } from "../components/MoodSelector";
import { MoodGrid } from "../components/MoodGrid";
import styles from "./page.module.css";

export default function Home() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();

  // Initialize the miniapp (with error handling)
  useEffect(() => {
    try {
      if (!isFrameReady) {
        setFrameReady();
      }
    } catch (error) {
      console.error("MiniKit initialization error:", error);
      // Continue rendering even if MiniKit fails
    }
  }, [setFrameReady, isFrameReady]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>ONPIXEL</h1>
          <p className={styles.subtitle}>
            Your on-chain mood journal
            {context?.user?.displayName && (
              <span className={styles.userName}>
                {" "}
                • Welcome, {context.user.displayName}
              </span>
            )}
          </p>
        </div>

        <div className={styles.mainContent}>
          <Suspense fallback={
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 rounded-3xl pointer-events-none" />
              <div className="relative z-10 flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white/60"></div>
              </div>
            </div>
          }>
            <MoodGrid />
          </Suspense>
          <div className={styles.divider} />
          <MoodSelector />
        </div>
      </div>
    </div>
  );
}
