/**
 * RotationTV — Jetton Transfer Builder + TonConnect Payload
 * ========================================================
 * Builds unsigned Jetton transfer messages for $RTVS.
 * Client signs with TonConnect; Worker only prepares + optionally broadcasts.
 *
 * Entity: Darrel-spell-living-trust
 * NEVER put private keys or mnemonics here.
 */

import { beginCell, toNano, Address, Cell } from '@ton/core';

export interface JettonTransferParams {
  /** Jetton wallet address of the sender (not the master) */
  jettonWalletAddress: string;
  /** Destination TON wallet that will receive the Jetton */
  toAddress: string;
  /** Amount in whole tokens (will be scaled by decimals) */
  amount: number;
  /** Jetton decimals (RTVS = 9) */
  decimals?: number;
  /** Forward TON amount for notification (usually 0.05 TON) */
  forwardTonAmount?: string;
  /** Optional comment / payload (UTF-8) */
  comment?: string;
  /** Response destination (usually sender) */
  responseAddress?: string;
  /** Query ID for tracking */
  queryId?: bigint;
}

export interface PreparedTransfer {
  /** Address to send the external message to (the sender's Jetton wallet) */
  to: string;
  /** Amount of TON to attach (gas + forward) */
  value: string;
  /** Base64 BOC body ready for TonConnect */
  body: string;
  /** Human-readable summary */
  summary: {
    amount: number;
    symbol: string;
    to: string;
    comment?: string;
  };
}

/**
 * Build a standard Jetton transfer body (opcode 0xf8a7ea5).
 * Returns a PreparedTransfer that the frontend feeds to TonConnect.
 */
export function buildJettonTransfer(params: JettonTransferParams): PreparedTransfer {
  const decimals = params.decimals ?? 9;
  const amountNano = BigInt(Math.floor(params.amount * 10 ** decimals));
  const forwardAmount = toNano(params.forwardTonAmount ?? '0.05');
  const queryId = params.queryId ?? BigInt(Date.now());

  const to = Address.parse(params.toAddress);
  const response = Address.parse(params.responseAddress ?? params.toAddress);

  // Optional forward payload (comment)
  let forwardPayload: Cell | null = null;
  if (params.comment) {
    forwardPayload = beginCell()
      .storeUint(0, 32) // text comment opcode
      .storeStringTail(params.comment)
      .endCell();
  }

  const body = beginCell()
    .storeUint(0xf8a7ea5, 32) // jetton transfer opcode
    .storeUint(queryId, 64)
    .storeCoins(amountNano)
    .storeAddress(to)
    .storeAddress(response)
    .storeBit(false) // custom payload = none
    .storeCoins(forwardAmount)
    .storeBit(!!forwardPayload)
    .storeMaybeRef(forwardPayload)
    .endCell();

  // Gas: ~0.05–0.1 TON is usually enough for transfer + forward
  const value = toNano('0.1').toString();

  return {
    to: params.jettonWalletAddress,
    value,
    body: body.toBoc().toString('base64'),
    summary: {
      amount: params.amount,
      symbol: 'RTVS',
      to: params.toAddress,
      comment: params.comment,
    },
  };
}

/**
 * Resolve the user's Jetton wallet address for a given master.
 * Call this before buildJettonTransfer.
 */
export async function resolveJettonWallet(
  ownerAddress: string,
  jettonMaster: string,
  chainstackV3: string
): Promise<{ walletAddress: string; balance: string } | null> {
  const url = `${chainstackV3}/jetton/wallets?owner_address=${encodeURIComponent(ownerAddress)}&jetton_address=${encodeURIComponent(jettonMaster)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json() as any;
  const wallet = data.jetton_wallets?.[0];
  if (!wallet) return null;
  return {
    walletAddress: wallet.address,
    balance: wallet.balance ?? '0',
  };
}

/**
 * Worker route helper — prepares a transfer payload for the client.
 * POST /api/ton/jetton/prepare-transfer
 * Body: { owner, to, amount, comment? }
 */
export async function prepareTransferRoute(
  request: Request,
  env: { RTVS_JETTON: string; CHAINSTACK_V3: string }
): Promise<Response> {
  const CORS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body = await request.json() as {
      owner: string;
      to: string;
      amount: number;
      comment?: string;
    };

    if (!body.owner || !body.to || !body.amount || body.amount <= 0) {
      return Response.json({ ok: false, error: 'owner, to, amount required' }, { status: 400, headers: CORS });
    }

    const resolved = await resolveJettonWallet(body.owner, env.RTVS_JETTON, env.CHAINSTACK_V3);
    if (!resolved) {
      return Response.json({ ok: false, error: 'No Jetton wallet found for owner' }, { status: 404, headers: CORS });
    }

    const prepared = buildJettonTransfer({
      jettonWalletAddress: resolved.walletAddress,
      toAddress: body.to,
      amount: body.amount,
      comment: body.comment,
      responseAddress: body.owner,
    });

    return Response.json({
      ok: true,
      prepared,
      balance: resolved.balance,
      note: 'Pass prepared.to / prepared.value / prepared.body to TonConnect sendTransaction',
    }, { headers: CORS });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message }, { status: 500, headers: CORS });
  }
}
