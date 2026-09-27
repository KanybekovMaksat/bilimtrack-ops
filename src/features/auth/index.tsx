import { useState, type FormEvent } from "react";
import { useSession } from "@/entities/session";
import { ApiError } from "@/shared/api";
import { Button, Icon } from "@/shared/ui";

const MESSAGES: Record<string, string> = {
  no_active_account: "Неверный логин или пароль",
  account_locked: "Слишком много попыток. Вход временно заблокирован, попробуйте позже",
};

/** Staff sign-in against the Bilimtrack API (auth/login/). */
export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const signIn = useSession((s) => s.signIn);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await signIn(login.trim(), password);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? (MESSAGES[err.code] ?? err.message) : "Не удалось войти");
    } finally {
      setPending(false);
    }
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
        <input className={input} placeholder="bilimtrack_tech_support" autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} required />
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
            required
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
      {error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600">{error}</div>}
      <Button type="submit" variant="primary" size="2xl" disabled={pending}>
        {pending ? "Входим…" : "Войти"}
      </Button>
      <p className="m-0 text-center text-[11px] leading-[15px] text-neutral-400">
        Нажимая кнопку войти вы принимаете Пользовательское соглашение и Политика конфиденциальности
      </p>
    </form>
  );
}
