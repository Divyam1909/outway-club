"use client";

import { useRef, useState } from "react";
import { GripVertical, ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/client";
import { SmartImage } from "@/components/ui/smart-image";
import { friendlyError } from "@/lib/error-messages";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Uploads real photography straight to Supabase Storage and hands back public
 * URLs — replacing the raw "paste a URL" text field the trip editor used to
 * have. Existing URL values keep working, so photos hosted elsewhere are
 * still valid.
 */
export function ImageUploader({
  label,
  hint,
  value,
  onChange,
  multiple = false,
  bucket = "trip-images",
}: {
  label: string;
  hint?: string;
  /** Single URL string, or a list when `multiple`. */
  value: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  /** Storage bucket to upload into. Editorial photography lives separately. */
  bucket?: "trip-images" | "blog-images";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  /**
   * Uploads are per-file, so a batch can partly succeed. Each rejection is
   * collected rather than overwriting the last one — dropping in six photos
   * and being told about only the sixth failure is how you end up with a
   * gallery that's quietly missing images.
   */
  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    setError(null);
    setUploading(true);

    const supabase = createClient();
    const uploaded: string[] = [];
    const failures: string[] = [];

    for (const [index, file] of list.entries()) {
      if (!ACCEPTED.includes(file.type)) {
        failures.push(`${file.name} — not a JPG, PNG, WebP or AVIF.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        failures.push(
          `${file.name} — ${(file.size / 1024 / 1024).toFixed(1)}MB, over the 8MB limit. Resize it and try again.`
        );
        continue;
      }

      setProgress(`Uploading ${index + 1} of ${list.length}…`);

      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${extension}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, { cacheControl: "31536000", upsert: false });

        if (uploadError) {
          failures.push(
            `${file.name} — ${friendlyError(uploadError, "image", "upload failed, please try again.")}`
          );
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(path);
        uploaded.push(publicUrl);
      } catch (caught) {
        console.error("[image-uploader] upload threw:", caught);
        failures.push(`${file.name} — the connection dropped during upload.`);
      }
    }

    setProgress(null);
    setUploading(false);

    if (uploaded.length > 0) {
      onChange(multiple ? [...value, ...uploaded] : [uploaded[uploaded.length - 1]]);
    }

    if (failures.length > 0) {
      const summary =
        uploaded.length > 0
          ? `${uploaded.length} uploaded, ${failures.length} didn't:`
          : failures.length === 1
            ? "This image didn't upload:"
            : "None of these uploaded:";
      setError(`${summary}\n${failures.map((line) => `• ${line}`).join("\n")}`);
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink-700">{label}</span>
        {value.length > 0 && (
          <span className="text-xs text-ink-400">
            {value.length} image{value.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files?.length) uploadFiles(event.dataTransfer.files);
        }}
        className={clsx(
          "rounded-xl border-2 border-dashed p-5 text-center transition-colors",
          dragging ? "border-pine bg-pine-50" : "border-border bg-cream-200/40"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple={multiple}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files?.length) uploadFiles(event.target.files);
          }}
        />

        {uploading ? (
          <p className="flex items-center justify-center gap-2 py-2 text-sm text-ink-500">
            <Loader2 size={16} className="animate-spin" /> {progress ?? "Uploading…"}
          </p>
        ) : (
          <>
            <UploadCloud size={22} className="mx-auto mb-2 text-ink-400" />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="btn-outline !px-4 !py-2 text-xs"
            >
              <ImagePlus size={13} /> {multiple ? "Add photos" : "Choose photo"}
            </button>
            <p className="mt-2 text-xs text-ink-400">
              or drag and drop · JPG, PNG, WebP or AVIF · up to 8MB each
            </p>
          </>
        )}
      </div>

      {hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}

      {error && (
        <p
          role="alert"
          className="mt-2 whitespace-pre-line rounded-lg bg-clay-50 px-3 py-2 text-xs leading-relaxed text-clay-600"
        >
          {error}
        </p>
      )}

      {value.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url, index) => (
            <li key={`${url}-${index}`} className="group relative overflow-hidden rounded-xl border border-border">
              <div className="relative aspect-[4/3] bg-cream-300">
                <SmartImage src={url} alt="" fill sizes="200px" className="object-cover" />
              </div>

              <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-1 bg-gradient-to-b from-ink/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                {multiple ? (
                  <span className="flex gap-0.5">
                    <IconButton label="Move left" onClick={() => move(index, -1)} disabled={index === 0}>
                      <GripVertical size={12} className="rotate-90" />
                    </IconButton>
                  </span>
                ) : (
                  <span />
                )}
                <IconButton label="Remove image" onClick={() => remove(index)}>
                  <Trash2 size={12} />
                </IconButton>
              </div>

              {multiple && index === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cream-100">
                  First
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-6 w-6 items-center justify-center rounded-full bg-cream-100/90 text-ink transition-colors hover:bg-white disabled:opacity-40"
    >
      {children}
    </button>
  );
}
