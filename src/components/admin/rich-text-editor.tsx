"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Type,
  Underline,
  Undo2,
} from "lucide-react";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/client";

/**
 * The article editor.
 *
 * A contentEditable surface carrying the same `.post-prose` styles the public
 * article page uses, so what a writer sees while typing is what a reader gets
 * — no separate preview mode to drift out of sync.
 *
 * React never re-renders the editable subtree after mount: the DOM inside is
 * the browser's to own (that's what makes undo, selection and IME input work),
 * and React reconciling it mid-keystroke would move the caret. The value flows
 * out through `onChange` and back in only when the parent hands us a
 * genuinely different document via `resetKey`.
 *
 * Everything produced here is re-sanitised server-side before it is stored
 * (src/lib/sanitize-html.ts). The class allowlist there and the buttons here
 * are deliberately the same short list.
 */

const BUCKET = "blog-images";
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const BLOCK_TAGS = new Set(["p", "h2", "h3", "h4", "li", "blockquote", "figcaption", "pre", "div"]);

/** Mutually exclusive class groups applied to the block under the caret. */
const CLASS_GROUPS = {
  size: ["post-lead", "post-small"],
  family: ["post-serif", "post-sans"],
  align: ["post-center", "post-right"],
  special: ["post-pullquote"],
} as const;

const ALL_BLOCK_CLASSES = Object.values(CLASS_GROUPS).flat();

export function RichTextEditor({
  value,
  onChange,
  resetKey,
}: {
  value: string;
  onChange: (html: string) => void;
  /** Changing this replaces the editor contents — used when loading a post. */
  resetKey?: string;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const loadedKey = useRef<string | undefined>(undefined);

  const [active, setActive] = useState<Record<string, boolean>>({});
  const [blockClasses, setBlockClasses] = useState<string[]>([]);
  const [blockTag, setBlockTag] = useState("p");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stats, setStats] = useState({ words: 0, minutes: 1 });

  // Seed the DOM once, then leave it alone.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (loadedKey.current === (resetKey ?? "")) return;

    loadedKey.current = resetKey ?? "";
    editor.innerHTML = value || "<p><br /></p>";
    updateStats(editor.innerHTML);
    // Enter should produce paragraphs, not bare divs — matches the article CSS.
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      /* Firefox throws on unknown commands; the default is already <p> there. */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  function updateStats(html: string) {
    const words = html
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .split(/\s+/)
      .filter(Boolean).length;
    setStats({ words, minutes: Math.max(1, Math.round(words / 220)) });
  }

  const emit = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    onChange(editor.innerHTML);
    updateStats(editor.innerHTML);
  }, [onChange]);

  /** Reads the browser's formatting state for the current selection. */
  const syncToolbar = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !editor.contains(document.getSelection()?.anchorNode ?? null)) return;

    const state: Record<string, boolean> = {};
    for (const command of ["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList"]) {
      try {
        state[command] = document.queryCommandState(command);
      } catch {
        state[command] = false;
      }
    }
    setActive(state);

    const block = currentBlock(editor);
    setBlockTag(block?.tagName.toLowerCase() ?? "p");
    setBlockClasses(block ? [...block.classList] : []);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", syncToolbar);
    return () => document.removeEventListener("selectionchange", syncToolbar);
  }, [syncToolbar]);

  function run(command: string, argument?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    emit();
    syncToolbar();
  }

  function setBlock(tag: "p" | "h2" | "h3" | "h4" | "blockquote" | "pre") {
    run("formatBlock", `<${tag}>`);
  }

  /** Toggles a style class on the block under the caret. */
  function toggleBlockClass(className: string) {
    const editor = editorRef.current;
    if (!editor) return;

    const block = currentBlock(editor);
    if (!block) return;

    const group = Object.values(CLASS_GROUPS).find((names) =>
      (names as readonly string[]).includes(className)
    );
    const isOn = block.classList.contains(className);

    // Clear the rest of the group so "large" and "small" can't both apply.
    for (const name of group ?? []) block.classList.remove(name);
    if (!isOn) block.classList.add(className);

    // Keep the element clean rather than leaving class="" lying around.
    if (block.classList.length === 0) block.removeAttribute("class");

    emit();
    syncToolbar();
  }

  /**
   * Wraps the selection in <mark>. Deliberately not execCommand("hiliteColor")
   * — that emits an inline background style, which the server sanitiser drops,
   * so the highlight would vanish on save without the writer ever being told.
   */
  function toggleHighlight() {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const existing = closestTag(selection.getRangeAt(0).startContainer, "mark", editor);
    if (existing?.parentNode) {
      const parent = existing.parentNode;
      while (existing.firstChild) parent.insertBefore(existing.firstChild, existing);
      parent.removeChild(existing);
      emit();
      syncToolbar();
      return;
    }

    if (selection.isCollapsed) return;
    run("insertHTML", `<mark>${escapeText(selection.toString())}</mark>`);
  }

  /** Drops centre/right alignment, returning the block to the default flow. */
  function alignLeft() {
    const editor = editorRef.current;
    const block = editor ? currentBlock(editor) : null;
    if (!block) return;

    for (const name of CLASS_GROUPS.align) block.classList.remove(name);
    if (block.classList.length === 0) block.removeAttribute("class");

    emit();
    syncToolbar();
  }

  function clearFormatting() {
    const editor = editorRef.current;
    const block = currentBlock(editor!);
    if (block) {
      for (const name of ALL_BLOCK_CLASSES) block.classList.remove(name);
      if (block.classList.length === 0) block.removeAttribute("class");
    }
    run("removeFormat");
  }

  function insertLink() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      window.alert("Select the words you want to turn into a link first.");
      return;
    }
    const href = window.prompt("Link address", "https://");
    if (!href) return;

    const trimmed = href.trim();
    if (!/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(trimmed)) {
      window.alert("Links must start with https://, mailto:, tel:, / or #.");
      return;
    }
    run("createLink", trimmed);
  }

  async function uploadImage(file: File) {
    setUploadError(null);

    if (!ACCEPTED.includes(file.type)) {
      setUploadError(`${file.name}: only JPG, PNG, WebP or AVIF are accepted.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError(`${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is 8MB.`);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "31536000", upsert: false });

    setUploading(false);

    if (error) {
      setUploadError(error.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const caption = window.prompt("Caption for this photo (optional)", "") ?? "";
    const alt = escapeAttribute(caption || file.name.replace(/\.[^.]+$/, ""));

    run(
      "insertHTML",
      `<figure class="post-figure"><img src="${escapeAttribute(publicUrl)}" alt="${alt}" />` +
        (caption ? `<figcaption>${escapeText(caption)}</figcaption>` : "") +
        `</figure><p><br /></p>`
    );
  }

  /**
   * Paste as plain text. Real-world pastes come from Docs, Word and other
   * sites carrying inline styles and font tags that the sanitiser strips
   * anyway — dropping them here means the writer sees the true result
   * immediately instead of after saving.
   */
  function handlePaste(event: React.ClipboardEvent) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    if (!text) return;

    const paragraphs = text.split(/\n{2,}/).filter(Boolean);
    if (paragraphs.length > 1) {
      run(
        "insertHTML",
        paragraphs.map((paragraph) => `<p>${escapeText(paragraph).replace(/\n/g, "<br />")}</p>`).join("")
      );
    } else {
      run("insertHTML", escapeText(text).replace(/\n/g, "<br />"));
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!(event.metaKey || event.ctrlKey)) return;

    const key = event.key.toLowerCase();
    if (key === "k") {
      event.preventDefault();
      insertLink();
    }
    // b / i / u are native; letting the browser handle them keeps undo intact,
    // but the toolbar still needs to catch up afterwards.
    if (["b", "i", "u"].includes(key)) {
      window.setTimeout(() => {
        emit();
        syncToolbar();
      }, 0);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      {/* --- Toolbar -------------------------------------------------------
          top-20 parks it directly under the site header, which is itself
          sticky at h-20 — at top-0 the toolbar scrolls underneath and
          disappears exactly when a long article needs it most. */}
      <div className="sticky top-20 z-20 border-b border-border bg-cream-200/95 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-1 p-2">
          <Group>
            <ToolButton label="Paragraph" active={blockTag === "p"} onClick={() => setBlock("p")}>
              <Pilcrow size={15} />
            </ToolButton>
            <ToolButton label="Heading" active={blockTag === "h2"} onClick={() => setBlock("h2")}>
              <Heading2 size={15} />
            </ToolButton>
            <ToolButton label="Subheading" active={blockTag === "h3"} onClick={() => setBlock("h3")}>
              <Heading3 size={15} />
            </ToolButton>
            <ToolButton
              label="Section label"
              active={blockTag === "h4"}
              onClick={() => setBlock("h4")}
            >
              <span className="text-[11px] font-bold tracking-wider">H4</span>
            </ToolButton>
          </Group>

          <Divider />

          <Group>
            <ToolButton label="Bold" active={active.bold} onClick={() => run("bold")}>
              <Bold size={15} />
            </ToolButton>
            <ToolButton label="Italic" active={active.italic} onClick={() => run("italic")}>
              <Italic size={15} />
            </ToolButton>
            <ToolButton label="Underline" active={active.underline} onClick={() => run("underline")}>
              <Underline size={15} />
            </ToolButton>
            <ToolButton
              label="Strikethrough"
              active={active.strikeThrough}
              onClick={() => run("strikeThrough")}
            >
              <Strikethrough size={15} />
            </ToolButton>
            <ToolButton label="Highlight" onClick={toggleHighlight}>
              <Highlighter size={15} />
            </ToolButton>
          </Group>

          <Divider />

          <Group>
            <ToolButton
              label="Large text"
              active={blockClasses.includes("post-lead")}
              onClick={() => toggleBlockClass("post-lead")}
            >
              <Type size={16} />
            </ToolButton>
            <ToolButton
              label="Small text"
              active={blockClasses.includes("post-small")}
              onClick={() => toggleBlockClass("post-small")}
            >
              <Type size={12} />
            </ToolButton>
            <ToolButton
              label="Serif font"
              active={blockClasses.includes("post-serif")}
              onClick={() => toggleBlockClass("post-serif")}
            >
              <span className="font-display text-[13px] font-semibold">Aa</span>
            </ToolButton>
            <ToolButton
              label="Sans font"
              active={blockClasses.includes("post-sans")}
              onClick={() => toggleBlockClass("post-sans")}
            >
              <span className="font-sans text-[13px] font-semibold">Aa</span>
            </ToolButton>
          </Group>

          <Divider />

          <Group>
            <ToolButton
              label="Bulleted list"
              active={active.insertUnorderedList}
              onClick={() => run("insertUnorderedList")}
            >
              <List size={15} />
            </ToolButton>
            <ToolButton
              label="Numbered list"
              active={active.insertOrderedList}
              onClick={() => run("insertOrderedList")}
            >
              <ListOrdered size={15} />
            </ToolButton>
            <ToolButton
              label="Quote"
              active={blockTag === "blockquote"}
              onClick={() => setBlock("blockquote")}
            >
              <Quote size={15} />
            </ToolButton>
            <ToolButton
              label="Pull quote"
              active={blockClasses.includes("post-pullquote")}
              onClick={() => toggleBlockClass("post-pullquote")}
            >
              <span className="text-[15px] font-bold leading-none">&ldquo;</span>
            </ToolButton>
            <ToolButton label="Divider" onClick={() => run("insertHorizontalRule")}>
              <Minus size={15} />
            </ToolButton>
          </Group>

          <Divider />

          <Group>
            <ToolButton
              label="Align left"
              active={!blockClasses.includes("post-center") && !blockClasses.includes("post-right")}
              onClick={alignLeft}
            >
              <AlignLeft size={15} />
            </ToolButton>
            <ToolButton
              label="Align centre"
              active={blockClasses.includes("post-center")}
              onClick={() => toggleBlockClass("post-center")}
            >
              <AlignCenter size={15} />
            </ToolButton>
            <ToolButton
              label="Align right"
              active={blockClasses.includes("post-right")}
              onClick={() => toggleBlockClass("post-right")}
            >
              <AlignRight size={15} />
            </ToolButton>
          </Group>

          <Divider />

          <Group>
            <ToolButton label="Add link" onClick={insertLink}>
              <Link2 size={15} />
            </ToolButton>
            <ToolButton label="Remove link" onClick={() => run("unlink")}>
              <Link2Off size={15} />
            </ToolButton>
            <ToolButton
              label={uploading ? "Uploading photo" : "Insert photo"}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
            </ToolButton>
          </Group>

          <Divider />

          <Group>
            <ToolButton label="Clear formatting" onClick={clearFormatting}>
              <RemoveFormatting size={15} />
            </ToolButton>
            <ToolButton label="Undo" onClick={() => run("undo")}>
              <Undo2 size={15} />
            </ToolButton>
            <ToolButton label="Redo" onClick={() => run("redo")}>
              <Redo2 size={15} />
            </ToolButton>
          </Group>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) uploadImage(file);
            event.target.value = "";
          }}
        />
      </div>

      {uploadError && (
        <p role="alert" className="border-b border-border bg-clay-50 px-4 py-2.5 text-xs text-clay-600">
          {uploadError}
        </p>
      )}

      {/* --- Writing surface ------------------------------------------------ */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Article body"
        data-placeholder="Start writing. The first paragraph is what people read before they decide to keep going."
        spellCheck
        onInput={emit}
        onBlur={emit}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onMouseUp={syncToolbar}
        className="post-prose post-editor min-h-[26rem] px-5 py-7 focus:outline-none sm:px-9 sm:py-9"
      />

      <div className="flex items-center justify-between border-t border-border bg-cream-200/60 px-4 py-2.5 text-xs text-ink-400">
        <span>
          {stats.words.toLocaleString("en-IN")} word{stats.words === 1 ? "" : "s"} ·{" "}
          {stats.minutes} min read
        </span>
        <span className="hidden sm:inline">Ctrl/⌘ + B, I, U, K</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function currentBlock(editor: HTMLElement): HTMLElement | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  let node: Node | null = selection.getRangeAt(0).startContainer;
  while (node && node !== editor) {
    if (node instanceof HTMLElement && BLOCK_TAGS.has(node.tagName.toLowerCase())) return node;
    node = node.parentNode;
  }
  return null;
}

function closestTag(start: Node, tag: string, editor: HTMLElement): HTMLElement | null {
  let node: Node | null = start;
  while (node && node !== editor) {
    if (node instanceof HTMLElement && node.tagName.toLowerCase() === tag) return node;
    node = node.parentNode;
  }
  return null;
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-border sm:block" />;
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active ? true : undefined}
      disabled={disabled}
      // Keeps the caret where it is — a mousedown on a button would otherwise
      // blur the editor and collapse the selection before the command runs.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={clsx(
        "flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 transition-colors disabled:opacity-40",
        active ? "bg-pine text-cream-100" : "text-ink-700 hover:bg-ink/5 hover:text-pine"
      )}
    >
      {children}
    </button>
  );
}
