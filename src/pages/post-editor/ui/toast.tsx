import { Icon, type IconName } from "@/shared/ui";

/** Short dark notice at the bottom: «Сохранено», validation hints, errors. */
export function Toast({ text, icon }: { text: string; icon: IconName }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-pop">
      <Icon name={icon} size={18} className={icon === "check" ? "text-green-400" : "text-amber-300"} />
      {text}
    </div>
  );
}
