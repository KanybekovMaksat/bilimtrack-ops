import { Navigate, useParams } from "react-router";
import { EndImpersonationButton, modeLabel, useImpersonation } from "@/features/impersonate";
import { routes } from "@/shared/config";
import { Breadcrumbs, Button, Card, Icon, Pill } from "@/shared/ui";

/** Live impersonation session: what support sees and the audit trail being written. */
export function AccountSessionPage() {
  const { login = "a.kaliyeva" } = useParams();
  const session = useImpersonation((s) => s.session);
  const log = useImpersonation((s) => s.log);

  if (!session) return <Navigate to={routes.account(login)} replace />;

  const limits =
    session.mode === "full" ? "действия выполняются от имени пользователя и помечаются в журнале" : "нельзя отправлять сообщения, менять данные и оплачивать";

  return (
    <div className="flex max-w-[1040px] flex-col gap-4">
      <Breadcrumbs items={[{ label: "Поиск аккаунтов", to: routes.accounts }, { label: login, to: routes.account(login) }, { label: "Сеанс от имени" }]} />
      <div className="flex items-center gap-2.5">
        <h1 className="m-0 text-xl leading-[26px] font-semibold tracking-[-.01em]">Сеанс от имени {login}</h1>
        <Pill tone="warn">{modeLabel(session.mode)}</Pill>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_400px] items-start gap-4">
        <Card className="flex flex-col gap-3.5 p-[18px]">
          <div className="text-sm font-medium">Портал МУИТ открыт в отдельной вкладке</div>
          <div className="text-[13px] leading-5 text-neutral-600">
            Вкладка отмечена жёлтой рамкой и плашкой «Сеанс поддержки», чтобы её нельзя было спутать с обычным входом. Вы видите интерфейс так же, как пользователь.
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-x-3 gap-y-2.5 rounded-xl bg-neutral-50 px-3.5 py-3 text-[13px]">
            <span className="text-neutral-500">Роль</span>
            <span>Учащийся · 2 курс · группа ИС-24</span>
            <span className="text-neutral-500">Доступные разделы</span>
            <span>Главная, Расписание, Дневник, Чаты, Профиль</span>
            <span className="text-neutral-500">Ограничения</span>
            <span>{limits}</span>
            <span className="text-neutral-500">Завершится</span>
            <span>в 14:51, через 30 минут после начала</span>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" icon="external-link">
              Вернуться во вкладку портала
            </Button>
            <EndImpersonationButton />
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-[13px]">
            <Icon name="history" size={17} className="text-neutral-500" />
            <span className="flex-1 text-sm font-medium">Журнал сеанса</span>
            <span className="text-[11px] text-neutral-400">пишется в аудит</span>
          </div>
          {log.map((l, i) => (
            <div key={i} className="flex gap-3 border-b border-neutral-50 px-4 py-2.5 text-[13px] last:border-b-0">
              <span className="w-[38px] shrink-0 font-num text-xs text-neutral-400">{l.t}</span>
              <span className="flex-1 leading-[18px]">{l.text}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
