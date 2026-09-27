import { Button } from "./button";

type Props = { page: number; pageSize: number; total: number; onPage: (page: number) => void };

/** «Показано 21–40 из 312» with previous / next buttons. */
export function Pager({ page, pageSize, total, onPage }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-neutral-500">
      <span>
        Показано {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} из {total}
      </span>
      <div className="flex-1" />
      <Button size="xs" icon="chevron-right" className="[&_svg]:rotate-180" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Назад" />
      <span className="font-num">
        {page} / {pages}
      </span>
      <Button size="xs" icon="chevron-right" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Вперёд" />
    </div>
  );
}
