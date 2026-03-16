import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MediaAttachmentInput, MediaSubmitAdapter } from "@/common/lib/mediaNote";

type RoleCopy = {
  mediaPermissionTitle?: string;
  mediaPermissionMessage?: string;
  cameraPermissionTitle?: string;
  cameraPermissionMessage?: string;
  micPermissionTitle?: string;
  micPermissionMessage?: string;
};

type Options = {
  submit: MediaSubmitAdapter;
  maxFiles?: number;
  roleCopy?: RoleCopy;
};

const DEFAULT_MAX_FILES = 5;

const mapAssetToFile = (asset: ImagePicker.ImagePickerAsset): MediaAttachmentInput => ({
  uri: asset.uri,
  name: asset.fileName ?? `media-${Date.now()}`,
  type: asset.mimeType ?? (asset.type === "video" ? "video/mp4" : "image/jpeg"),
});

const getAudioDuration = async (recording: Audio.Recording) => {
  try {
    const status = await recording.getStatusAsync();
    if ("durationMillis" in status) {
      return status.durationMillis ?? undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

export function useMediaNoteComposer({ submit, maxFiles = DEFAULT_MAX_FILES }: Options) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<MediaAttachmentInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [mediaProcessingCount, setMediaProcessingCount] = useState(0);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);

  const recordingRef = useRef<Audio.Recording | null>(null);

  const canSubmit = useMemo(
    () => !isSubmitting && (text.trim().length > 0 || files.length > 0),
    [files.length, isSubmitting, text]
  );

  const appendFiles = useCallback(
    (newFiles: MediaAttachmentInput[]) => {
      if (newFiles.length === 0) return;
      setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));
    },
    [maxFiles]
  );

  const pickMedia = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    setMediaProcessingCount((count) => count + 1);
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        videoMaxDuration: 120,
      });

      if (picked.canceled) return;
      appendFiles(picked.assets.map(mapAssetToFile));
    } finally {
      setMediaProcessingCount((count) => Math.max(0, count - 1));
    }
  }, [appendFiles]);

  const captureMedia = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    setMediaProcessingCount((count) => count + 1);
    try {
      const captured = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        videoMaxDuration: 120,
      });

      if (captured.canceled) return;
      appendFiles(captured.assets.map(mapAssetToFile));
    } finally {
      setMediaProcessingCount((count) => Math.max(0, count - 1));
    }
  }, [appendFiles]);

  const finalizeRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    let durationMs = await getAudioDuration(recording);
    let uri = recording.getURI();

    try {
      const status = await recording.getStatusAsync();
      await recording.stopAndUnloadAsync();
      if ("durationMillis" in status) {
        durationMs = status.durationMillis ?? durationMs;
      }
      uri = recording.getURI() ?? uri;
    } catch {
      // Ignore recorder teardown races.
    } finally {
      recordingRef.current = null;
      setIsRecordingAudio(false);
      setRecordingStartedAt(null);
      setRecordingElapsedMs(0);
    }

    if (!uri) return;

    appendFiles([
      {
        uri,
        name: `audio-${Date.now()}.m4a`,
        type: "audio/mp4",
        durationMs,
      },
    ]);
  }, [appendFiles]);

  const startRecording = useCallback(async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

    const next = new Audio.Recording();
    await next.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await next.startAsync();
    recordingRef.current = next;
    setIsRecordingAudio(true);
    setRecordingStartedAt(Date.now());
    setRecordingElapsedMs(0);
  }, []);

  const toggleRecording = useCallback(async () => {
    if (!isRecordingAudio) {
      await startRecording();
      return;
    }

    // Optimistic UI update so recording indicator disappears immediately on tap.
    setIsRecordingAudio(false);
    setRecordingStartedAt(null);
    setRecordingElapsedMs(0);
    await finalizeRecording();
  }, [finalizeRecording, isRecordingAudio, startRecording]);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  }, []);

  const submitNote = useCallback(async () => {
    if (!canSubmit) return false;

    setSubmitting(true);
    setError(null);

    try {
      const trimmed = text.trim();
      const firstAudio = files.find((file) => (file.type ?? "").startsWith("audio/"));

      await submit({
        content: trimmed.length > 0 ? trimmed : undefined,
        files,
        durationMs: firstAudio?.durationMs,
      });

      setText("");
      setFiles([]);
      return true;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit update");
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, files, submit, text]);

  const dispose = useCallback(async () => {
    await finalizeRecording();
  }, [finalizeRecording]);

  useEffect(() => {
    if (!isRecordingAudio || !recordingStartedAt) return;
    const timer = setInterval(() => {
      setRecordingElapsedMs(Date.now() - recordingStartedAt);
    }, 250);
    return () => clearInterval(timer);
  }, [isRecordingAudio, recordingStartedAt]);

  useEffect(() => {
    return () => {
      void finalizeRecording();
    };
  }, [finalizeRecording]);

  return {
    state: {
      text,
      files,
      error,
      isSubmitting,
      isMediaProcessing: mediaProcessingCount > 0,
      isRecordingAudio,
      recordingElapsedMs,
      canSubmit,
    },
    actions: {
      setText,
      pickMedia,
      captureMedia,
      toggleRecording,
      submit: submitNote,
      removeFile,
      dispose,
    },
  };
}
