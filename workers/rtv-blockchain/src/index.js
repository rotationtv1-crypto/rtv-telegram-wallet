/**
 * RTV Blockchain Worker v3.0.0
 * TON (primary) + Solana (secondary, 4 Chainstack nodes)
 * Treasury: 7hRzRpv5KnA9B2GnTHJatQmKTzx6CK94p66US7LR8pkv
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    try {
      if (path === '/health') return j({ status: 'healthy', networks: { ton: 'primary', solana: 'secondary' }, nodes: 4, treasury: '7hRzRpv5KnA9B2GnTHJatQmKTzx6CK94p66US7LR8pkv' }, cors);
      if (path === '/api/ton/info') { const r = await fetch(env.TON_RPC_ENDPOINT || 'https://ton-chainstack.com/v3/mainchainInfo'); return j({ network: 'TON', data: await r.json() }, cors); }
      if (path === '/api/solana/info') { const r = await fetch(env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' }) }); return j({ network: 'Solana', data: await r.json() }, cors); }
      if (path === '/api/wallet/check') { const b = await request.json(); return j({ wallet: b.address, network: b.network || 'solana', balance: 'pending', message: 'Configure RPC for live reads' }, cors); }
      if (path === '/api/nft/list') return j({ total: 27, networks: ['ton', 'solana'], status: 'active' }, cors);
      return j({ error: 'Not found' }, cors, 404);
    } catch (e) { return j({ error: e.message }, cors, 500); }
  }
};
function j(d, c, s = 200) { return new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', ...c } }); }
