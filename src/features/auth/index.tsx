import { useState, type FormEvent } from "react";
import { useSession } from "@/entities/session";
import { Button, Icon } from "@/shared/ui";

/** Staff sign-in card. Mock: any login is accepted, password is not checked. */
export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const signIn = useSession((s) => s.signIn);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    signIn(login.trim());
    onSuccess();
  };

  const input =
    "h-10 w-full rounded-full border border-neutral-200 bg-neutral-100 px-4 font-sans text-sm outline-none focus:border-neutral-700";

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5 rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="flex items-center gap-1.5 self-start rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand">
        <Icon name="lock" />
        Только для сотрудников
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-neutral-500">Логин или номер телефона</span>
        <input className={input} placeholder="a.satybaldy" autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-neutral-500">Пароль</span>
        <span className="relative block">
          <input
            className={`${input} pr-11`}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            className="absolute top-[11px] right-4 border-0 bg-transparent p-0 text-neutral-400"
          >
            <Icon name={showPassword ? "eye-off" : "eye"} />
          </button>
        </span>
      </label>
      <Button type="submit" variant="primary" size="2xl" className="font-medium">
        Войти
      </Button>
      <a href="#" className="self-center text-[13px]">
        Я забыл пароль
      </a>
      <p className="m-0 text-center text-[11px] leading-[15px] text-neutral-400">
        Нажимая кнопку войти вы принимаете Пользовательское соглашение и Политика конфиденциальности
      </p>
    </form>
  );
}
