export type MediaAttachmentInput = {
  uri: string;
  name?: string;
  type?: string;
  durationMs?: number;
};

export type MediaNoteSubmitPayload = {
  content?: string;
  files: MediaAttachmentInput[];
  durationMs?: number;
};

export type MediaSubmitAdapter = (payload: MediaNoteSubmitPayload) => Promise<void>;

const AUDIO_MIME_NORMALIZATION: Record<string, string> = {
  "audio/m4a": "audio/mp4",
  "audio/x-m4a": "audio/mp4",
};

const ensureUploadUri = (uri: string) => {
  if (uri.startsWith("file://") || uri.startsWith("content://")) {
    return uri;
  }
  return `file://${uri}`;
};

const inferMimeType = (filename?: string) => {
  if (!filename) return "application/octet-stream";
  const lower = filename.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".aac")) return "audio/aac";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  return "application/octet-stream";
};

const defaultFilename = (type: string) => {
  if (type.startsWith("image/")) return `image-${Date.now()}.jpg`;
  if (type.startsWith("video/")) return `video-${Date.now()}.mp4`;
  if (type.startsWith("audio/")) return `audio-${Date.now()}.m4a`;
  return `file-${Date.now()}`;
};

export const normalizeMediaFile = (file: MediaAttachmentInput) => {
  const normalizedType = AUDIO_MIME_NORMALIZATION[file.type ?? ""] ?? file.type ?? inferMimeType(file.name);
  const normalizedName = file.name?.trim() || defaultFilename(normalizedType);

  return {
    uri: ensureUploadUri(file.uri),
    name: normalizedName,
    type: normalizedType,
    durationMs: file.durationMs,
  };
};

export const buildMediaFormData = (input: {
  content?: string;
  durationMs?: number;
  files: MediaAttachmentInput[];
  fields?: Record<string, string>;
}) => {
  const formData = new FormData();

  for (const [key, value] of Object.entries(input.fields ?? {})) {
    formData.append(key, value);
  }

  if (input.content) {
    formData.append("content", input.content);
  }

  if (typeof input.durationMs === "number") {
    formData.append("durationMs", String(input.durationMs));
  }

  for (const file of input.files) {
    formData.append("files", normalizeMediaFile(file) as never);
  }

  return formData;
};
