/**
 * RotationTV — WebApp Sync Engine
 * ================================
 * Ensures Mini App and Web App stay identical:
 * - Version sync
 * - Asset sync
 * - Feature flag sync
 * - Deployment sync
 *
 * Uses KV for state persistence across worker instances.
 *
 * @module webappSyncEngine
 */

interface SyncVersion {
  version: string;
  deployedAt: string;
  bundleHash: string;
  assetManifest: Record<string, string>;
  featureFlags: Record<string, boolean>;
}

const CURRENT_VERSION_KEY = 'webapp:current_version';
const VERSION_PREFIX = 'webapp:version:';

/**
 * Get the current deployed version from KV.
 */
export async function getCurrentVersion(kv: KVNamespace): Promise<SyncVersion | null> {
  const raw = await kv.get(CURRENT_VERSION_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

/**
 * Publish a new version to KV. All clients read this to know which version is live.
 */
export async function publishVersion(kv: KVNamespace, version: SyncVersion): Promise<void> {
  await kv.put(CURRENT_VERSION_KEY, JSON.stringify(version));
  await kv.put(`${VERSION_PREFIX}${version.version}`, JSON.stringify({
    ...version,
    deployedAt: new Date().toISOString(),
  }));
}

/**
 * Check if the client's version matches the latest deployed version.
 * Returns the latest version if the client is outdated, or null if up-to-date.
 */
export async function checkVersionSync(kv: KVNamespace, clientVersion: string): Promise<SyncVersion | null> {
  const current = await getCurrentVersion(kv);
  if (!current) return null;
  if (current.version === clientVersion) return null;
  return current; // Client is outdated, return latest
}

/**
 * Get feature flags for a specific version.
 */
export async function getFeatureFlags(kv: KVNamespace, version?: string): Promise<Record<string, boolean>> {
  const v = version ? await kv.get(`${VERSION_PREFIX}${version}`) : await kv.get(CURRENT_VERSION_KEY);
  if (!v) return {};
  const parsed = JSON.parse(v);
  return parsed.featureFlags || {};
}

/**
 * Update a single feature flag.
 */
export async function setFeatureFlag(kv: KVNamespace, flag: string, enabled: boolean): Promise<void> {
  const current = await getCurrentVersion(kv);
  if (!current) return;
  current.featureFlags[flag] = enabled;
  await kv.put(CURRENT_VERSION_KEY, JSON.stringify(current));
}

/**
 * Compare two asset manifests and return the diff.
 */
export function diffAssets(
  oldManifest: Record<string, string>,
  newManifest: Record<string, string>
): { added: string[]; modified: string[]; removed: string[] } {
  const added: string[] = [];
  const modified: string[] = [];
  const removed: string[] = [];

  for (const [path, hash] of Object.entries(newManifest)) {
    if (!oldManifest[path]) added.push(path);
    else if (oldManifest[path] !== hash) modified.push(path);
  }

  for (const path of Object.keys(oldManifest)) {
    if (!newManifest[path]) removed.push(path);
  }

  return { added, modified, removed };
}

/**
 * Generate the webapp-config.json that the client fetches on init.
 */
export async function generateConfig(kv: KVNamespace, botId: string): Promise<{
  version: string;
  featureFlags: Record<string, boolean>;
  syncEndpoint: string;
  botId: string;
}> {
  const current = await getCurrentVersion(kv);
  return {
    version: current?.version || '0.0.0',
    featureFlags: current?.featureFlags || {},
    syncEndpoint: '/api/webapp/sync',
    botId,
  };
}

export default {
  getCurrentVersion,
  publishVersion,
  checkVersionSync,
  getFeatureFlags,
  setFeatureFlag,
  diffAssets,
  generateConfig,
};
