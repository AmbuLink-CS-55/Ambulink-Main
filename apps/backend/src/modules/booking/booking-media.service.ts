import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import env from "../../../env";
import type { BookingAttachment, BookingNote } from "@ambulink/types";

export type UploadedMediaFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

type DraftAttachment = Omit<BookingAttachment, "url">;

type DraftNote = {
  id: string;
  content: string;
  createdAt: string;
  attachments: DraftAttachment[];
};

type UploadSessionManifest = {
  id: string;
  patientId: string;
  createdAt: string;
  expiresAt: string;
  boundBookingId: string | null;
  notes: DraftNote[];
};

type CreateMediaNoteInput = {
  bookingId: string;
  authorId: string;
  authorName: string;
  authorRole: "PATIENT" | "EMT";
  content?: string | null;
  files: UploadedMediaFile[];
  durationMs?: number | null;
};

const MAX_FILES_PER_NOTE = 5;

@Injectable()
export class BookingMediaService implements OnModuleInit, OnModuleDestroy {
  private readonly rootDir = path.resolve(
    env.BOOKING_MEDIA_ROOT ?? path.join(os.tmpdir(), "ambulink-booking-media")
  );
  private readonly sessionsDir = path.join(this.rootDir, "sessions");
  private readonly bookingsDir = path.join(this.rootDir, "bookings");
  private cleanupTimer: NodeJS.Timeout | null = null;

  async onModuleInit() {
    await fs.mkdir(this.sessionsDir, { recursive: true });
    await fs.mkdir(this.bookingsDir, { recursive: true });
    this.cleanupTimer = setInterval(
      () => void this.cleanupExpiredSessions(),
      30 * 60 * 1000
    );
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  async startUploadSession(patientId: string) {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + env.BOOKING_UPLOAD_SESSION_TTL_HOURS * 60 * 60 * 1000
    );
    const manifest: UploadSessionManifest = {
      id: randomUUID(),
      patientId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      boundBookingId: null,
      notes: [],
    };

    await this.writeSessionManifest(manifest);
    await fs.mkdir(this.getSessionFilesDir(manifest.id), { recursive: true });

    return { uploadSessionId: manifest.id, expiresAt: manifest.expiresAt };
  }

  async appendSessionFiles(params: {
    sessionId: string;
    patientId: string;
    content?: string | null;
    files: UploadedMediaFile[];
    durationMs?: number | null;
  }) {
    this.ensureFileCount(params.files);
    const manifest = await this.readOwnedSession(params.sessionId, params.patientId);
    this.ensureSessionWritable(manifest);

    const note = await this.saveDraftNoteToSession(manifest.id, {
      content: params.content ?? "",
      createdAt: new Date().toISOString(),
      files: params.files,
      durationMs: params.durationMs ?? null,
    });

    manifest.notes.push(note);
    await this.writeSessionManifest(manifest);
    return { noteId: note.id };
  }

  async createBookingMediaNote(input: CreateMediaNoteInput): Promise<BookingNote> {
    this.ensureFileCount(input.files);
    const attachments = await this.saveBookingFiles(
      input.bookingId,
      input.files,
      input.durationMs ?? null
    );

    return {
      id: randomUUID(),
      bookingId: input.bookingId,
      authorId: input.authorId,
      authorName: input.authorName,
      authorRole: input.authorRole,
      content: (input.content ?? "").trim(),
      type: attachments.length > 0 ? "MEDIA" : "TEXT",
      attachments,
      createdAt: new Date().toISOString(),
    };
  }

  async bindSessionsToBooking(params: {
    patientId: string;
    bookingId: string;
    patientName: string;
  }): Promise<BookingNote[]> {
    const manifests = await this.findOpenSessions(params.patientId);
    if (manifests.length === 0) return [];

    const boundNotes: BookingNote[] = [];
    for (const manifest of manifests) {
      manifest.boundBookingId = params.bookingId;
      for (const draftNote of manifest.notes) {
        const attachments = await this.moveDraftFilesToBooking(
          manifest.id,
          params.bookingId,
          draftNote.attachments
        );
        boundNotes.push({
          id: randomUUID(),
          bookingId: params.bookingId,
          authorId: params.patientId,
          authorName: params.patientName,
          authorRole: "PATIENT",
          content: draftNote.content,
          type: attachments.length > 0 ? "MEDIA" : "TEXT",
          attachments,
          createdAt: draftNote.createdAt,
        });
      }
      await this.writeSessionManifest(manifest);
    }

    return boundNotes.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  buildAttachmentStoragePath(bookingId: string, attachmentId: string, filename: string) {
    return path.join(this.bookingsDir, bookingId, `${attachmentId}__${this.sanitizeFilename(filename)}`);
  }

  buildAttachmentUrl(bookingId: string, attachmentId: string) {
    return `/api/booking/${bookingId}/attachments/${attachmentId}`;
  }

  async getAttachmentFile(bookingId: string, attachment: BookingAttachment) {
    const filePath = this.buildAttachmentStoragePath(bookingId, attachment.id, attachment.filename);
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new NotFoundException("Attachment not found");
      }
      return { filePath, mimeType: attachment.mimeType, filename: attachment.filename };
    } catch {
      throw new NotFoundException("Attachment not found");
    }
  }

  private async saveDraftNoteToSession(
    sessionId: string,
    params: { content: string; createdAt: string; files: UploadedMediaFile[]; durationMs: number | null }
  ): Promise<DraftNote> {
    const filesDir = this.getSessionFilesDir(sessionId);
    await fs.mkdir(filesDir, { recursive: true });

    const attachments: DraftAttachment[] = [];
    let firstAudioDurationApplied = false;
    for (const file of params.files) {
      const kind = this.resolveKind(file.mimetype);
      this.validateFileSize(kind, file.size);
      const id = randomUUID();
      const filename = this.sanitizeFilename(file.originalname || `${kind.toLowerCase()}-${id}`);
      const storedName = `${id}__${filename}`;
      await fs.writeFile(path.join(filesDir, storedName), file.buffer);
      attachments.push({
        id,
        kind,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        filename,
        ...(kind === "AUDIO" && params.durationMs && !firstAudioDurationApplied
          ? { durationMs: params.durationMs }
          : {}),
      });
      if (kind === "AUDIO") {
        firstAudioDurationApplied = true;
      }
    }

    return {
      id: randomUUID(),
      content: params.content.trim(),
      createdAt: params.createdAt,
      attachments,
    };
  }

  private async saveBookingFiles(
    bookingId: string,
    files: UploadedMediaFile[],
    durationMs: number | null
  ): Promise<BookingAttachment[]> {
    const targetDir = path.join(this.bookingsDir, bookingId);
    await fs.mkdir(targetDir, { recursive: true });

    const attachments: BookingAttachment[] = [];
    let firstAudioDurationApplied = false;
    for (const file of files) {
      const kind = this.resolveKind(file.mimetype);
      this.validateFileSize(kind, file.size);
      const id = randomUUID();
      const filename = this.sanitizeFilename(file.originalname || `${kind.toLowerCase()}-${id}`);
      const storedName = `${id}__${filename}`;
      await fs.writeFile(path.join(targetDir, storedName), file.buffer);
      attachments.push({
        id,
        kind,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        filename,
        url: this.buildAttachmentUrl(bookingId, id),
        ...(kind === "AUDIO" && durationMs && !firstAudioDurationApplied
          ? { durationMs }
          : {}),
      });
      if (kind === "AUDIO") {
        firstAudioDurationApplied = true;
      }
    }

    return attachments;
  }

  private async moveDraftFilesToBooking(
    sessionId: string,
    bookingId: string,
    draftAttachments: DraftAttachment[]
  ): Promise<BookingAttachment[]> {
    if (draftAttachments.length === 0) return [];
    const sourceDir = this.getSessionFilesDir(sessionId);
    const targetDir = path.join(this.bookingsDir, bookingId);
    await fs.mkdir(targetDir, { recursive: true });

    const moved: BookingAttachment[] = [];
    for (const attachment of draftAttachments) {
      const sourcePath = path.join(sourceDir, `${attachment.id}__${this.sanitizeFilename(attachment.filename)}`);
      const targetPath = this.buildAttachmentStoragePath(
        bookingId,
        attachment.id,
        attachment.filename
      );
      try {
        await fs.rename(sourcePath, targetPath);
      } catch {
        // If file is missing we skip it; note remains with available attachments.
        continue;
      }
      moved.push({
        ...attachment,
        url: this.buildAttachmentUrl(bookingId, attachment.id),
      });
    }
    return moved;
  }

  private async findOpenSessions(patientId: string) {
    const manifests = await this.readAllSessionManifests();
    const now = Date.now();
    return manifests.filter(
      (entry) =>
        entry.patientId === patientId &&
        !entry.boundBookingId &&
        new Date(entry.expiresAt).getTime() > now
    );
  }

  private async cleanupExpiredSessions() {
    const manifests = await this.readAllSessionManifests();
    const now = Date.now();

    for (const manifest of manifests) {
      const expired = new Date(manifest.expiresAt).getTime() <= now;
      if (!expired || manifest.boundBookingId) continue;
      await fs.rm(this.getSessionFilesDir(manifest.id), { recursive: true, force: true });
      await fs.rm(this.getSessionManifestPath(manifest.id), { force: true });
    }
  }

  private ensureFileCount(files: UploadedMediaFile[]) {
    if (files.length > MAX_FILES_PER_NOTE) {
      throw new BadRequestException(`Maximum ${MAX_FILES_PER_NOTE} files are allowed per upload`);
    }
  }

  private resolveKind(mimeType: string): BookingAttachment["kind"] {
    if (mimeType.startsWith("image/")) {
      return "IMAGE";
    }
    if (mimeType.startsWith("video/")) {
      return "VIDEO";
    }
    if (mimeType.startsWith("audio/")) {
      return "AUDIO";
    }
    throw new BadRequestException(`Unsupported file type: ${mimeType}`);
  }

  private validateFileSize(kind: BookingAttachment["kind"], bytes: number) {
    const limits: Record<BookingAttachment["kind"], number> = {
      IMAGE: 10 * 1024 * 1024,
      VIDEO: 50 * 1024 * 1024,
      AUDIO: 20 * 1024 * 1024,
    };
    if (bytes > limits[kind]) {
      throw new BadRequestException(`${kind} file exceeds the allowed size limit`);
    }
  }

  private sanitizeFilename(filename: string) {
    return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  }

  private getSessionManifestPath(sessionId: string) {
    return path.join(this.sessionsDir, `${sessionId}.json`);
  }

  private getSessionFilesDir(sessionId: string) {
    return path.join(this.sessionsDir, sessionId);
  }

  private async writeSessionManifest(manifest: UploadSessionManifest) {
    await fs.writeFile(this.getSessionManifestPath(manifest.id), JSON.stringify(manifest, null, 2), "utf-8");
  }

  private async readOwnedSession(sessionId: string, patientId: string) {
    const manifest = await this.readSessionManifest(sessionId);
    if (manifest.patientId !== patientId) {
      throw new NotFoundException("Upload session not found");
    }
    return manifest;
  }

  private ensureSessionWritable(manifest: UploadSessionManifest) {
    if (manifest.boundBookingId) {
      throw new BadRequestException("Upload session is already finalized");
    }
    if (new Date(manifest.expiresAt).getTime() <= Date.now()) {
      throw new BadRequestException("Upload session expired");
    }
  }

  private async readSessionManifest(sessionId: string): Promise<UploadSessionManifest> {
    try {
      const content = await fs.readFile(this.getSessionManifestPath(sessionId), "utf-8");
      return JSON.parse(content) as UploadSessionManifest;
    } catch {
      throw new NotFoundException("Upload session not found");
    }
  }

  private async readAllSessionManifests(): Promise<UploadSessionManifest[]> {
    const entries = await fs.readdir(this.sessionsDir, { withFileTypes: true });
    const manifests = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map(async (entry) => {
          const content = await fs.readFile(path.join(this.sessionsDir, entry.name), "utf-8");
          return JSON.parse(content) as UploadSessionManifest;
        })
    );
    return manifests;
  }
}
