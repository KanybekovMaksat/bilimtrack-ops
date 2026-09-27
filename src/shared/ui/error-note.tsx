import { cn } from "../lib";

type ErrorNoteProps = {
  /** A failed query/mutation error or a ready message; nothing is rendered without one. */
  error?: Error | string | null | false;
  /** Context before the message: «Статус не сохранён». */
  prefix?: string;
  className?: string;
};

/** Red inline note under a form or list with the server's error message. */
export function ErrorNote({ error, prefix, className }: ErrorNoteProps) {
  if (!error) return null;
  const message = typeof error === "string" ? error : error.message;
  return (
    <div role="alert" className={cn("rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-600", className)}>
      {prefix ? `${prefix}: ${message}` : message}
    </div>
  );
}
