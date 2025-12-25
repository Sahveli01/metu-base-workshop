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
          <h1 className={styles.title}>BaseLog</h1>
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
            <div className="mood-grid-container p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
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
