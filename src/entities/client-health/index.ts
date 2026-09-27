import { useMockQuery } from "@/shared/api";
import { CLIENT_HEALTH } from "./model";

export const useClientHealth = () => useMockQuery(["client-health"], () => CLIENT_HEALTH);

export {
  HEALTH_FACTORS,
  HEALTH_SUMMARY,
  HEALTH_TONE,
  usageColor,
  type ClientHealth,
  type HealthTone,
} from "./model";
export { HealthPill } from "./ui";
