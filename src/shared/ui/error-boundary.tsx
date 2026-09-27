import { Component, type ReactNode } from "react";
import { ApiError } from "../api";
import { Button } from "./button";
import { EmptyState } from "./layout";

type Props = { children: ReactNode; onReset?: () => void };
type State = { error: Error | null };

function describe(error: Error): { icon: string; title: string; text: string } {
  if (error instanceof ApiError) {
    if (error.status === 401) return { icon: "lock", title: "Сессия истекла", text: "Войдите заново." };
    if (error.status === 403)
      return {
        icon: "lock",
        title: "Нет доступа",
        text: "Раздел работает под аккаунтом поддержки Bilimtrack (bilimtrack_tech_support) или сотрудника с правами staff. Войдите под таким аккаунтом.",
      };
    if (error.status === 404) return { icon: "filter-off", title: "Не найдено", text: "Такой записи нет или она удалена." };
    if (error.status === 0) return { icon: "alert-circle", title: "Нет связи с сервером", text: error.message };
    return { icon: "alert-circle", title: "Не удалось загрузить данные", text: `${error.message} (код ${error.status})` };
  }
  return { icon: "alert-circle", title: "Что-то пошло не так", text: error.message };
}

/** Renders API errors thrown by suspense queries as a readable page-level state. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const d = describe(error);
    return (
      <EmptyState
        icon={d.icon}
        iconClassName={d.icon === "alert-circle" ? "text-red-500" : undefined}
        title={d.title}
        description={d.text}
        action={
          <Button variant="primary" size="md" onClick={this.reset}>
            Повторить
          </Button>
        }
      />
    );
  }
}
