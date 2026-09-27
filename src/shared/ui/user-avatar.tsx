import { cn } from "../lib";
import { Avatar } from "./marks";

type Props = { src?: string | null; initials: string; size?: number; tone?: "neutral" | "brand"; className?: string };

/** Photo avatar with an initials fallback. */
export function UserAvatar({ src, initials, size = 26, tone = "brand", className }: Props) {
  if (src) {
    return <img src={src} alt="" width={size} height={size} className={cn("shrink-0 rounded-full object-cover", className)} style={{ width: size, height: size }} />;
  }
  return <Avatar initials={initials} size={size} tone={tone} className={className} />;
}
