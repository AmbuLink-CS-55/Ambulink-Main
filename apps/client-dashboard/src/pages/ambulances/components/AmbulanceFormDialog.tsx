import { useId } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AmbulanceStatus } from "@/lib/types";

const STATUS_OPTIONS = [
  { label: "Available", value: "AVAILABLE" },
  { label: "Busy", value: "BUSY" },
  { label: "Offline", value: "OFFLINE" },
] as const;

export type AmbulanceFormState = {
  vehicleNumber: string;
  equipmentLevel: string;
  status: AmbulanceStatus;
};

type BaseAmbulanceDialogProps = {
  open: boolean;
  form: AmbulanceFormState;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof AmbulanceFormState>(field: K, value: AmbulanceFormState[K]) => void;
  title: string;
  submitLabel: string;
  submitDisabled: boolean;
  validationMessage?: string | null;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onSubmit: () => void;
};

function BaseAmbulanceFormDialog({
  open,
  form,
  onOpenChange,
  onChange,
  title,
  submitLabel,
  submitDisabled,
  validationMessage,
  errorMessage,
  isSubmitting = false,
  onSubmit,
}: BaseAmbulanceDialogProps) {
  const vehicleNumberId = useId();
  const equipmentLevelId = useId();
  const statusId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Provider cannot be changed.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-6">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={vehicleNumberId}>
              Vehicle Number
            </label>
            <Input
              id={vehicleNumberId}
              name="vehicleNumber"
              value={form.vehicleNumber}
              onChange={(e) => onChange("vehicleNumber", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={equipmentLevelId}>
              Equipment Level
            </label>
            <Input
              id={equipmentLevelId}
              name="equipmentLevel"
              value={form.equipmentLevel}
              onChange={(e) => onChange("equipmentLevel", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={statusId}>
              Status
            </label>
            <Select
              id={statusId}
              name="status"
              value={form.status}
              onChange={(e) => onChange("status", e.target.value as AmbulanceStatus)}
              options={[...STATUS_OPTIONS]}
            />
          </div>
        </div>

        <DialogFooter>
          {errorMessage ? (
            <p className="w-full text-xs text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : validationMessage ? (
            <p className="w-full text-xs text-muted-foreground">{validationMessage}</p>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitDisabled || isSubmitting}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreateAmbulanceDialog({
  open,
  form,
  providerAvailable,
  errorMessage,
  isSubmitting,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: AmbulanceFormState;
  providerAvailable: boolean;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof AmbulanceFormState>(field: K, value: AmbulanceFormState[K]) => void;
  onSubmit: () => void;
}) {
  const validationMessage = !form.vehicleNumber.trim()
    ? "Vehicle number is required."
    : !providerAvailable
      ? "Provider is not available for this action."
      : null;
  return (
    <BaseAmbulanceFormDialog
      open={open}
      form={form}
      onOpenChange={onOpenChange}
      onChange={onChange}
      title="Add Ambulance"
      submitLabel="Create Ambulance"
      submitDisabled={!form.vehicleNumber.trim() || !providerAvailable}
      validationMessage={validationMessage}
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    />
  );
}

export function EditAmbulanceDialog({
  open,
  form,
  errorMessage,
  isSubmitting,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: AmbulanceFormState;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof AmbulanceFormState>(field: K, value: AmbulanceFormState[K]) => void;
  onSubmit: () => void;
}) {
  const validationMessage = !form.vehicleNumber.trim() ? "Vehicle number is required." : null;
  return (
    <BaseAmbulanceFormDialog
      open={open}
      form={form}
      onOpenChange={onOpenChange}
      onChange={onChange}
      title="Edit Ambulance"
      submitLabel="Save Changes"
      submitDisabled={!form.vehicleNumber.trim()}
      validationMessage={validationMessage}
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    />
  );
}
