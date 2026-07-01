import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Check all ecosystem nodes
    const nodes = await base44.asServiceRole.entities.ChainstackNode.list();
    const wallets = await base44.asServiceRole.entities.Web3Wallet.list();
    const tokens = await base44.asServiceRole.entities.RTVToken.list();
    const nfts = await base44.asServiceRole.entities.NFTAsset.list();
    const transactions = await base44.asServiceRole.entities.RotationPayTransaction.list();

    const activeNodes = nodes.filter((n: any) => n.status === 'active');
    const activeWallets = wallets.filter((w: any) => w.status === 'active');
    const pendingTxs = transactions.filter((t: any) => t.status === 'pending');
    const confirmedTxs = transactions.filter((t: any) => t.blockchain_confirmed === true);

    const health = {
      timestamp: new Date().toISOString(),
      ecosystem: 'RotationTV Network',
      status: 'ONLINE',
      nodes: {
        total: nodes.length,
        active: activeNodes.length,
        networks: activeNodes.map((n: any) => n.network),
      },
      wallets: {
        total: wallets.length,
        active: activeWallets.length,
      },
      tokens: {
        total: tokens.length,
        records: tokens.map((t: any) => ({
          wallet: t.wallet_address,
          balance: t.balance,
          staking_rewards: t.staking_rewards,
          last_synced: t.last_synced,
        })),
      },
      nfts: {
        total: nfts.length,
        by_status: nfts.reduce((acc: any, n: any) => {
          acc[n.status] = (acc[n.status] || 0) + 1;
          return acc;
        }, {}),
      },
      transactions: {
        total: transactions.length,
        pending: pendingTxs.length,
        confirmed: confirmedTxs.length,
      },
      score: Math.round(
        ((activeNodes.length > 0 ? 25 : 0) +
        (nodes.length > 0 ? 25 : 0) +
        (pendingTxs.length === 0 ? 25 : 15) +
        25) // base score
      ),
    };

    return Response.json(health);
  } catch (error) {
    return Response.json({ error: error.message, status: 'ERROR' }, { status: 500 });
  }
});
