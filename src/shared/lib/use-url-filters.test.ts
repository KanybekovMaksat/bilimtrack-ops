import { describe, expect, it } from "vitest";
import { patchParams, readList } from "./use-url-filters";

const params = (s: string) => new URLSearchParams(s);

describe("patchParams", () => {
  it("sets values and keeps the keys the patch does not mention", () => {
    expect(patchParams(params("tab=all"), { category: "technical", org: 5 }).toString()).toBe("tab=all&category=technical&org=5");
  });

  it("removes a key for empty, null, undefined, false and an empty list", () => {
    const prev = params("a=1&b=2&c=3&d=4&e=5&keep=1");
    expect(patchParams(prev, { a: "", b: null, c: undefined, d: false, e: [] }).toString()).toBe("keep=1");
  });

  it("stores a flag as 1 and a list joined by commas", () => {
    const next = patchParams(params(""), { stale: true, priority: ["urgent", "high"] });
    expect(next.get("stale")).toBe("1");
    expect(next.get("priority")).toBe("urgent,high");
  });

  it("resets the page on any filter change", () => {
    expect(patchParams(params("page=4&status=paid"), { status: "failed" }).toString()).toBe("status=failed");
  });

  it("keeps or sets the page when the patch names it", () => {
    expect(patchParams(params("page=4"), { payment: "abc", page: "4" }).get("page")).toBe("4");
    expect(patchParams(params("status=paid"), { page: 2 }).toString()).toBe("status=paid&page=2");
  });

  it("does not mutate the previous params", () => {
    const prev = params("page=4");
    patchParams(prev, { q: "x" });
    expect(prev.toString()).toBe("page=4");
  });
});

describe("readList", () => {
  const allowed = ["urgent", "high", "low"] as const;

  it("returns the chosen values in the order of the allowed list", () => {
    expect(readList(params("p=low,urgent"), "p", allowed)).toEqual(["urgent", "low"]);
  });

  it("drops values that are not allowed (hand-edited URL)", () => {
    expect(readList(params("p=high,hacked"), "p", allowed)).toEqual(["high"]);
  });

  it("is empty when the key is absent", () => {
    expect(readList(params(""), "p", allowed)).toEqual([]);
  });
});
