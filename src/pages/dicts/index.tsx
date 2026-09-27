import { Suspense, useState } from "react";
import { DICT_TABS, useDictionary, type DictKind } from "@/entities/article";
import { DictionaryEntryModal, type DictEntry } from "@/features/edit-dictionary-entry";
import { Avatar, Button, Icon, PageHeader, PageSkeleton, Tabs } from "@/shared/ui";

function DictRows({ kind, onEdit }: { kind: DictKind; onEdit: (e: DictEntry) => void }) {
  const rows = useDictionary(kind);
  return (
    <div className="overflow-auto rounded-xl border border-neutral-200">
      {rows.map((r) => (
        <div key={r.slug} onClick={() => onEdit(r)} className="flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0 hover:bg-neutral-50">
          {kind === "author" && <Avatar icon="user" size={32} className="text-neutral-400" />}
          <span className="flex-1 text-sm font-medium">{r.name}</span>
          <span className="w-[180px] font-num text-xs text-neutral-400">{r.slug}</span>
          <span className="w-[100px] text-xs text-neutral-500">{r.count}</span>
          <Icon name="pencil" size={16} className="text-neutral-400" />
        </div>
      ))}
    </div>
  );
}

export function DictsPage() {
  const [kind, setKind] = useState<DictKind>("cat");
  const [editing, setEditing] = useState<DictEntry | null>(null);

  return (
    <div className="flex max-w-[820px] flex-col gap-4">
      <PageHeader
        title="Справочники"
        subtitle="один макет на три списка — различаются только поля"
        actions={
          <Button variant="primary" icon="plus" onClick={() => setEditing({ name: "", slug: "" })}>
            Добавить
          </Button>
        }
      />
      <Tabs countStyle="text" value={kind} onChange={setKind} items={DICT_TABS} />
      <Suspense fallback={<PageSkeleton />}>
        <DictRows kind={kind} onEdit={setEditing} />
      </Suspense>
      <p className="m-0 text-xs leading-[18px] text-neutral-400">
        Категории и теги: название и слаг. У автора добавляются фото и биография — единственное отличие, поэтому в модалке появляются два лишних поля.
      </p>
      <DictionaryEntryModal entry={editing} isAuthor={kind === "author"} onClose={() => setEditing(null)} />
    </div>
  );
}
