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

export type DriverFormState = {
  fullName: string;
  phoneNumber: string;
  email: string;
  passwordHash: string;
};

export function DriverFormDialog({
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
  form: DriverFormState;
  providerAvailable: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (field: keyof DriverFormState, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Driver" : "Add Driver"}</DialogTitle>
          <DialogDescription>Provider cannot be changed.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-6">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input value={form.fullName} onChange={(e) => onChange("fullName", e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Phone Number</label>
            <Input value={form.phoneNumber} onChange={(e) => onChange("phoneNumber", e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Email</label>
            <Input value={form.email} onChange={(e) => onChange("email", e.target.value)} />
          </div>
          {!editing && (
            <div className="grid gap-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={form.passwordHash}
                onChange={(e) => onChange("passwordHash", e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              !form.fullName.trim() ||
              !form.phoneNumber.trim() ||
              (!editing && !form.passwordHash.trim()) ||
              (!editing && !providerAvailable)
            }
          >
            {editing ? "Save Changes" : "Create Driver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
