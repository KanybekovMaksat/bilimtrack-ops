import { useNavigate } from "react-router";
import { routes } from "@/shared/config";
import { Button, Icon } from "@/shared/ui";

type Props = { section?: string; title?: string; description?: string };

export function DeniedPage({
  section = "Аккаунты",
  title = "Доступ закрыт",
  description,
}: Props) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <Icon name="lock" size={40} className="text-neutral-300" />
      <div className="text-lg font-semibold">{title}</div>
      <div className="max-w-[420px] text-[13px] leading-5 text-neutral-500">
        {description ??
          `Раздел «${section}» доступен только роли «Поддержка». Если доступ нужен для работы, попросите админа платформы изменить роль в разделе «Команда и доступы».`}
      </div>
      <Button variant="primary" size="md" className="mt-1.5 h-[38px] px-[18px] text-sm" onClick={() => navigate(routes.home)}>
        На главную
      </Button>
    </div>
  );
}

export function NotFoundPage() {
  return <DeniedPage title="Страница не найдена" description="Такого раздела в панели нет. Проверьте адрес или вернитесь на главную." />;
}
