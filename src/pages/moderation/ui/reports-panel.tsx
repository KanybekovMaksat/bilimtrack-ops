import { useState } from "react";
import {
  MODERATION_PAGE,
  REPORT_STATUS,
  useModerationReports,
  useResolveReport,
  type ModerationQuery,
  type ModerationReport,
} from "@/entities/moderation";
import { formatDateTimeShort } from "@/shared/lib";
import { Button, Callout, Card, EmptyState, Icon, Modal, ModalActions, Pager, Pill, TextArea } from "@/shared/ui";
import { PersonLink, OrgLink } from "./common";

export function ReportsPanel({ query, page, onPage }: { query: ModerationQuery; page: number; onPage: (p: number) => void }) {
  const reports = useModerationReports({ ...query, page });
  const [resolving, setResolving] = useState<{ report: ModerationReport; accept: boolean } | null>(null);
  const rows = reports.data?.rows ?? [];
  return (
    <>
      <div className="flex max-w-[980px] flex-col gap-2.5">
        {reports.isLoading && <div className="h-32 animate-pulse rounded-2xl bg-neutral-50" />}
        {reports.error && <Callout tone="danger">Жалобы не загрузились: {reports.error.message}</Callout>}
        {!reports.isLoading && !reports.error && !rows.length && <EmptyState dashed icon="flag" title="Жалоб нет" description="Очередь пуста — или измените фильтр статуса." />}
        {rows.map((r) => {
          const st = REPORT_STATUS[r.status];
          const target = r.post?.text || r.post?.title || r.comment?.text || "";
          return (
            <Card key={r.id} className="flex flex-col gap-2.5 p-4">
              <div className="flex items-center gap-2">
                <Icon name="flag" size={16} className="text-red-500" />
                <span className="text-[13px] font-medium">{r.reasonLabel}</span>
                <Pill size="sm" tone="neutral">
                  {r.targetType === "post" ? "Пост" : r.targetType === "comment" ? "Комментарий" : "Профиль"}
                </Pill>
                {r.targetReportsCount > 1 && (
                  <Pill size="sm" tone="danger">
                    {r.targetReportsCount} жалоб на эту цель
                  </Pill>
                )}
                <div className="flex-1" />
                <Pill size="sm" tone={st.tone}>
                  {st.label}
                </Pill>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                <span>
                  На: <PersonLink person={r.reportedUser} />
                </span>
                <span>
                  От: <PersonLink person={r.reporter} />
                </span>
                <OrgLink org={r.organization} />
                <span>{formatDateTimeShort(r.createdAt)}</span>
              </div>
              {r.details && <div className="text-[13px] text-neutral-700">«{r.details}»</div>}
              {target && <div className="line-clamp-4 rounded-lg bg-neutral-50 px-3 py-2 text-[13px] leading-5 whitespace-pre-line text-neutral-700">{target}</div>}
              {r.status !== "open" && (
                <div className="text-xs text-neutral-500">
                  {r.resolvedBy?.fullName ?? "—"} · {formatDateTimeShort(r.resolvedAt)}
                  {r.resolutionNote && ` · ${r.resolutionNote}`}
                </div>
              )}
              {r.status === "open" && (
                <div className="flex justify-end gap-2 border-t border-neutral-100 pt-2.5">
                  <Button size="sm" onClick={() => setResolving({ report: r, accept: false })}>
                    Отклонить
                  </Button>
                  <Button size="sm" variant="danger" icon="eye-off" onClick={() => setResolving({ report: r, accept: true })}>
                    {r.targetType === "user" ? "Принять меры" : "Скрыть и закрыть"}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <Pager page={page} pageSize={MODERATION_PAGE} total={reports.data?.count ?? 0} onPage={onPage} />
      {resolving && <ResolveModal {...resolving} onClose={() => setResolving(null)} />}
    </>
  );
}

export function ResolveModal({ report, accept, onClose }: { report: ModerationReport; accept: boolean; onClose: () => void }) {
  const resolve = useResolveReport();
  const [note, setNote] = useState("");
  return (
    <Modal open onClose={onClose} width={500} title={accept ? "Принять жалобу" : "Отклонить жалобу"}>
      <div className="text-[13px] leading-5 text-neutral-600">
        {accept
          ? report.targetType === "user"
            ? "Жалоба и все открытые жалобы на этот профиль закроются как «меры приняты»."
            : "Контент скроется, а жалоба и все открытые жалобы на него закроются как «меры приняты»."
          : "Жалоба и все открытые жалобы на ту же цель закроются как отклонённые."}
      </div>
      <TextArea look="plain" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Заметка для журнала (необязательно)" />
      {resolve.error && <div className="text-xs text-red-600">{resolve.error.message}</div>}
      <ModalActions>
        <Button size="xl" onClick={onClose}>
          Отмена
        </Button>
        <Button size="xl" variant={accept ? "danger" : "primary"} disabled={resolve.isPending} onClick={() => resolve.mutate({ id: report.id, accept, note }, { onSuccess: onClose })}>
          {accept ? "Принять" : "Отклонить"}
        </Button>
      </ModalActions>
    </Modal>
  );
}
