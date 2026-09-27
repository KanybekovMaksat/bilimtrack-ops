import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useOrganizations } from "@/entities/organization";
import { ticketApi, ticketKeys, ticketPriorities, ticketPriorityLabel, type TicketPriority } from "@/entities/ticket";
import { Button, Input, Label, Modal, Select, Textarea } from "@/shared/ui";

const empty = { title: "", description: "", organizationId: "", priority: "medium" as TicketPriority };

export function CreateTicketButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const { data: organizations = [] } = useOrganizations();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: ticketApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      setForm(empty);
      setOpen(false);
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    mutate(form);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Новый тикет
      </Button>
      <Modal open={open} title="Новый тикет" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Label text="Тема">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus />
          </Label>
          <Label text="Организация">
            <Select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })} required>
              <option value="" disabled>Выберите организацию</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </Select>
          </Label>
          <Label text="Приоритет">
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}>
              {ticketPriorities.map((p) => (
                <option key={p} value={p}>{ticketPriorityLabel[p]}</option>
              ))}
            </Select>
          </Label>
          <Label text="Описание">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Создаём…" : "Создать"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
