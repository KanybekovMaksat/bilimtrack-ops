import { useState } from "react";
import { useSearchParams } from "react-router";
import { useCan } from "@/entities/session";
import {
  periodSourceLabel,
  SUBSCRIPTIONS_PAGE_SIZE,
  subscriptionStatusLabel,
  subscriptionTone,
  useBillingSummary,
  useSubscriptionDetail,
  useSubscriptions,
  type SubscriptionFilters,
} from "@/entities/subscription";
import { GrantDaysModal, RevokeAccessModal } from "@/features/manage-subscription";
import { cn, formatDate, formatDateLong, formatInt, formatNumber, plural, useDebouncedEffect } from "@/shared/lib";
import { Button, Callout, Cell, Drawer, EmptyState, ErrorNote, FilterChip, KV, PageHeader, Pager, Pill, Row, SearchInput, Table } from "@/shared/ui";

type StatusFilter = NonNullable<SubscriptionFilters["status"]>;
const STATUSES: StatusFilter[] = ["active", "trial", "expired"];

function SubscriptionDrawer({ userId, onClose }: { userId: number; onClose: () => void }) {
  const detail = useSubscriptionDetail(userId);
  const can = useCan();
  const [modal, setModal] = useState<"grant" | "revoke" | null>(null);
  const d = detail.data;
  const hasAccess = d?.status === "active" || d?.status === "trial";

  return (
    <Drawer
      open
      onClose={onClose}
      header={
        <>
          <Button variant="ghost" size="xs" icon="x" onClick={onClose} aria-label="Закрыть" className="text-ink" />
          <div className="font-num text-sm font-medium">{d?.user.username ?? "…"}</div>
        </>
      }
      footer={
        can("billing") && d ? (
          <>
            <Button size="xl" variant="primary" className="flex-1" onClick={() => setModal("grant")}>
              Выдать дни
            </Button>
            <Button size="xl" variant="dangerOutline" className="px-4" disabled={!hasAccess} onClick={() => setModal("revoke")}>
              Закрыть доступ
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4 p-[18px]">
        <ErrorNote error={detail.error} />
        {!d ? (
          <div className="h-40 animate-pulse rounded-xl bg-neutral-50" />
        ) : (
          <>
            <div className="flex items-baseline gap-2.5">
              <div className="text-lg font-semibold">{d.user.fullName}</div>
              <Pill tone={subscriptionTone[d.status]}>{subscriptionStatusLabel[d.status]}</Pill>
            </div>
            <div className="flex flex-col gap-[9px]">
              <KV k="Доступ до">{formatDateLong(d.accessUntil)}</KV>
              <KV k="Организация">{d.organizationName || "—"}</KV>
              <KV k="Пробный период">{d.trialUsedAt ? `взят ${formatDate(d.trialUsedAt)}` : "не брал"}</KV>
            </div>
            <div>
              <div className="mb-1.5 text-xs text-neutral-400">Периоды</div>
              <div className="flex flex-col gap-1.5">
                {d.periods.map((p) => (
                  <div key={p.id} className={cn("rounded-lg border border-neutral-100 px-2.5 py-2 text-xs", p.revokedAt && "opacity-50")}>
                    <div className="flex items-center gap-2">
                      <Pill size="sm" tone={p.source === "payment" ? "success" : p.source === "trial" ? "info" : "purple"}>
                        {periodSourceLabel[p.source]}
                      </Pill>
                      <span className="font-num">
                        {formatDate(p.startsAt)} — {formatDate(p.endsAt)}
                      </span>
                      {p.revokedAt && <span className="text-red-600">отозван {formatDate(p.revokedAt)}</span>}
                    </div>
                    {(p.plan || p.grantedBy || p.comment) && (
                      <div className="mt-1 text-neutral-500">{[p.plan?.name, p.grantedBy && `выдал ${p.grantedBy}`, p.comment].filter(Boolean).join(" · ")}</div>
                    )}
                  </div>
                ))}
                {!d.periods.length && <span className="text-xs text-neutral-400">Периодов нет</span>}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs text-neutral-400">Платежи</div>
              {d.payments.map((p) => (
                <div key={p.id} className="flex items-center gap-2 border-b border-neutral-50 py-1.5 text-xs last:border-b-0">
                  <span className="text-neutral-500">{formatDate(p.createdAt)}</span>
                  <span className="flex-1">
                    {p.plan.name}
                    {p.seats > 1 && ` × ${p.seats}`}
                  </span>
                  <span className="font-num">{formatNumber(Number(p.amount), 2)} KGS</span>
                  <span className="text-neutral-500">{p.status}</span>
                </div>
              ))}
              {!d.payments.length && <span className="text-xs text-neutral-400">Не платил</span>}
            </div>
          </>
        )}
      </div>
      {d && modal === "grant" && <GrantDaysModal user={d.user} accessUntil={d.accessUntil} onClose={() => setModal(null)} />}
      {d && modal === "revoke" && <RevokeAccessModal user={d.user} accessUntil={d.accessUntil} onClose={() => setModal(null)} />}
    </Drawer>
  );
}

export function SubscriptionsPage() {
  const [params, setParams] = useSearchParams();
  const can = useCan();
  const summary = useBillingSummary();
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter | undefined>();
  const [page, setPage] = useState(1);
  const [granting, setGranting] = useState(false);
  const openId = Number(params.get("user")) || null;

  useDebouncedEffect(query.trim(), 350, (next) => {
    setQ(next);
    setPage(1);
  });

  const list = useSubscriptions({ q: q.length >= 2 ? q : undefined, status, page });
  const total = list.data?.count ?? 0;
  const s = summary.data;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Подписки Bilimtrack+"
        subtitle={
          s
            ? `${formatInt(s.activeSubscribers)} ${plural(s.activeSubscribers, ["активная", "активные", "активных"])}, из них пробных ${formatInt(s.trialSubscribers)}`
            : "по всем организациям"
        }
        actions={
          can("billing") && (
            <Button icon="plus" onClick={() => setGranting(true)}>
              Выдать дни по логину
            </Button>
          )
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput width={300} placeholder="Логин, почта, телефон или ФИО" value={query} onChange={setQuery} />
        {STATUSES.map((st) => (
          <FilterChip
            key={st}
            label={subscriptionStatusLabel[st]}
            tone={status === st ? "active" : "default"}
            onClick={() => {
              setStatus(status === st ? undefined : st);
              setPage(1);
            }}
          />
        ))}
        {s && s.expiringIn7Days > 0 && <span className="text-xs text-warn">Истекают за 7 дней: {formatInt(s.expiringIn7Days)}</span>}
        {list.isFetching && <span className="text-xs text-neutral-400">Загрузка…</span>}
      </div>

      {list.error ? (
        <Callout tone="danger">{list.error.message}</Callout>
      ) : list.data && !list.data.rows.length ? (
        <div className="rounded-xl border border-neutral-200">
          <EmptyState icon="repeat" title="Подписок не найдено" description="Подписка появляется после первой оплаты, пробного периода или ручной выдачи." />
        </div>
      ) : (
        <Table cols="minmax(200px,1fr) minmax(160px,1fr) 150px 150px 90px" minWidth={900} head={["Пользователь", "Организация", "Статус", "Доступ до", "Периодов"]}>
          {(list.data?.rows ?? []).map((row) => (
            <Row key={row.id} onClick={() => setParams({ user: String(row.user.id) })} className={openId === row.user.id ? "bg-brand-50 hover:bg-brand-50" : undefined}>
              <span className="min-w-0">
                <Cell className="block">{row.user.fullName}</Cell>
                <Cell className="block font-num text-[11px] text-neutral-400">{row.user.username}</Cell>
              </span>
              <Cell className="text-xs text-neutral-700">{row.organizationName || "—"}</Cell>
              <span>
                <Pill tone={subscriptionTone[row.status]}>{subscriptionStatusLabel[row.status]}</Pill>
              </span>
              <span className="text-xs text-neutral-500">{formatDateLong(row.accessUntil)}</span>
              <span className="font-num text-xs text-neutral-500">{row.periodsCount}</span>
            </Row>
          ))}
          {list.isLoading && <div className="h-40 animate-pulse bg-neutral-50" />}
        </Table>
      )}
      {total > SUBSCRIPTIONS_PAGE_SIZE && <Pager page={page} pageSize={SUBSCRIPTIONS_PAGE_SIZE} total={total} onPage={setPage} />}

      {openId && <SubscriptionDrawer key={openId} userId={openId} onClose={() => setParams({})} />}
      {granting && <GrantDaysModal onClose={() => setGranting(false)} />}
    </div>
  );
}
