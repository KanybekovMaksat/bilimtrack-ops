import { useNavigate } from "react-router";
import { LoginForm } from "@/features/auth";
import { routes } from "@/shared/config";
import { Card } from "@/shared/ui";

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand font-bold text-white">B</span>
          <div>
            <p className="font-semibold">Bilimtrack <span className="text-brand">Ops</span></p>
            <p className="text-xs text-fg-muted">Внутренняя панель команды</p>
          </div>
        </div>
        <LoginForm onSuccess={() => navigate(routes.dashboard, { replace: true })} />
      </Card>
    </div>
  );
}
