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

export function AmbulanceFormDialog({
  open,
  editing,
  form,
  providerAvailable,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  editing: boolean;
  form: AmbulanceFormState;
  providerAvailable: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (field: keyof AmbulanceFormState, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Ambulance" : "Add Ambulance"}</DialogTitle>
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
              onChange={(e) => onChange("status", e.target.value)}
              options={[...STATUS_OPTIONS]}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!form.vehicleNumber.trim() || !providerAvailable}>
            {editing ? "Save Changes" : "Create Ambulance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
