import { randomUUID } from "crypto";

/**
 * Object storage backed by Supabase Storage.
 *
 * Replaces the previous implementation, which only worked inside Replit
 * (it talked to a local sidecar at 127.0.0.1:1106 to mint Google Cloud
 * Storage credentials). Supabase Storage works from any host, including
 * Render, since it's just a plain HTTPS REST API authenticated with a
 * service-role key.
 *
 * Required env vars:
 * - SUPABASE_URL                e.g. https://xxxx.supabase.co
 * - SUPABASE_SERVICE_ROLE_KEY   service_role secret key (Project Settings > API)
 * - SUPABASE_STORAGE_BUCKET     name of a PUBLIC bucket, e.g. "listing-photos"
 */

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "";

  if (!url || !serviceRoleKey || !bucket) {
    throw new Error(
      "Supabase storage is not configured. Set SUPABASE_URL, " +
        "SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET env vars " +
        "(create a public bucket in Supabase > Storage first)."
    );
  }

  return { url: url.replace(/\/$/, ""), serviceRoleKey, bucket };
}

export interface UploadUrlResult {
  uploadURL: string;
  objectPath: string;
}

export class ObjectStorageService {
  constructor() {}

  /**
   * Creates a short-lived signed URL the client can PUT the raw file to
   * directly, and the stable path we'll use afterwards to serve it back.
   */
  async getObjectEntityUploadURL(): Promise<UploadUrlResult> {
    const { url, serviceRoleKey, bucket } = getSupabaseConfig();
    const objectId = randomUUID();
    const objectName = `uploads/${objectId}`;

    const response = await fetch(
      `${url}/storage/v1/object/upload/sign/${bucket}/${objectName}`,
      {
        method: "POST",   body: JSON.stringify({}),        headers: {
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Failed to create signed upload URL (status ${response.status}): ${body}`
      );
    }

    const json = (await response.json()) as { url: string };
    // json.url is relative, e.g. "/object/upload/sign/<bucket>/<path>?token=..."
    const uploadURL = json.url.startsWith("http")
      ? json.url
      : `${url}/storage/v1${json.url}`;

    return {
      uploadURL,
      objectPath: `/objects/${objectName}`,
    };
  }

  /** Returns the public URL for a previously-uploaded object path. */
  getPublicUrlForObjectPath(objectPath: string): string {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const { url, bucket } = getSupabaseConfig();
    const objectName = objectPath.slice("/objects/".length);
    return `${url}/storage/v1/object/public/${bucket}/${objectName}`;
  }
}
