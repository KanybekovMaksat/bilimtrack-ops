import { useNavigate } from "react-router";
import { useTeam } from "@/entities/platform";
import { routes } from "@/shared/config";
import { Avatar, Button, Callout, Num, PageHeader, Pill, Row, Table } from "@/shared/ui";

export function TeamPage() {
  const team = useTeam();
  const navigate = useNavigate();
  return (
    <div className="flex max-w-[1040px] flex-col gap-4">
      <PageHeader
        title="Команда и доступы"
        subtitle="сотрудники Bilimtrack с доступом в эту панель"
        actions={
          <>
            <Button size="md" onClick={() => navigate(routes.denied)}>
              Экран «Доступ закрыт»
            </Button>
            <Button variant="primary" icon="plus">
              Добавить сотрудника
            </Button>
          </>
        }
      />
      <Table cols="minmax(200px,1fr) 170px 170px 190px 120px 100px" minWidth={900} head={["Сотрудник", "Логин", "Роль", "Поиск аккаунтов", "Статус", "Активность"]}>
        {team.map((t) => (
          <Row key={t.login} hover>
            <span className="flex items-center gap-[9px]">
              <Avatar initials={t.initials} size={26} className="text-[10px]" />
              {t.name}
            </span>
            <Num className="text-neutral-700">{t.login}</Num>
            <span>
              <Pill className="font-normal text-neutral-700">{t.role}</Pill>
            </span>
            <span>
              <Pill tone={t.accountSearch ? "info" : "neutral"} className={t.accountSearch ? undefined : "text-neutral-400"}>
                {t.accountSearch ? "Разрешён" : "Нет"}
              </Pill>
            </span>
            <span>
              <Pill tone={t.active ? "success" : "neutral"}>{t.active ? "Активен" : "Отключён"}</Pill>
            </span>
            <span className="text-xs text-neutral-400">{t.last}</span>
          </Row>
        ))}
      </Table>
      <Callout tone="warn">
        Сейчас на бэке доступ к поиску аккаунтов выдан одной учётной записи на всю команду. Экран нарисован сразу под роли: поддержка получает поиск, продажи и контент — нет.
      </Callout>
    </div>
  );
}
