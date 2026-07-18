import puppeteer from "@cloudflare/puppeteer";

interface Env { BROWSER_RENDERING: Fetcher; }

/**
 * AI Stream Moderation — Cloudflare Browser Rendering
 * Captures live stream frames for content analysis
 */
export async function captureStreamFrame(env: Env, streamUrl: string): Promise<string | null> {
  const browser = await puppeteer.launch(env.BROWSER_RENDERING);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(streamUrl, { waitUntil: "networkidle2", timeout: 15000 });
    await page.waitForSelector("video", { timeout: 10000 }).catch(() => null);
    const screenshot = await page.screenshot({ encoding: "base64", type: "png" });
    return screenshot as string;
  } catch (err) {
    console.error("Frame capture failed:", err);
    return null;
  } finally {
    await browser.close();
  }
}

export async function captureMultipleFrames(env: Env, streams: { id: string; url: string }[]): Promise<{ stream_id: string; frame: string | null }[]> {
  const results: { stream_id: string; frame: string | null }[] = [];
  for (const stream of streams) {
    const frame = await captureStreamFrame(env, stream.url);
    results.push({ stream_id: stream.id, frame });
  }
  return results;
}
