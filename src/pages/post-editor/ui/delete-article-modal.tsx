import { useArticleAction } from "@/entities/article";
import { Button, ErrorNote, Modal, ModalActions } from "@/shared/ui";

type Props = { id: string; onClose: () => void; onDeleted: () => void };

/** Irreversible delete; archiving is the soft way out and is offered in the text. */
export function DeleteArticleModal({ id, onClose, onDeleted }: Props) {
  const action = useArticleAction();
  return (
    <Modal open onClose={onClose} width={460} title="Удалить статью?">
      <div className="text-[13px] leading-5 text-neutral-700">Статья исчезнет из блога. Отменить нельзя — чтобы просто скрыть, снимите её с публикации.</div>
      <ErrorNote error={action.error} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="danger" disabled={action.isPending} onClick={() => action.mutate({ id, action: "delete" }, { onSuccess: onDeleted })}>
          Удалить
        </Button>
      </ModalActions>
    </Modal>
  );
}
