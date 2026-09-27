export type HealthTone = "red" | "yellow" | "green";

export const HEALTH_TONE: Record<HealthTone, { label: string; bg: string; fg: string; dot: string }> = {
  red: { label: "Красный", bg: "#fef2f2", fg: "#e7000b", dot: "#fb2c36" },
  yellow: { label: "Жёлтый", bg: "#fffbeb", fg: "#c2410c", dot: "#fd9a00" },
  green: { label: "Зелёный", bg: "#f0fdf4", fg: "#00a63e", dot: "#00c951" },
};

/** Colour for a 0–100 usage value: red below 35, amber below 65. */
export const usageColor = (v: number) => (v < 35 ? "#fb2c36" : v < 65 ? "#fd9a00" : "#00c951");
