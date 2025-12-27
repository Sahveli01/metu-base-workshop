const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  "accountAssociation": {
    "header": "",
    "payload": "",
    "signature": ""
  },
  miniapp: {
    version: "1",
    name: "BaseLog",
    subtitle: "Your On-Chain Mood Journal",
    description: "Log your daily mood and build a beautiful Year in Pixels NFT stored entirely on-chain. Each day becomes a colored pixel in your soulbound NFT.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#f5f7fa",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["mood", "journal", "nft", "soulbound", "onchain", "base"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Your year, one pixel at a time",
    ogTitle: "BaseLog - On-Chain Mood Journal",
    ogDescription: "Log your daily mood and build a beautiful Year in Pixels NFT stored entirely on-chain.",
    ogImageUrl: `${ROOT_URL}/hero.png`,
  },
} as const;
