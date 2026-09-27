import { useState } from "react";
import { Avatar, Button, Field, Modal, ModalActions, TextArea, TextInput } from "@/shared/ui";

export type DictEntry = { name: string; slug: string };

type Props = {
  entry: DictEntry | null;
  isAuthor: boolean;
  onClose: () => void;
};

/** One modal for categories, tags and authors; authors get a photo and bio. */
export function DictionaryEntryModal({ entry, isAuthor, onClose }: Props) {
  return (
    <Modal open={entry !== null} onClose={onClose} width={460} title={entry?.name ? "Редактировать запись" : "Новая запись"}>
      {entry && <EntryForm key={entry.slug} entry={entry} isAuthor={isAuthor} onClose={onClose} />}
    </Modal>
  );
}

function EntryForm({ entry, isAuthor, onClose }: { entry: DictEntry; isAuthor: boolean; onClose: () => void }) {
  const [name, setName] = useState(entry.name);
  const [slug, setSlug] = useState(entry.slug);
  const [bio, setBio] = useState("Пишет о переходе учебных заведений на электронные журналы.");

  return (
    <>
      <Field label="Название">
        <TextInput inputSize="md" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Слаг">
        <TextInput inputSize="md" numeric value={slug} onChange={(e) => setSlug(e.target.value)} />
      </Field>
      {isAuthor && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar icon="user" size={48} className="text-neutral-400" />
            <Button size="sm">Загрузить фото</Button>
          </div>
          <Field label="Биография">
            <TextArea value={bio} onChange={(e) => setBio(e.target.value)} />
          </Field>
        </div>
      )}
      <ModalActions>
        <Button size="md" className="h-[38px]" onClick={onClose}>
          Отмена
        </Button>
        <Button size="md" className="h-[38px]" variant="primary" disabled={!name.trim() || !slug.trim()} onClick={onClose}>
          Сохранить
        </Button>
      </ModalActions>
    </>
  );
}
