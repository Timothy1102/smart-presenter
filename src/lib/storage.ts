// ─────────────────────────────────────────────────────────────────────────────
// Storage for uploaded background images, with two interchangeable backends:
//
//   • Supabase Storage — used when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are
//     set (the right choice for production / serverless hosts).
//   • Local filesystem — fallback for local dev. Files go to `public/uploads/`
//     and are served statically at `/uploads/<name>`.
//
// Either way the value stored in the DB is a URL string, which
// `resolveBackground()` renders like any other image URL. This module is the
// only place that knows where files actually live — the API routes and editor
// are backend-agnostic.
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Shared config ───────────────────────────────────────────────────────────

// Allowed image content types → file extension.
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

export class UploadError extends Error {}

// Validate type/size and return the file extension to use.
function validate(file: File): string {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new UploadError(
      `Unsupported file type: ${file.type || "unknown"}. Use JPEG, PNG, WebP, GIF, or AVIF.`
    );
  }
  if (file.size === 0) throw new UploadError("File is empty.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(
      `File too large (max ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)} MB).`
    );
  }
  return ext;
}

// ─── Local filesystem backend ────────────────────────────────────────────────

export const UPLOADS_URL_PREFIX = "/uploads/";
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

async function saveLocal(file: File, filename: string): Promise<string> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);
  return `${UPLOADS_URL_PREFIX}${filename}`;
}

async function deleteLocal(value: string): Promise<void> {
  // Guard against path traversal: only the basename, restricted to our dir.
  const filename = path.basename(value);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (path.dirname(filePath) !== UPLOADS_DIR) return;
  try {
    await fs.unlink(filePath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

// ─── Supabase Storage backend ────────────────────────────────────────────────

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "backgrounds";

const useSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

let _client: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

// Public URL prefix for objects in our bucket, e.g.
// https://<ref>.supabase.co/storage/v1/object/public/backgrounds/
function supabasePublicPrefix(): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/`;
}

async function saveSupabase(file: File, filename: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase()
    .storage.from(SUPABASE_BUCKET)
    .upload(filename, buffer, { contentType: file.type, upsert: false });
  if (error) throw new UploadError(error.message);

  const { data } = supabase().storage.from(SUPABASE_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

async function deleteSupabase(value: string): Promise<void> {
  const objectPath = value.slice(supabasePublicPrefix().length);
  if (!objectPath) return;
  const { error } = await supabase()
    .storage.from(SUPABASE_BUCKET)
    .remove([objectPath]);
  if (error) throw error;
}

// ─── Public API (backend-agnostic) ───────────────────────────────────────────

// Returns true if a stored background value points at a file we manage.
// Recognizes both backends so data created under one still cleans up under it,
// regardless of which backend is currently active.
export function isUploadedImage(value: string): boolean {
  if (value.startsWith(UPLOADS_URL_PREFIX)) return true;
  if (SUPABASE_URL && value.startsWith(supabasePublicPrefix())) return true;
  return false;
}

// Persist an uploaded image and return its URL.
export async function saveUploadedImage(file: File): Promise<string> {
  const ext = validate(file);
  const filename = `${randomUUID()}.${ext}`;
  return useSupabase ? saveSupabase(file, filename) : saveLocal(file, filename);
}

// Delete an uploaded image given its URL. Routes by the URL's form (not the
// active backend) so each file is removed from where it actually lives. No-op
// for preset keys, external URLs, or files already gone.
export async function deleteUploadedImage(value: string): Promise<void> {
  if (value.startsWith(UPLOADS_URL_PREFIX)) {
    await deleteLocal(value);
  } else if (SUPABASE_URL && value.startsWith(supabasePublicPrefix())) {
    await deleteSupabase(value);
  }
}
