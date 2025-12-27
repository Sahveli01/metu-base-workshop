import { Address } from "viem";

// BaseLog Contract ABI (minimal for frontend)
// Updated to match the optimized contract (removed getMood and isDayLogged helpers)
export const BASELOG_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "dayIndex", type: "uint256" },
      { internalType: "uint8", name: "moodValue", type: "uint8" },
    ],
    name: "logMood",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "generateSVG",
    outputs: [{ internalType: "string", name: "svg", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "locked",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Contract address (Base Sepolia deployment)
export const BASELOG_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x031dc5F3D62Cf6Fcb50a9cbFd43110b304953F3E") as Address;

// Mood options with colors
export const MOOD_OPTIONS = [
  { value: 0, label: "Great", color: "#E8F5E9", emoji: "😊" },
  { value: 1, label: "Good", color: "#FFF9C4", emoji: "🙂" },
  { value: 2, label: "Okay", color: "#FFE0B2", emoji: "😐" },
  { value: 3, label: "Neutral", color: "#E1BEE7", emoji: "😶" },
  { value: 4, label: "Low", color: "#BBDEFB", emoji: "😔" },
  { value: 5, label: "Bad", color: "#CFD8DC", emoji: "😞" },
  { value: 6, label: "Stress", color: "#FFCDD2", emoji: "😰" },
  { value: 7, label: "Very Bad", color: "#F8BBD0", emoji: "😢" },
] as const;

// Helper: Get day index from current date (0-364)
export function getDayIndex(date: Date = new Date()): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffTime = date.getTime() - startOfYear.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays % 365;
}

