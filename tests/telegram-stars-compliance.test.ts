/**
 * Smoke tests — Telegram Stars + Cloud SDK compliance
 * Run: npx vitest run tests/telegram-stars-compliance.test.ts
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();

function read(path: string): string {
  const p = join(root, path);
  if (!existsSync(p)) return "";
  return readFileSync(p, "utf8");
}

describe("Stars payment path present", () => {
  it("useStarsPayment hook exists", () => {
    const src = read("src/hooks/useStarsPayment.ts");
    expect(src.length).toBeGreaterThan(0);
    expect(src).toMatch(/openInvoice|stars/i);
  });

  it("telegramStars lib exists", () => {
    const src = read("src/lib/telegramStars.ts");
    expect(src.length).toBeGreaterThan(0);
  });
});

describe("Go Live media permissions", () => {
  it("GoLiveModal requests getUserMedia", () => {
    const src = read("src/components/GoLiveModal.tsx");
    expect(src).toContain("getUserMedia");
    expect(src).toMatch(/permState|denied|granted/);
  });
});

describe("No hardcoded secret patterns in active hooks", () => {
  it("useStarsPayment has no sk- keys", () => {
    const src = read("src/hooks/useStarsPayment.ts");
    expect(src).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
  });
});
