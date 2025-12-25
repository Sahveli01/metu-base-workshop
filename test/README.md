# BaseLog Test Suite

This directory contains Foundry/Forge tests for the BaseLog smart contract.

## Running Tests

### Run all tests:
```bash
forge test
```

### Run with verbose output:
```bash
forge test -vvv
```

### Run a specific test:
```bash
forge test --match-test testBitmapBoundary
```

### Run with gas reporting:
```bash
forge test --gas-report
```

## Test Coverage

The test suite (`BaseLog.t.sol`) covers:

1. **Basic Functionality** (`testLogMoodBasic`)
   - Verifies basic mood logging works
   - Checks SVG generation doesn't fail

2. **Critical Bitmap Boundary Fix** (`testBitmapBoundary`) ⚠️
   - Tests Day 255 (last bit of first slot)
   - Tests Day 256 (first bit of second slot)
   - Tests Day 364 (last supported day)
   - **This test verifies the fix for the 256-day limit bug**

3. **Bit-Packing Integrity** (`testBitPackingIntegrity`)
   - Ensures Day 0 and Day 1 don't overwrite each other
   - Verifies tokenURI generation works correctly

4. **Soulbound Restrictions** (`testSoulboundRestriction`)
   - Verifies transfers are blocked
   - Ensures ERC-5192 compliance

5. **Input Validation** (`testInvalidInputs`)
   - Tests day index bounds (0-364)
   - Tests mood value bounds (0-7)

## Expected Results

All tests should pass. The critical `testBitmapBoundary` test specifically verifies that:
- Days 0-255 are stored in bitmap slot 0
- Days 256-365 are stored in bitmap slot 1
- No data loss occurs at the boundary

## Troubleshooting

If tests fail:
1. Ensure OpenZeppelin contracts are installed: `forge install OpenZeppelin/openzeppelin-contracts`
2. Check Solidity version matches (0.8.20)
3. Verify remappings are correct in `remappings.txt`

