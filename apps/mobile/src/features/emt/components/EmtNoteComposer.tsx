import { ChatComposer } from "@/common/components";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCameraPress?: () => void;
  onAudioPress?: () => void;
  isRecordingAudio?: boolean;
  attachmentCount?: number;
  attachmentLabels?: string[];
  recordingStatusText?: string;
  loading?: boolean;
};

export default function EmtNoteComposer({
  value,
  onChange,
  onSubmit,
  onCameraPress,
  onAudioPress,
  isRecordingAudio = false,
  attachmentCount = 0,
  attachmentLabels = [],
  recordingStatusText,
  loading = false,
}: Props) {
  return (
    <ChatComposer
      value={value}
      onChange={onChange}
      onSubmit={onSubmit}
      onCameraPress={onCameraPress}
      onAudioPress={onAudioPress}
      isRecordingAudio={isRecordingAudio}
      loading={loading}
      placeholder="Type a situation update..."
      attachmentLabels={attachmentLabels}
      attachmentSummaryText={
        attachmentLabels.length === 0 && attachmentCount > 0
          ? `${attachmentCount} attachment(s) ready`
          : undefined
      }
      recordingStatusText={recordingStatusText}
    />
  );
}
