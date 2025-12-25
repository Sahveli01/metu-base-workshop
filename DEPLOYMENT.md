# BaseLog Deployment Guide

## Quick Start

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install OpenZeppelin contracts
forge install OpenZeppelin/openzeppelin-contracts
```

### 2. Environment Setup

Create `.env.local`:

```bash
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_cdp_api_key_here
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
PRIVATE_KEY=your_deployment_private_key
```

### 3. Deploy Smart Contract

#### Base Sepolia (Testnet)

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export RPC_URL=https://sepolia.base.org
export ETHERSCAN_API_KEY=your_basescan_api_key

# Deploy
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

**Base Sepolia Chain ID:** 84532

#### Base Mainnet

```bash
export RPC_URL=https://mainnet.base.org

forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

**Base Mainnet Chain ID:** 8453

### 4. Update Frontend Configuration

After deployment, update `.env.local`:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Vercel Deployment

### 1. Deploy to Vercel

```bash
vercel --prod
```

### 2. Configure Environment Variables

In Vercel dashboard, add:

- `NEXT_PUBLIC_ONCHAINKIT_API_KEY`
- `NEXT_PUBLIC_URL` (your Vercel URL, e.g., `https://your-app.vercel.app`)
- `NEXT_PUBLIC_CONTRACT_ADDRESS`

### 3. Update Farcaster Manifest

1. Go to [Farcaster Manifest Tool](https://farcaster.xyz/~/developers/mini-apps/manifest)
2. Enter your production domain
3. Generate and copy the `accountAssociation` object
4. Update `minikit.config.ts` with the new `accountAssociation`

### 4. Redeploy

```bash
vercel --prod
```

## Testing

### Local Testing

1. Start local dev server: `npm run dev`
2. Connect wallet (ensure you're on Base network)
3. Log a mood using the mood selector
4. View your grid updating in real-time

### Testnet Testing

1. Deploy to Base Sepolia
2. Get testnet ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
3. Test all contract functions
4. Verify SVG generation works correctly

## Contract Verification

After deployment, verify on Basescan:

```bash
forge verify-contract \
  --chain-id 8453 \
  --num-of-optimizations 200 \
  --watch \
  --constructor-args $(cast abi-encode "constructor(address)" $DEPLOYER_ADDRESS) \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  $CONTRACT_ADDRESS \
  contracts/BaseLog.sol:BaseLog
```

## Troubleshooting

### Contract Deployment Issues

- **Insufficient funds**: Ensure deployer address has enough ETH for gas
- **RPC errors**: Check RPC URL is correct and accessible
- **Verification fails**: Ensure constructor args match deployment

### Frontend Issues

- **Contract not found**: Verify `NEXT_PUBLIC_CONTRACT_ADDRESS` is set correctly
- **Wrong network**: Ensure wallet is connected to Base (mainnet or Sepolia)
- **Transaction fails**: Check contract is deployed and address is correct

### Farcaster Integration

- **Mini App not loading**: Verify `accountAssociation` is correctly configured
- **Auth errors**: Check API route `/api/auth` is working
- **Manifest errors**: Validate manifest at [Base.dev Preview](https://base.dev/preview)

## Gas Estimates

Approximate gas costs on Base:

- **Deploy Contract**: ~2,500,000 gas
- **Log Mood (first time)**: ~150,000 gas (includes minting)
- **Log Mood (subsequent)**: ~80,000 gas
- **View Functions**: Free (no transaction)

## Security Checklist

- [ ] Contract verified on Basescan
- [ ] Private keys stored securely (never commit to git)
- [ ] Environment variables configured correctly
- [ ] Contract address updated in frontend
- [ ] Farcaster manifest configured
- [ ] Tested on testnet before mainnet deployment

