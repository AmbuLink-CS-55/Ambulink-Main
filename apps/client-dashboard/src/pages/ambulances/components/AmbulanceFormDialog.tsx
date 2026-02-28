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
  onSubmit,
}: BaseAmbulanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Provider cannot be changed.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-6">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Vehicle Number</label>
            <Input
              value={form.vehicleNumber}
              onChange={(e) => onChange("vehicleNumber", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Equipment Level</label>
            <Input
              value={form.equipmentLevel}
              onChange={(e) => onChange("equipmentLevel", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={form.status}
              onChange={(e) => onChange("status", e.target.value as AmbulanceStatus)}
              options={[...STATUS_OPTIONS]}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitDisabled}>
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
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: AmbulanceFormState;
  providerAvailable: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof AmbulanceFormState>(field: K, value: AmbulanceFormState[K]) => void;
  onSubmit: () => void;
}) {
  return (
    <BaseAmbulanceFormDialog
      open={open}
      form={form}
      onOpenChange={onOpenChange}
      onChange={onChange}
      title="Add Ambulance"
      submitLabel="Create Ambulance"
      submitDisabled={!form.vehicleNumber.trim() || !providerAvailable}
      onSubmit={onSubmit}
    />
  );
}

export function EditAmbulanceDialog({
  open,
  form,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: AmbulanceFormState;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof AmbulanceFormState>(field: K, value: AmbulanceFormState[K]) => void;
  onSubmit: () => void;
}) {
  return (
    <BaseAmbulanceFormDialog
      open={open}
      form={form}
      onOpenChange={onOpenChange}
      onChange={onChange}
      title="Edit Ambulance"
      submitLabel="Save Changes"
      submitDisabled={!form.vehicleNumber.trim()}
      onSubmit={onSubmit}
    />
  );
}
