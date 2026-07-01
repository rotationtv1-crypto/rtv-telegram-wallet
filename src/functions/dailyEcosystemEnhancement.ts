import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const enhancements = [];
    const issues = [];
    const repairs = [];

    // 1. Check nodes
    const nodes = await base44.asServiceRole.entities.ChainstackNode.list();
    for (const node of nodes) {
      if (node.status !== 'active') {
        await base44.asServiceRole.entities.ChainstackNode.update(node.id, { status: 'active' });
        repairs.push(`Reactivated node: ${node.node_name}`);
      } else {
        enhancements.push(`Node healthy: ${node.node_name} (${node.network})`);
      }
    }

    // 2. Check wallets
    const wallets = await base44.asServiceRole.entities.Web3Wallet.list();
    for (const wallet of wallets) {
      if (wallet.status !== 'active') {
        await base44.asServiceRole.entities.Web3Wallet.update(wallet.id, { status: 'active' });
        repairs.push(`Reactivated wallet: ${wallet.wallet_address}`);
      }
    }

    // 3. Check tokens - flag stale syncs
    const tokens = await base44.asServiceRole.entities.RTVToken.list();
    const now = new Date();
    for (const token of tokens) {
      const lastSync = token.last_synced ? new Date(token.last_synced) : null;
      const hoursSinceSync = lastSync ? (now.getTime() - lastSync.getTime()) / 3600000 : 999;
      if (hoursSinceSync > 24) {
        issues.push(`RTVToken sync stale for wallet: ${token.wallet_address} — needs re-sync`);
      } else {
        enhancements.push(`RTVToken synced for: ${token.wallet_address}`);
      }
    }

    // 4. Check stuck pending transactions
    const transactions = await base44.asServiceRole.entities.RotationPayTransaction.list();
    const pendingTxs = transactions.filter((t: any) => t.status === 'pending');
    for (const tx of pendingTxs) {
      const txAge = tx.timestamp ? (now.getTime() - new Date(tx.timestamp).getTime()) / 3600000 : 0;
      if (txAge > 2) {
        await base44.asServiceRole.entities.RotationPayTransaction.update(tx.id, { status: 'review_required' });
        issues.push(`Transaction ${tx.id} stuck pending >2h — flagged for review`);
      }
    }

    // 5. Check NFT assets
    const nfts = await base44.asServiceRole.entities.NFTAsset.list();
    const pendingNFTs = nfts.filter((n: any) => n.status === 'pending');
    if (pendingNFTs.length > 0) {
      issues.push(`${pendingNFTs.length} NFT(s) still in pending status — may need minting`);
    }

    const report = {
      timestamp: new Date().toISOString(),
      ecosystem: 'RotationTV Network',
      daily_enhancement_run: true,
      summary: {
        enhancements: enhancements.length,
        repairs: repairs.length,
        issues: issues.length,
      },
      enhancements,
      repairs,
      issues,
      next_run: '24 hours',
    };

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
