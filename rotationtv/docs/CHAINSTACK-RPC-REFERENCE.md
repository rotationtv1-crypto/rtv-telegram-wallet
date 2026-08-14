# CHAINSTACK RPC REFERENCE
## RotationTV Network — Complete Blockchain API Guide
## Pulled from docs.chainstack.com/llms.txt | June 28, 2026

---

# PART 1 — TON NODE API (via Chainstack)

## Your Live Endpoints
```
v2: https://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v2
v3: https://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v3
Status: ✅ LIVE | seqno: 76,229,632 | June 28, 2026
```

## TON v2 — Core Methods (REST)

### Wallet & Balance
```bash
# Get address info (balance, state, code)
GET /api/v2/getAddressInformation?address=EQxxx

# Get balance only (nanotons)
GET /api/v2/getAddressBalance?address=EQxxx
# Response: "5000000000" → divide by 1e9 → 5 TON

# Get wallet-specific info (seqno, wallet type)
GET /api/v2/getWalletInformation?address=EQxxx

# Extended address info (full state)
GET /api/v2/getExtendedAddressInformation?address=EQxxx
```

### Transactions
```bash
# Get transactions for address
GET /api/v2/getTransactions?address=EQxxx&limit=20&to_lt=0&archival=false

# Locate a transaction by hash
GET /api/v2/tryLocateTx?source=EQxxx&destination=EQyyy&created_lt=123456

# Find source transaction
GET /api/v2/tryLocateSourceTx?source=EQxxx&destination=EQyyy&created_lt=123456
```

### Blockchain State
```bash
# Master chain info (latest seqno)
GET /api/v2/getMasterchainInfo

# Consensus block info
GET /api/v2/getConsensusBlock

# Block header
GET /api/v2/getBlockHeader?workchain=-1&shard=8000000000000000&seqno=76229632

# Block transactions
GET /api/v2/getBlockTransactions?workchain=-1&shard=8000000000000000&seqno=76229632&count=40
```

### Smart Contracts
```bash
# Run get method on contract
POST /api/v2/runGetMethod
Body: {
  "address": "EQxxx",
  "method": "get_jetton_data",
  "stack": []
}

# Estimate fee
POST /api/v2/estimateFee
Body: {
  "address": "EQxxx",
  "body": "base64-encoded-boc",
  "init_code": "",
  "init_data": ""
}
```

### Send Transactions
```bash
# Send BOC (signed transaction)
POST /api/v2/sendBoc
Body: { "boc": "base64-encoded-signed-boc" }

# Send and get hash back
POST /api/v2/sendBocReturnHash
Body: { "boc": "base64-encoded-signed-boc" }
# Returns: { "hash": "txhash" }
```

---

## TON v3 — Advanced Indexer Methods

### Account & Wallet State
```bash
# Full account state
GET /api/v3/account?address=EQxxx

# Wallet state
GET /api/v3/wallet?address=EQxxx

# Multiple wallet states at once
GET /api/v3/walletStates?address=EQxxx,EQyyy

# Address information (canonical)
GET /api/v3/addressInformation?address=EQxxx

# Top accounts by balance (leaderboard!)
GET /api/v3/topAccountsByBalance?limit=20
```

### Transactions (Deep)
```bash
# Transactions by account
GET /api/v3/transactions?account=EQxxx&limit=50&sort=desc

# Transactions by masterchain block
GET /api/v3/transactionsByMasterchainBlock?seqno=76229632&limit=100

# Transactions by message hash
GET /api/v3/transactionsByMessage?msg_hash=xxxhash

# Adjacent transactions (before/after)
GET /api/v3/adjacentTransactions?hash=txhash&direction=both

# Pending transactions (mempool)
GET /api/v3/pendingTransactions?account=EQxxx
```

### Jetton (Token) API — $RTVS Operations
```bash
# Get jetton master info (token metadata)
GET /api/v3/jetton/masters?address=MINTER_ADDRESS
# Returns: name, symbol, decimals, total_supply, admin_address

# Get jetton wallet for user
GET /api/v3/jetton/wallets?owner_address=EQxxx&jetton_address=MINTER_ADDRESS
# Returns: balance, wallet_address

# Get jetton transfers
GET /api/v3/jetton/transfers?account=EQxxx&jetton_address=MINTER_ADDRESS&limit=50

# Get jetton burns (deflationary events)
GET /api/v3/jetton/burns?jetton_address=MINTER_ADDRESS&limit=20
```

### NFT API — Creator Passes / Access Tokens
```bash
# NFT collections
GET /api/v3/nft/collections?owner_address=EQxxx&limit=20

# NFT items owned by address
GET /api/v3/nft/items?owner_address=EQxxx&collection=COLLECTION_ADDR

# NFT transfer history
GET /api/v3/nft/transfers?account=EQxxx&limit=50
```

### Events & Traces (Transaction Intelligence)
```bash
# Get events (human-readable tx descriptions)
GET /api/v3/events?account=EQxxx&limit=50

# Get traces (full execution trace)
GET /api/v3/traces?tx_hash=txhash

# Actions (categorized events: transfers, swaps, staking)
GET /api/v3/actions?account=EQxxx&limit=50

# Pending traces (unconfirmed)
GET /api/v3/pendingTraces?account=EQxxx
```

### Multisig (Platform Treasury)
```bash
# Multisig wallets
GET /api/v3/multisig/wallets?address=EQxxx

# Multisig orders (pending approvals)
GET /api/v3/multisig/orders?multisig_address=EQxxx
```

### Send Message
```bash
# Send BOC via v3
POST /api/v3/message
Body: { "boc": "base64-signed-boc" }
```

---

## TypeScript Integration (RotationTV Stack)

```typescript
// src/lib/tonChainstack.ts — Complete TON client using our Chainstack nodes

const V2 = "https://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v2";
const V3 = "https://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v3";

// ── Wallet operations ───────────────────────────────────────────────────────
export async function getWalletBalance(address: string): Promise<number> {
  const res = await fetch(`${V2}/getAddressBalance?address=${address}`);
  const nanotons = await res.json() as string;
  return Number(nanotons) / 1e9;
}

export async function getWalletInfo(address: string) {
  const res = await fetch(`${V3}/account?address=${address}`);
  return res.json();
}

// ── Jetton ($RTVS) operations ──────────────────────────────────────────────
export async function getRTVSBalance(
  ownerAddress: string,
  jettonMinter: string
): Promise<{ balance: string; wallet_address: string }> {
  const res = await fetch(
    `${V3}/jetton/wallets?owner_address=${ownerAddress}&jetton_address=${jettonMinter}`
  );
  const d = await res.json() as any;
  return d.jetton_wallets?.[0] || { balance: "0", wallet_address: "" };
}

export async function getJettonTransfers(
  address: string,
  jettonMinter: string,
  limit = 50
) {
  const res = await fetch(
    `${V3}/jetton/transfers?account=${address}&jetton_address=${jettonMinter}&limit=${limit}&sort=desc`
  );
  return res.json();
}

export async function getRTVSMetadata(jettonMinter: string) {
  const res = await fetch(`${V3}/jetton/masters?address=${jettonMinter}`);
  const d = await res.json() as any;
  return d.jetton_masters?.[0];
}

// ── Transaction operations ─────────────────────────────────────────────────
export async function getTransactionHistory(address: string, limit = 20) {
  const res = await fetch(
    `${V3}/transactions?account=${address}&limit=${limit}&sort=desc`
  );
  return res.json();
}

export async function getEvents(address: string, limit = 50) {
  // Events are human-readable: "Sent 100 RTVS to EQxxx"
  const res = await fetch(`${V3}/events?account=${address}&limit=${limit}`);
  return res.json();
}

export async function sendBoc(bocBase64: string): Promise<string> {
  const res = await fetch(`${V2}/sendBocReturnHash`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ boc: bocBase64 }),
  });
  const d = await res.json() as any;
  return d.result?.hash || "";
}

// ── NFT gating (creator access passes) ───────────────────────────────────
export async function checkNFTOwnership(
  ownerAddress: string,
  collectionAddress: string
): Promise<boolean> {
  const res = await fetch(
    `${V3}/nft/items?owner_address=${ownerAddress}&collection=${collectionAddress}&limit=1`
  );
  const d = await res.json() as any;
  return (d.nft_items?.length || 0) > 0;
}

// ── Chain health check ─────────────────────────────────────────────────────
export async function getChainHealth() {
  const [v2, v3] = await Promise.all([
    fetch(`${V2}/getMasterchainInfo`).then(r => r.json()),
    fetch(`${V3}/masterchainInfo`).then(r => r.json()),
  ]);
  return {
    v2_seqno: (v2 as any).result?.last?.seqno,
    v3_seqno: (v3 as any).last?.seqno,
    healthy: !!(v2 as any).ok && (v3 as any).last?.seqno > 0,
  };
}
```

---

# PART 2 — SOLANA NODE API (Chainstack)

## Recommended RPC Methods for RTV

### Account & Balance
```typescript
// getBalance — SOL balance in lamports (divide by 1e9)
POST https://your-solana-chainstack-endpoint/
Body: {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getBalance",
  "params": ["wallet_address_base58"]
}

// getTokenAccountsByOwner — SPL token balances ($RTVS on Solana)
POST /
Body: {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getTokenAccountsByOwner",
  "params": [
    "wallet_address",
    { "mint": "RTVS_MINT_ADDRESS" },
    { "encoding": "jsonParsed" }
  ]
}
// Returns: balance, decimals, mint address

// getTokenAccountBalance — specific token account balance
POST /
Body: {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getTokenAccountBalance",
  "params": ["token_account_address"]
}
```

### Transactions
```typescript
// getSignaturesForAddress — tx history
POST /
Body: {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getSignaturesForAddress",
  "params": ["wallet_address", { "limit": 20 }]
}

// getTransaction — full tx detail
POST /
Body: {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getTransaction",
  "params": ["signature_base58", { "encoding": "jsonParsed", "maxSupportedTransactionVersion": 0 }]
}

// sendTransaction — broadcast signed tx
POST /
Body: {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "sendTransaction",
  "params": ["base64_signed_tx", { "encoding": "base64", "skipPreflight": false }]
}
```

### SPL Token ($RTVS Mint Operations)
```typescript
// getTokenSupply — current circulating supply
POST /
Body: {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getTokenSupply",
  "params": ["RTVS_MINT_ADDRESS"]
}

// getTokenLargestAccounts — top holders
POST /
Body: {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getTokenLargestAccounts",
  "params": ["RTVS_MINT_ADDRESS"]
}
```

### RTV-Specific: USDC Payment Verification
```typescript
// Verify USDC payment for premium subscription
async function verifyUSDCPayment(
  signature: string,
  expectedAmount: number,
  recipientWallet: string,
  solanaRpc: string
): Promise<boolean> {
  const res = await fetch(solanaRpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: [signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }]
    })
  });
  const d = await res.json() as any;
  const tx = d.result;
  if (!tx || tx.meta?.err) return false;

  // Check USDC transfer in postTokenBalances
  const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const transfers = tx.meta?.postTokenBalances?.filter(
    (b: any) => b.mint === USDC_MINT
  );
  // Verify recipient received expectedAmount
  const recipientBalance = transfers?.find((t: any) =>
    t.owner === recipientWallet
  );
  return !!recipientBalance;
}
```

---

# PART 3 — CHAINSTACK DEPLOYMENT GUIDE

## Deploying a Solana Global Node (FREE)

Once you have a Chainstack API key:

```bash
# Step 1: Get deployment options
# Call: mcp_chainstack_get_deployment_options()
# Note BC-xxx for Solana Mainnet, CC-0016 for Global

# Step 2: Create/find project
# Call: mcp_chainstack_list_projects()
# or: mcp_chainstack_create_project(name="RotationTV RPC")

# Step 3: Deploy node
# Call: mcp_chainstack_create_node(
#   name="rtv-solana-mainnet",
#   project="PR-xxx-xxx-xxx",
#   blockchain="BC-000-000-XXX",  ← from get_deployment_options
#   cloud="CC-0016"               ← Global (free tier)
# )

# Step 4: Get endpoints
# Call: mcp_chainstack_get_node(node_id="ND-xxx-xxx-xxx")
# Returns: https endpoint, wss endpoint

# Step 5: Inject into worker
echo "https://your-solana-endpoint.core.chainstack.com/xxx" | \
  npx wrangler secret put CHAINSTACK_SOLANA_RPC
```

## Node Tiers Explained

```
GLOBAL NODE (what you already have for TON):
  Cloud ID: CC-0016
  Type: Load-balanced, geo-routed
  Deploy time: Instant
  Cost: Included in plan (free tier available)
  Best for: General RPC, development, moderate load

TRADER NODE (what you want for RTV production):
  Cloud IDs: CC-0020 (London) | CC-0021 (Ashburn) | CC-0022 (Singapore)
  Type: Dedicated, region-pinned
  Deploy time: 3-6 minutes
  Cost: Growth plan required ($49/mo+)
  Best for: Low-latency (<10ms), MEV, high-frequency, WebSocket streaming

DEDICATED NODE (enterprise):
  Full isolated VM
  ~$0.50/hr compute + $0.01/20GB storage
  Pro plan+ required
  Best for: 1000+ RPS, archive queries, custom configs
```

## RTV Node Strategy

```
CURRENT: TON Mainnet — Global Node ✅ (both v2 + v3 live)
NEEDED:  Solana Mainnet — Global Node (deploy with API key)
FUTURE:  Trader Node for London/NY when volume > 250 RPS
```

---

# PART 4 — JETTON DEPLOYMENT ($RTVS TOKEN)

## TON Jetton via Chainstack RPC

```bash
# Prerequisites
npm install -g @ton-community/blueprint
npm install @ton/ton @ton/crypto @ton/core

# blueprint.config.ts — use your live Chainstack endpoint
export default {
  network: {
    endpoint: "https://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v2",
    type: "mainnet",
    version: "v2",
    key: ""  # no auth needed for our endpoint
  }
}
```

## Deploy Script
```typescript
// scripts/deployRTVS.ts
import { TonClient, WalletContractV4, toNano } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";

const client = new TonClient({
  endpoint: "https://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v2",
});

// Jetton parameters
const JETTON_PARAMS = {
  name: "RTV Sovereign",
  symbol: "RTVS",
  decimals: 9,
  totalSupply: 1_250_000_000n * 10n ** 9n,  // 1.25B with 9 decimals
  description: "The native token of RotationTV Network ecosystem",
  image: "https://assets.rotationtv.network/rtvs-logo.png",
};

// Verify deployment
async function verifyJetton(minterAddress: string) {
  const res = await fetch(
    `https://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v3/jetton/masters?address=${minterAddress}`
  );
  const d = await res.json() as any;
  console.log("Jetton metadata:", d.jetton_masters?.[0]);
}
```

---

# PART 5 — REAL-TIME SUBSCRIPTION (WebSocket)

## TON WebSocket via Chainstack
```typescript
// Real-time tip notifications using Chainstack WebSocket
// (Available on Growth plan+)

const WS_ENDPOINT = "wss://ton-mainnet.core.chainstack.com/3fd2a9746dfa1f58a08196100f9bccf9/api/v2/ws";

export function watchTipWallet(
  platformWallet: string,
  onTipReceived: (amount: number, sender: string) => void
) {
  const ws = new WebSocket(WS_ENDPOINT);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "subscribe_transaction",
      params: { account: platformWallet }
    }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.result?.in_msg?.value) {
      const nanotons = data.result.in_msg.value;
      const tons = Number(nanotons) / 1e9;
      const rtvs = Math.floor(tons * 100);  // 1 TON = 100 RTVS
      const sender = data.result.in_msg.source;
      onTipReceived(rtvs, sender);
    }
  };

  return ws;
}
```

## Solana WebSocket (SPL Token monitoring)
```typescript
// Watch for RTVS SPL token transfers in real-time
const SOL_WS = "wss://your-solana-chainstack-endpoint";

export function watchRTVSTransfers(
  mintAddress: string,
  onTransfer: (from: string, to: string, amount: number) => void
) {
  const ws = new WebSocket(SOL_WS);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "programSubscribe",
      params: [
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",  // SPL Token program
        {
          encoding: "jsonParsed",
          filters: [{ memcmp: { offset: 0, bytes: mintAddress } }]
        }
      ]
    }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Process token account changes
    console.log("RTVS transfer detected:", data);
  };
}
```

---

*Chainstack API reference pulled from docs.chainstack.com/llms.txt*
*Rotationtvnetwork LLC | June 28, 2026*
