import { useState } from "react";
import { useDeleteColumn, useSaveColumn, type Board } from "@/entities/task";
import { Button, ErrorNote, Modal, ModalActions, TextInput, Toggle } from "@/shared/ui";

// Stored on the board column (server data), so these stay literal hex values, not theme variables.
const COLORS = ["#a1a1a1", "#155dfc", "#fd9a00", "#00c951", "#fb2c36", "#8e51ff"];

/** Board columns: add, rename, recolor, reorder, mark as «done», delete empty ones. */
export function ManageColumnsModal({ board, onClose }: { board: Board; onClose: () => void }) {
  const save = useSaveColumn(board.id);
  const remove = useDeleteColumn(board.id);
  const [newName, setNewName] = useState("");
  const error = save.error ?? remove.error;

  return (
    <Modal open onClose={onClose} width={560} title="Колонки доски">
      <div className="flex flex-col gap-2">
        {board.columns.map((c, i) => (
          <ColumnRow
            key={`${c.id}-${c.name}`}
            name={c.name}
            color={c.color}
            isDone={c.isDone}
            count={c.tasksCount}
            first={i === 0}
            last={i === board.columns.length - 1}
            busy={save.isPending || remove.isPending}
            onSave={(patch) => save.mutate({ id: c.id, ...patch })}
            onMove={(delta) => save.mutate({ id: c.id, position: i + delta })}
            onDelete={() => remove.mutate(c.id)}
          />
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (newName.trim()) save.mutate({ name: newName.trim() }, { onSuccess: () => setNewName("") });
        }}
      >
        <TextInput look="plain" inputSize="md" placeholder="Новая колонка, например «Тестирование»" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button type="submit" icon="plus" disabled={!newName.trim() || save.isPending}>
          Добавить
        </Button>
      </form>
      <ErrorNote error={error} />
      <div className="text-xs text-neutral-400">Задача в колонке «готово» считается выполненной. Удалить можно только пустую колонку.</div>
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Готово
        </Button>
      </ModalActions>
    </Modal>
  );
}

type RowProps = {
  name: string;
  color: string;
  isDone: boolean;
  count: number;
  first: boolean;
  last: boolean;
  busy: boolean;
  onSave: (patch: { name?: string; color?: string; isDone?: boolean }) => void;
  onMove: (delta: number) => void;
  onDelete: () => void;
};

function ColumnRow({ name, color, isDone, count, first, last, busy, onSave, onMove, onDelete }: RowProps) {
  const [value, setValue] = useState(name);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2">
      <div className="flex gap-1">
        {COLORS.map((c) => (
          <button
            key={c}
            aria-label={`Цвет ${c}`}
            onClick={() => onSave({ color: c })}
            className="size-3.5 rounded-full border-0 p-0"
            style={{ background: c, outline: c === color ? "2px solid var(--color-ink)" : "none", outlineOffset: 1 }}
          />
        ))}
      </div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => value.trim() && value.trim() !== name && onSave({ name: value.trim() })}
        className="min-w-0 flex-1 border-0 bg-transparent text-[13px] font-medium outline-none"
      />
      <span className="text-[11px] text-neutral-400">{count}</span>
      <span className="flex items-center gap-1 text-[11px] text-neutral-500">
        <Toggle size="sm" on={isDone} label="Колонка «готово»" disabled={busy} onChange={(on) => onSave({ isDone: on })} />
        готово
      </span>
      <Button size="xs" variant="ghost" icon="chevron-up" aria-label="Выше" disabled={first || busy} onClick={() => onMove(-1)} />
      <Button size="xs" variant="ghost" icon="chevron-down" aria-label="Ниже" disabled={last || busy} onClick={() => onMove(1)} />
      <Button size="xs" variant="ghost" icon="trash" aria-label="Удалить" disabled={count > 0 || busy} onClick={onDelete} />
    </div>
  );
}
