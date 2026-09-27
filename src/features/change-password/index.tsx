import { useState, type FormEvent } from "react";
import { useSession } from "@/entities/session";
import { ApiError } from "@/shared/api";
import { Button, Icon } from "@/shared/ui";

/**
 * First sign-in with a temporary password (issued by `create_ops_admins`):
 * the backend keeps `mustChangePassword` until auth/change-password/ succeeds.
 */
export function ChangePasswordForm() {
  const user = useSession((s) => s.user);
  const changePassword = useSession((s) => s.changePassword);
  const signOut = useSession((s) => s.signOut);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = repeat.length > 0 && next !== repeat;
  const tooShort = next.length > 0 && next.length < 8;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (mismatch || tooShort) return;
    setPending(true);
    setError(null);
    try {
      await changePassword(current, next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сменить пароль");
    } finally {
      setPending(false);
    }
  };

  const input =
    "h-10 w-full rounded-full border border-neutral-200 bg-neutral-100 px-4 font-sans text-sm outline-none focus:border-neutral-700";

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-10">
      <form onSubmit={submit} className="flex w-[400px] flex-col gap-3.5 rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center gap-1.5 self-start rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-warn">
          <Icon name="password" />
          Смена временного пароля
        </div>
        <div>
          <div className="text-lg leading-6 font-semibold">{user?.fullName}</div>
          <div className="text-[13px] leading-5 text-neutral-500">
            Вы вошли с временным паролем. Придумайте свой — он понадобится при следующем входе. Логин: <span className="font-num">{user?.username}</span>
          </div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-neutral-500">Временный пароль</span>
          <input className={input} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-neutral-500">Новый пароль · не короче 8 символов</span>
          <input className={input} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-neutral-500">Повторите новый пароль</span>
          <input className={input} type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} required />
        </label>
        {(mismatch || tooShort) && (
          <div className="text-xs text-warn">{tooShort ? "Пароль короче 8 символов" : "Пароли не совпадают"}</div>
        )}
        {error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600">{error}</div>}
        <Button type="submit" variant="primary" size="2xl" disabled={pending || mismatch || tooShort}>
          {pending ? "Сохраняем…" : "Сменить пароль и войти"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => signOut()}>
          Выйти
        </Button>
      </form>
    </div>
  );
}
