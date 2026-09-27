import { useState, type FormEvent } from "react";
import { useSessionStore } from "@/entities/session";
import { Button, Input, Label } from "@/shared/ui";

/** Mock sign-in: accepts any work email until the real auth API is wired. */
export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const setUser = useSessionStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.endsWith("@bilimtrack.kg")) {
      setError("Используйте рабочую почту @bilimtrack.kg");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен быть не короче 6 символов");
      return;
    }
    const name = email.split("@")[0];
    setUser({ id: "emp-1", email, name: name.charAt(0).toUpperCase() + name.slice(1) });
    onSuccess();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Label text="Email">
        <Input type="email" autoComplete="username" placeholder="name@bilimtrack.kg" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Label>
      <Label text="Пароль">
        <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" className="justify-center">Войти</Button>
    </form>
  );
}
