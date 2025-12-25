# BaseLog - On-Chain Mood Journal

BaseLog is a "Year in Pixels" concept moved entirely on-chain. Users check in daily, select a mood (color), and this data is permanently stored on the Base blockchain using highly efficient bit-packing data structures. The output is a Soulbound NFT that visualizes the user's year as a colored grid.

## Features

- **On-Chain Storage**: All mood data is stored directly on the Base blockchain using bit-packing (3 bits per day, ~85 days per uint256)
- **Soulbound NFT (ERC-5192)**: Each user receives a non-transferable NFT that represents their mood journal
- **On-Chain SVG**: The NFT image is generated entirely on-chain as an SVG, no IPFS/Arweave needed
- **Gas Optimized**: Designed for Base's low-cost transactions with efficient storage patterns
- **Farcaster Mini App**: Fully integrated with Farcaster ecosystem as a Mini App (Frame v2)

## Architecture

### Smart Contract (`BaseLog.sol`)

- **Standard**: ERC-721 with ERC-5192 (Soulbound) implementation
- **Data Storage**: Bit-packing using `uint256` slots (3 bits per day, supporting 8 mood variants: 0-7)
- **Visuals**: Pure on-chain SVG generation in `tokenURI()` function
- **Gas Optimization**: Minimal calldata and storage operations

### Frontend

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Web3**: OnchainKit, Wagmi, Viem
- **UI**: TailwindCSS with minimalist pastel design
- **Components**:
  - `MoodSelector`: Color buttons for daily mood logging
  - `MoodGrid`: Displays the on-chain SVG grid

## Prerequisites

- Node.js 18+ and npm/yarn
- Foundry (for smart contract development)
- Base app account
- Farcaster account
- Coinbase Developer Platform API Key

## Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Install Foundry (if not already installed):**

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

3. **Install OpenZeppelin contracts:**

```bash
forge install OpenZeppelin/openzeppelin-contracts
```

4. **Configure environment variables:**

Create a `.env.local` file:

```bash
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_cdp_api_key
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000  # Update after deployment
PRIVATE_KEY=your_private_key_for_deployment
```

## Smart Contract Deployment

### Deploy to Base Sepolia (Testnet)

1. **Set up environment:**

```bash
export PRIVATE_KEY=your_private_key
export RPC_URL=https://sepolia.base.org  # Base Sepolia RPC
```

2. **Deploy:**

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

3. **Update contract address:**

After deployment, update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local` with the deployed contract address.

### Deploy to Base Mainnet

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## Development

1. **Run the development server:**

```bash
npm run dev
```

2. **Open [http://localhost:3000](http://localhost:3000)**

## Deployment to Vercel

1. **Deploy:**

```bash
vercel --prod
```

2. **Update environment variables in Vercel dashboard:**

- `NEXT_PUBLIC_ONCHAINKIT_API_KEY`
- `NEXT_PUBLIC_URL` (your Vercel URL)
- `NEXT_PUBLIC_CONTRACT_ADDRESS`

3. **Update `minikit.config.ts`:**

Update the `accountAssociation` object using the [Farcaster Manifest tool](https://farcaster.xyz/~/developers/mini-apps/manifest) with your production domain.

## Contract Functions

### User Functions

- `logMood(uint256 dayIndex, uint8 moodValue)`: Log a mood for a specific day (0-364)
- `getMood(address user, uint256 dayIndex)`: Get mood value for a specific day
- `isDayLogged(address user, uint256 dayIndex)`: Check if a day has been logged
- `generateSVG(address user)`: Generate SVG grid from on-chain data
- `getUserTokenId(address user)`: Get user's token ID

### View Functions

- `tokenURI(uint256 tokenId)`: Get NFT metadata with on-chain SVG
- `locked(uint256 tokenId)`: Check if token is locked (always true for Soulbound)

## Mood Options

- **0 - Great** (Light Green #E8F5E9) 😊
- **1 - Good** (Light Yellow #FFF9C4) 🙂
- **2 - Okay** (Light Orange #FFE0B2) 😐
- **3 - Neutral** (Light Purple #E1BEE7) 😶
- **4 - Low** (Light Blue #BBDEFB) 😔
- **5 - Bad** (Gray #CFD8DC) 😞
- **6 - Stress** (Light Red #FFCDD2) 😰
- **7 - Very Bad** (Pink #F8BBD0) 😢

## Technical Details

### Bit-Packing Implementation

- Each day uses 3 bits (values 0-7)
- One `uint256` can store ~85 days (256 / 3 = 85.33)
- A full year (365 days) requires ~5 `uint256` slots
- Storage pattern: `moodData[user][slotIndex]` where slotIndex = dayIndex / 85

### SVG Generation

- Grid: 7 columns (days of week) × 53 rows (weeks) = 371 cells
- Each cell: 12px × 12px with 2px spacing
- Colors determined by mood value from on-chain data
- Unlogged days shown in light gray (#F5F5F5)

## License

MIT

## Disclaimer

This project is a demo application created for educational purposes. Always verify smart contracts before deploying to mainnet.
