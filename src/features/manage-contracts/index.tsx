import { useRef, useState } from "react";
import {
  CONTRACT_ACCEPT,
  CONTRACT_STATUS,
  canPreview,
  fileIcon,
  openContractFile,
  useContracts,
  useDeleteContract,
  useDeleteContractFile,
  useSaveContract,
  useUploadContractFile,
  type Contract,
  type ContractFile,
  type ContractStatus,
} from "@/entities/contract";
import { useCan } from "@/entities/session";
import { cn, formatBytes, formatDate, formatDateTimeShort, formatNumber } from "@/shared/lib";
import { Button, Callout, Card, Dropdown, EmptyState, ErrorNote, Field, Icon, Modal, ModalActions, Pill, TextArea, TextInput } from "@/shared/ui";

const STATUS_OPTIONS = (Object.keys(CONTRACT_STATUS) as ContractStatus[]).map((s) => ({ value: s, label: CONTRACT_STATUS[s].label }));

const money = (amount: string | null, currency: string) =>
  amount === null ? null : `${formatNumber(Number(amount))} ${currency === "KGS" ? "сом" : currency}`;

/** «Договоры» tab of an organization: contracts with attached scans. */
export function ContractsPanel({ orgId, orgName }: { orgId: number; orgName: string }) {
  const contracts = useContracts(orgId);
  const can = useCan();
  const manage = can("licenses");
  const [editing, setEditing] = useState<Contract | "new" | null>(null);
  const [deleting, setDeleting] = useState<Contract | null>(null);
  const remove = useDeleteContract(orgId);
  const rows = contracts.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 text-xs text-neutral-500">Договоры Bilimtrack с «{orgName}»: номер, сроки, сумма и сканы. Файлы видит только команда Bilimtrack.</div>
        {manage && (
          <Button variant="primary" icon="plus" onClick={() => setEditing("new")}>
            Добавить договор
          </Button>
        )}
      </div>
      {contracts.error && <Callout tone="danger">{contracts.error.message}</Callout>}
      {contracts.isLoading && <div className="h-28 animate-pulse rounded-2xl bg-neutral-50" />}
      {!contracts.isLoading && !contracts.error && !rows.length && (
        <EmptyState dashed icon="file-text" title="Договоров пока нет" description="Добавьте договор и прикрепите скан — он будет под рукой при продлении и спорах." />
      )}
      {rows.map((c) => (
        <ContractCard key={c.id} orgId={orgId} contract={c} manage={manage} onEdit={() => setEditing(c)} onDelete={() => setDeleting(c)} />
      ))}
      {editing && <ContractModal orgId={orgId} contract={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <Modal open onClose={() => setDeleting(null)} width={480} title="Удалить договор?">
          <div className="text-[13px] leading-5 text-neutral-700">
            «{deleting.number || deleting.title}» удалится вместе с {deleting.files.length} файлами. Отменить нельзя. Удаление попадёт в аудит.
          </div>
          {remove.error && <div className="text-xs text-red-600">{remove.error.message}</div>}
          <ModalActions>
            <Button size="xl" onClick={() => setDeleting(null)}>
              Отмена
            </Button>
            <Button size="xl" variant="danger" disabled={remove.isPending} onClick={() => remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}>
              Удалить
            </Button>
          </ModalActions>
        </Modal>
      )}
    </div>
  );
}

function ContractCard({ orgId, contract: c, manage, onEdit, onDelete }: { orgId: number; contract: Contract; manage: boolean; onEdit: () => void; onDelete: () => void }) {
  const st = CONTRACT_STATUS[c.status];
  const [now] = useState(() => Date.now());
  const expiresSoon = c.status === "active" && c.validUntil && new Date(c.validUntil).getTime() - now < 30 * 86_400_000;
  const sum = money(c.amount, c.currency);
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand">
          <Icon name="file-text" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold">{c.title}</span>
            {c.number && <span className="font-num text-xs text-neutral-500">№ {c.number}</span>}
            <Pill size="sm" tone={st.tone}>
              {st.label}
            </Pill>
            {expiresSoon && (
              <Pill size="sm" tone="danger" icon="clock">
                истекает {formatDate(c.validUntil)}
              </Pill>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
            <span>подписан {formatDate(c.signedAt)}</span>
            <span>
              действует {c.validFrom ? `с ${formatDate(c.validFrom)}` : ""} {c.validUntil ? `до ${formatDate(c.validUntil)}` : c.validFrom ? "" : "—"}
            </span>
            {sum && <span className="font-medium text-ink">{sum}</span>}
          </div>
          {c.note && <div className="mt-1.5 text-[13px] leading-5 whitespace-pre-line text-neutral-700">{c.note}</div>}
        </div>
        {manage && (
          <div className="flex gap-0.5">
            <Button size="xs" variant="ghost" icon="pencil" aria-label="Изменить" title="Изменить и прикрепить файлы" onClick={onEdit} />
            <Button size="xs" variant="ghost" icon="trash" aria-label="Удалить" title="Удалить" onClick={onDelete} />
          </div>
        )}
      </div>
      <FileList orgId={orgId} contractId={c.id} files={c.files} manage={manage} />
      <div className="text-[11px] text-neutral-400">
        Добавил {c.createdBy?.fullName ?? "—"} · {formatDateTimeShort(c.createdAt)}
      </div>
    </Card>
  );
}

/** Attached files with open / download / delete and a drop zone for new ones. */
function FileList({ orgId, contractId, files, manage }: { orgId: number; contractId: number; files: ContractFile[]; manage: boolean }) {
  const upload = useUploadContractFile(orgId);
  const remove = useDeleteContractFile(orgId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async (list: FileList | File[]) => {
    setError(null);
    for (const file of Array.from(list)) {
      try {
        await upload.mutateAsync({ contractId, file });
      } catch (e) {
        setError(`${file.name}: ${e instanceof Error ? e.message : "не загрузился"}`);
      }
    }
  };
  const open = async (f: ContractFile, inline: boolean) => {
    setBusy(f.id);
    setError(null);
    try {
      await openContractFile(orgId, contractId, f, inline);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Файл не открылся");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {files.map((f) => (
        <div key={f.id} className="flex items-center gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2">
          <Icon name={fileIcon(f)} size={17} className="text-neutral-500" />
          <button
            onClick={() => open(f, canPreview(f))}
            className="min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-left text-[13px] text-brand hover:underline"
            title={canPreview(f) ? "Открыть" : "Скачать"}
          >
            {f.name}
          </button>
          <span className="text-[11px] whitespace-nowrap text-neutral-400">
            {formatBytes(f.size)} · {formatDate(f.createdAt)}
          </span>
          <Button size="xs" variant="ghost" icon={busy === f.id ? "refresh" : "arrow-down"} aria-label="Скачать" title="Скачать" disabled={busy === f.id} onClick={() => open(f, false)} />
          {manage && (
            <Button
              size="xs"
              variant="ghost"
              icon="x"
              aria-label="Удалить файл"
              title="Удалить файл"
              disabled={remove.isPending}
              onClick={() => remove.mutate({ contractId, fileId: f.id })}
            />
          )}
        </div>
      ))}
      {manage && (
        <>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            accept={CONTRACT_ACCEPT}
            onChange={(e) => {
              if (e.target.files?.length) void send(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (e.dataTransfer.files.length) void send(e.dataTransfer.files);
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-xs",
              drag ? "border-brand bg-brand-50 text-brand" : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300",
            )}
          >
            <Icon name={upload.isPending ? "refresh" : "paperclip"} size={15} className={upload.isPending ? "animate-spin" : undefined} />
            {upload.isPending ? "Загружаем…" : "Прикрепить файлы — PDF, Word, Excel, фото, архив до 25 МБ (можно перетащить)"}
          </button>
        </>
      )}
      {!manage && !files.length && <div className="text-xs text-neutral-400">Файлов нет</div>}
      {(error ?? remove.error?.message) && <div className="text-xs text-red-600">{error ?? remove.error?.message}</div>}
    </div>
  );
}

function ContractModal({ orgId, contract, onClose }: { orgId: number; contract: Contract | null; onClose: () => void }) {
  const save = useSaveContract(orgId);
  const upload = useUploadContractFile(orgId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File[]>([]);
  const [f, setF] = useState({
    title: contract?.title ?? "Договор на использование Bilimtrack",
    number: contract?.number ?? "",
    status: contract?.status ?? ("active" as ContractStatus),
    signedAt: contract?.signedAt ?? "",
    validFrom: contract?.validFrom ?? "",
    validUntil: contract?.validUntil ?? "",
    amount: contract?.amount ?? "",
    currency: contract?.currency ?? "KGS",
    note: contract?.note ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const badDates = !!f.validFrom && !!f.validUntil && f.validUntil < f.validFrom;
  const busy = save.isPending || upload.isPending;

  const submit = () => {
    setError(null);
    save.mutate(
      {
        id: contract?.id,
        title: f.title.trim(),
        number: f.number.trim(),
        status: f.status,
        signedAt: f.signedAt || null,
        validFrom: f.validFrom || null,
        validUntil: f.validUntil || null,
        amount: f.amount === "" ? null : String(f.amount).replace(",", "."),
        currency: f.currency.trim().toUpperCase() || "KGS",
        note: f.note,
      },
      {
        onSuccess: async (saved) => {
          for (const file of pending) {
            try {
              await upload.mutateAsync({ contractId: saved.id, file });
            } catch (e) {
              setError(`${file.name}: ${e instanceof Error ? e.message : "не загрузился"}`);
              return;
            }
          }
          onClose();
        },
      },
    );
  };

  return (
    <Modal open onClose={onClose} width={640} title={contract ? `Договор ${contract.number ? `№ ${contract.number}` : ""}` : "Новый договор"}>
      <div className="grid grid-cols-[minmax(0,1fr)_170px] gap-3">
        <Field label="Название · обязательно" strong>
          <TextInput look="plain" value={f.title} onChange={(e) => set({ title: e.target.value })} autoFocus />
        </Field>
        <Field label="Номер" strong>
          <TextInput look="plain" numeric value={f.number} onChange={(e) => set({ number: e.target.value })} placeholder="BT-2026/14" />
        </Field>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <Field label="Статус" strong>
          <Dropdown<ContractStatus> value={f.status} onChange={(s) => s && set({ status: s })} options={STATUS_OPTIONS} placeholder="Статус" />
        </Field>
        <Field label="Подписан" strong>
          <TextInput look="plain" type="date" value={f.signedAt} onChange={(e) => set({ signedAt: e.target.value })} />
        </Field>
        <Field label="Действует с" strong>
          <TextInput look="plain" type="date" value={f.validFrom} onChange={(e) => set({ validFrom: e.target.value })} />
        </Field>
        <Field label="Действует до" strong>
          <TextInput look="plain" type="date" value={f.validUntil} onChange={(e) => set({ validUntil: e.target.value })} />
        </Field>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
        <Field label="Сумма договора" strong>
          <TextInput look="plain" numeric inputMode="decimal" value={f.amount} onChange={(e) => set({ amount: e.target.value.replace(/[^\d.,]/g, "") })} placeholder="120000" />
        </Field>
        <Field label="Валюта" strong>
          <TextInput look="plain" maxLength={3} value={f.currency} onChange={(e) => set({ currency: e.target.value.toUpperCase() })} />
        </Field>
      </div>
      <Field label="Заметка" strong>
        <TextArea look="plain" value={f.note} onChange={(e) => set({ note: e.target.value })} placeholder="Условия оплаты, контакт со стороны клиента, особые пункты" />
      </Field>

      {!contract && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-neutral-500">Файлы договора</span>
          {pending.map((file, i) => (
            <div key={`${file.name}-${i}`} className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-[13px]">
              <Icon name="paperclip" size={15} className="text-neutral-400" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="text-[11px] text-neutral-400">{formatBytes(file.size)}</span>
              <Button size="xs" variant="ghost" icon="x" aria-label="Убрать" onClick={() => setPending((p) => p.filter((_, j) => j !== i))} />
            </div>
          ))}
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            accept={CONTRACT_ACCEPT}
            onChange={(e) => {
              const picked = e.target.files ? Array.from(e.target.files) : [];
              setPending((p) => [...p, ...picked]);
              e.target.value = "";
            }}
          />
          <Button size="md" icon="paperclip" className="self-start" onClick={() => inputRef.current?.click()}>
            Прикрепить файлы
          </Button>
        </div>
      )}
      {contract && <div className="text-xs text-neutral-500">Файлы прикрепляются и удаляются прямо в карточке договора.</div>}

      {badDates && <div className="text-xs text-warn">Дата окончания раньше даты начала.</div>}
      <ErrorNote error={error ?? save.error} />
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant="primary" disabled={!f.title.trim() || badDates || busy} onClick={submit}>
          {busy ? "Сохраняем…" : contract ? "Сохранить" : pending.length ? `Добавить договор и ${pending.length} файл(а)` : "Добавить договор"}
        </Button>
      </ModalActions>
    </Modal>
  );
}
