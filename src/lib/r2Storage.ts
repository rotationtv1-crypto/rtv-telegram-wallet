/**
 * Cloudflare R2 — Asset Storage Helper
 * Stores event banners, creator avatars, and stream thumbnails
 */

interface Env { ASSETS_BUCKET: R2Bucket; }

interface UploadResult { success: boolean; key: string; url: string; size: number; etag: string; }

export async function uploadToR2(env: Env, key: string, data: ArrayBuffer | ReadableStream | string, options: { contentType?: string; cacheControl?: string; customMetadata?: Record<string, string> } = {}): Promise<UploadResult> {
  const object = await env.ASSETS_BUCKET.put(key, data, { httpMetadata: { contentType: options.contentType || "application/octet-stream", cacheControl: options.cacheControl || "public, max-age=31536000, immutable" }, customMetadata: options.customMetadata });
  if (!object) return { success: false, key, url: "", size: 0, etag: "" };
  return { success: true, key, url: `https://assets.rotationtvai.com/${key}`, size: object.size, etag: object.etag };
}

export async function storeEventBanner(env: Env, creatorId: string, milestone: string, imageData: ArrayBuffer, metadata: { subscriber_count: number; event_type: string }): Promise<UploadResult> {
  const key = `banners/${creatorId}/${milestone}-${Date.now()}.png`;
  return uploadToR2(env, key, imageData, { contentType: "image/png", customMetadata: { creator_id: creatorId, milestone, subscriber_count: metadata.subscriber_count.toString(), event_type: metadata.event_type, generated_at: new Date().toISOString() } });
}

export async function storeStreamThumbnail(env: Env, streamId: string, frameData: ArrayBuffer): Promise<UploadResult> {
  const key = `thumbnails/${streamId}/${Date.now()}.jpg`;
  return uploadToR2(env, key, frameData, { contentType: "image/jpeg", cacheControl: "public, max-age=86400", customMetadata: { stream_id: streamId, captured_at: new Date().toISOString() } });
}

export async function storeCreatorAvatar(env: Env, creatorId: string, imageData: ArrayBuffer, contentType: string = "image/png"): Promise<UploadResult> {
  const key = `avatars/${creatorId}/profile-${Date.now()}.${contentType.split("/")[1] || "png"}`;
  return uploadToR2(env, key, imageData, { contentType, cacheControl: "public, max-age=604800", customMetadata: { creator_id: creatorId, uploaded_at: new Date().toISOString() } });
}

export async function listAssets(env: Env, prefix: string, limit: number = 100): Promise<{ key: string; size: number; uploaded: Date }[]> {
  const listed = await env.ASSETS_BUCKET.list({ prefix, limit });
  return listed.objects.map(obj => ({ key: obj.key, size: obj.size, uploaded: obj.uploaded }));
}

export async function deleteFromR2(env: Env, key: string): Promise<boolean> {
  await env.ASSETS_BUCKET.delete(key);
  return true;
}
