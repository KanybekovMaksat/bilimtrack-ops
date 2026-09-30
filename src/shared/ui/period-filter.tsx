import { useState } from "react";
import { toIsoDate } from "../lib";
import { FilterSelect } from "./dropdown";
import { TextInput } from "./form";

type Preset = "today" | "7d" | "30d" | "custom";
type Range = { from?: string; to?: string };

const DAYS: Record<Exclude<Preset, "custom">, number> = { today: 1, "7d": 7, "30d": 30 };

/** The last `days` days including today, as `YYYY-MM-DD` bounds. */
function lastDays(days: number): Required<Range> {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - (days - 1));
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

type Props = {
  from?: string;
  to?: string;
  /** Both bounds at once, so a preset lands in the URL as one change. */
  onChange: (range: Range) => void;
};

/**
 * Period of a journal: quick ranges in the usual filter select, exact dates behind «Свой период».
 * The URL keeps plain dates (not the preset name), so a shared link means the same days tomorrow.
 */
export function PeriodFilter({ from, to, onChange }: Props) {
  const [custom, setCustom] = useState(false);
  const matched = (Object.keys(DAYS) as (keyof typeof DAYS)[]).find((p) => {
    const r = lastDays(DAYS[p]);
    return r.from === from && r.to === to;
  });
  const value: Preset | undefined = custom ? "custom" : (matched ?? (from || to ? "custom" : undefined));

  return (
    <>
      <FilterSelect<Preset>
        label="Период"
        allLabel="За всё время"
        value={value}
        onChange={(p) => {
          setCustom(p === "custom");
          if (!p) onChange({});
          else if (p !== "custom") onChange(lastDays(DAYS[p]));
        }}
        options={[
          { value: "today", label: "Сегодня" },
          { value: "7d", label: "7 дней" },
          { value: "30d", label: "30 дней" },
          { value: "custom", label: "Свой период", icon: "calendar" },
        ]}
      />
      {value === "custom" && (
        <>
          <TextInput look="plain" inputSize="sm" type="date" className="w-[150px]" value={from ?? ""} max={to} onChange={(e) => onChange({ from: e.target.value, to })} title="С даты" aria-label="С даты" />
          <TextInput look="plain" inputSize="sm" type="date" className="w-[150px]" value={to ?? ""} min={from} onChange={(e) => onChange({ from, to: e.target.value })} title="По дату" aria-label="По дату" />
        </>
      )}
    </>
  );
}
