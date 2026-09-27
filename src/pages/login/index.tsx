import { useNavigate } from "react-router";
import { LoginForm } from "@/features/auth";
import { routes } from "@/shared/config";
import { Logo } from "@/widgets/app-shell";

export function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-10">
      <div className="flex w-[380px] flex-col gap-[22px]">
        <div className="flex items-center gap-3">
          <Logo size={44} />
          <div>
            <div className="text-lg leading-[22px] font-semibold">Bilimtrack Ops</div>
            <div className="text-xs leading-4 text-neutral-500">Внутренняя панель команды</div>
          </div>
        </div>
        <LoginForm onSuccess={() => navigate(routes.home, { replace: true })} />
        <div className="text-center text-xs text-neutral-400">Разработано OurEra Soft</div>
      </div>
    </div>
  );
}
