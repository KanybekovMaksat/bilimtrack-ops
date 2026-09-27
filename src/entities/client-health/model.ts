export type HealthTone = "red" | "yellow" | "green";

export const HEALTH_TONE: Record<HealthTone, { label: string; bg: string; fg: string; dot: string }> = {
  red: { label: "Красный", bg: "var(--color-red-50)", fg: "var(--color-red-600)", dot: "var(--color-red-500)" },
  yellow: { label: "Жёлтый", bg: "var(--color-amber-50)", fg: "var(--color-warn)", dot: "var(--color-amber-500)" },
  green: { label: "Зелёный", bg: "var(--color-green-50)", fg: "var(--color-green-600)", dot: "var(--color-green-500)" },
};

/** Colour for a 0–100 usage value: red below 35, amber below 65. */
export const usageColor = (v: number) => (v < 35 ? "var(--color-red-500)" : v < 65 ? "var(--color-amber-500)" : "var(--color-green-500)");
