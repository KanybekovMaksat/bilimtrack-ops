import { useEffect, useEffectEvent } from "react";

/**
 * Calls `onSettle(value)` once `value` has stopped changing for `ms` (search as you type).
 * Fires only on `value` changes: `onSettle` always sees the latest props and state
 * without re-arming the timer, so callers need no exhaustive-deps suppressions.
 */
export function useDebouncedEffect<T>(value: T, ms: number, onSettle: (value: T) => void) {
  const settle = useEffectEvent(onSettle);
  useEffect(() => {
    const t = setTimeout(() => settle(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
}
