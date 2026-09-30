import { useState } from "react";
import { useSearchParams } from "react-router";
import { useDebouncedEffect } from "./use-debounced-effect";

type Patch = Record<string, string | number | boolean | readonly string[] | null | undefined>;

export type UrlFilters = {
  /** Raw value or undefined when the key is absent / empty. */
  get: (key: string) => string | undefined;
  /** Flag stored as `key=1`. */
  flag: (key: string) => boolean;
  /** Positive integer or undefined (ids, page). */
  num: (key: string) => number | undefined;
  /** One of `allowed`, otherwise undefined: a hand-edited URL never leaks an unknown value into a query. */
  oneOf: <T extends string>(key: string, allowed: readonly T[]) => T | undefined;
  /** Multi-select stored as `key=a,b`: the values that are in `allowed`, in the order of `allowed`. */
  list: <T extends string>(key: string, allowed: readonly T[]) => T[];
  /** True when any of `keys` is set — «Сбросить фильтры» is worth showing. */
  has: (keys: readonly string[]) => boolean;
  /**
   * Merges `patch` into the URL: empty / null / false / [] removes the key, `true` becomes `1`, a list is joined by commas.
   * Any filter change resets `page` unless the patch sets it itself.
   */
  set: (patch: Patch) => void;
  /** Drops `keys` (and `page`) in one history entry. */
  clear: (keys: readonly string[]) => void;
};

/** `patch` applied to a copy of `prev` — the rule behind `set`, kept pure so it can be tested without a router. */
export function patchParams(prev: URLSearchParams, patch: Patch) {
  const next = new URLSearchParams(prev);
  for (const [k, raw] of Object.entries(patch)) {
    const v = typeof raw === "object" && raw !== null ? raw.join(",") : raw;
    if (v === undefined || v === null || v === "" || v === false) next.delete(k);
    else next.set(k, v === true ? "1" : String(v));
  }
  if (!("page" in patch)) next.delete("page");
  return next;
}

/** Values of a `key=a,b` list that are in `allowed`, in the order of `allowed`. */
export function readList<T extends string>(params: URLSearchParams, key: string, allowed: readonly T[]) {
  const chosen = (params.get(key) ?? "").split(",");
  return allowed.filter((v) => chosen.includes(v));
}

/** Filters, tabs and paging live in the URL, so a filtered list can be shared by link and survives reload / back. */
export function useUrlFilters(): UrlFilters {
  const [params, setParams] = useSearchParams();
  const get = (key: string) => params.get(key) || undefined;
  const num = (key: string) => {
    const n = Number(params.get(key));
    return Number.isInteger(n) && n > 0 ? n : undefined;
  };
  const set = (patch: Patch) => setParams((prev) => patchParams(prev, patch), { replace: true });
  return {
    get,
    num,
    flag: (key) => params.get(key) === "1",
    oneOf: (key, allowed) => allowed.find((v) => v === params.get(key)),
    list: (key, allowed) => readList(params, key, allowed),
    has: (keys) => keys.some((k) => params.get(k)),
    set,
    clear: (keys) => set(Object.fromEntries(keys.map((k) => [k, undefined]))),
  };
}

/**
 * Search box bound to a URL key: the text updates instantly, the URL after `ms` of silence.
 * The box follows the URL when it changes from outside (header search, filter reset).
 */
export function useUrlSearch(filters: UrlFilters, ms = 350, key = "q") {
  const urlValue = filters.get(key) ?? "";
  const [text, setText] = useState(urlValue);
  const [shown, setShown] = useState(urlValue);
  if (shown !== urlValue) {
    setShown(urlValue);
    if (urlValue !== text.trim()) setText(urlValue);
  }
  useDebouncedEffect(text.trim(), ms, (next) => {
    if (next !== urlValue) filters.set({ [key]: next });
  });
  return [text, setText] as const;
}
