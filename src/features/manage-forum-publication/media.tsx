import { useMemo, useRef, useState } from "react";
import {
  IMAGE_ACCEPT,
  MAX_IMAGES,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_SECONDS,
  VIDEO_ACCEPT,
  formatDuration,
} from "@/entities/forum-publication";
import { formatBytes } from "@/shared/lib";
import { Button, Callout, Icon } from "@/shared/ui";

/** Duration from the file's metadata, or null when the browser cannot read it (HEVC on Windows) — the backend checks again. */
function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => done(Number.isFinite(video.duration) ? video.duration : null);
    video.onerror = () => done(null);
    video.src = url;
  });
}

/** Problem with the picked video, or null if it fits the limits. */
async function checkVideo(file: File): Promise<string | null> {
  if (file.size > MAX_VIDEO_BYTES) return `Видео больше ${formatBytes(MAX_VIDEO_BYTES)}.`;
  const duration = await readVideoDuration(file);
  if (duration !== null && duration > MAX_VIDEO_SECONDS) {
    return `Видео длится ${formatDuration(duration)}, а можно не больше ${MAX_VIDEO_SECONDS / 60} минут.`;
  }
  return null;
}

/**
 * Object URLs for local previews. Not revoked: a picked `File` is backed by the disk, the URL only
 * pins that reference until the tab closes, and revoking in an effect cleanup breaks StrictMode remounts.
 */
function useObjectUrls(files: File[]) {
  return useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
}

type Existing = { id: number; url: string };

function Thumb({ src, onRemove }: { src?: string; onRemove?: () => void }) {
  // HEIC has no preview outside Safari: the server converts it, the tile shows an icon meanwhile.
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
      {src && !failed ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <Icon name="photo" size={20} className="text-neutral-400" />
      )}
      {onRemove && <Button size="xs" variant="inverse" icon="x" aria-label="Убрать фото" className="absolute top-1 right-1" onClick={onRemove} />}
    </div>
  );
}

/** Photos: kept ones from the server plus new local files, max `MAX_IMAGES` together. */
export function ImagesPicker({
  existing = [],
  onExistingChange,
  files,
  onFilesChange,
  disabled,
}: {
  existing?: Existing[];
  onExistingChange?: (next: Existing[]) => void;
  files: File[];
  onFilesChange: (next: File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useObjectUrls(files);
  const total = existing.length + files.length;
  const thumbs = [
    ...existing.map((img) => ({ key: `e${img.id}`, src: img.url, remove: () => onExistingChange?.(existing.filter((x) => x.id !== img.id)) })),
    ...files.map((file, i) => ({ key: `n${i}-${file.name}`, src: urls[i], remove: () => onFilesChange(files.filter((_, j) => j !== i)) })),
  ];
  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={IMAGE_ACCEPT}
        onChange={(e) => {
          const picked = e.target.files ? Array.from(e.target.files) : [];
          e.target.value = "";
          onFilesChange([...files, ...picked].slice(0, Math.max(0, MAX_IMAGES - existing.length)));
        }}
      />
      {thumbs.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {thumbs.map((t) => (
            <Thumb key={t.key} src={t.src} onRemove={disabled ? undefined : t.remove} />
          ))}
        </div>
      )}
      <Button size="md" icon="photo" className="self-start" disabled={disabled || total >= MAX_IMAGES} onClick={() => inputRef.current?.click()}>
        {total ? `Фото ${total}/${MAX_IMAGES}` : "Добавить фото"}
      </Button>
    </div>
  );
}

/** One video: either the one already on the server or a new local file. */
export function VideoPicker({
  current,
  onRemoveCurrent,
  file,
  onFileChange,
  disabled,
}: {
  current?: { url: string; durationSeconds: number; isProcessed: boolean } | null;
  onRemoveCurrent?: () => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [checking, setChecking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const urls = useObjectUrls(file ? [file] : []);
  const src = file ? urls[0] : current?.url;
  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={VIDEO_ACCEPT}
        onChange={async (e) => {
          const picked = e.target.files?.[0];
          e.target.value = "";
          if (!picked) return;
          setChecking(true);
          const issue = await checkVideo(picked);
          setChecking(false);
          setProblem(issue);
          if (!issue) onFileChange(picked);
        }}
      />
      {src && (
        <div className="relative overflow-hidden rounded-lg bg-neutral-900">
          <video src={src} controls preload="metadata" className="aspect-video w-full object-contain" />
          {!disabled && (
            <Button
              size="xs"
              variant="inverse"
              icon="x"
              aria-label="Убрать видео"
              className="absolute top-2 right-2"
              onClick={() => (file ? onFileChange(null) : onRemoveCurrent?.())}
            />
          )}
        </div>
      )}
      {file && (
        <div className="text-xs text-neutral-500">
          {file.name} · {formatBytes(file.size)} — после публикации сервер пережмёт видео в 720p.
        </div>
      )}
      {!file && current && !current.isProcessed && <div className="text-xs text-neutral-500">Видео ещё пережимается в 720p.</div>}
      {problem && <Callout tone="danger">{problem}</Callout>}
      {!src && (
        <Button size="md" icon="video" className="self-start" disabled={disabled || checking} onClick={() => inputRef.current?.click()}>
          {checking ? "Проверяем видео…" : "Добавить видео до 30 минут"}
        </Button>
      )}
    </div>
  );
}
