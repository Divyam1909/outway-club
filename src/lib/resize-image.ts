"use client";

/**
 * Downscales and re-encodes a photo in the browser before it is uploaded.
 *
 * Why this exists: a trip photo is uploaded once and served thousands of times,
 * so resizing once on the way in is strictly less work than resizing on every
 * request — and it keeps a 6MB DSLR JPEG out of storage in the first place.
 *
 * This is not a Cloudflare workaround. It predates the Images binding and it
 * survives it: `next/image` optimization is back on for both platforms (see
 * next.config.mjs), but that only changes what gets *delivered*. Without this,
 * the original still sits in Supabase Storage at full size, and every distinct
 * width the optimizer is asked for still has to be derived from it.
 *
 * Deliberately not a hard guarantee: if anything here fails, the original file
 * is returned and the upload proceeds. A slightly-too-large photo is a much
 * better outcome than an editor who cannot publish.
 */

/** Widest we ever render a photo — the largest entry in `deviceSizes`. */
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;

/** WebP at this quality is visually clean on photography and roughly 10× smaller. */
const QUALITY = 0.82;

/** Below this, re-encoding usually costs more bytes than it saves. */
const SKIP_UNDER_BYTES = 300 * 1024;

export async function resizeForUpload(file: File): Promise<File> {
  // Already small enough to not be worth touching.
  if (file.size <= SKIP_UNDER_BYTES) return file;

  // createImageBitmap handles EXIF orientation, which a bare <img> does not —
  // without it, phone photos silently upload rotated.
  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  try {
    const scale = Math.min(MAX_WIDTH / bitmap.width, MAX_HEIGHT / bitmap.height, 1);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", QUALITY);
    });

    // A re-encode that came out bigger is a re-encode worth discarding. Happens
    // with flat graphics and screenshots, where the source PNG already wins.
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    bitmap.close();
  }
}
