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

export type DriverFormState = {
  fullName: string;
  phoneNumber: string;
  email: string;
  passwordHash: string;
};

type DriverFormFieldsProps = {
  form: DriverFormState;
  onChange: <K extends keyof DriverFormState>(field: K, value: DriverFormState[K]) => void;
  showPassword: boolean;
};

function DriverFormFields({ form, onChange, showPassword }: DriverFormFieldsProps) {
  const fullNameId = useId();
  const phoneNumberId = useId();
  const emailId = useId();
  const passwordId = useId();

  return (
    <div className="grid gap-4 px-6">
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor={fullNameId}>
          Full Name
        </label>
        <Input
          id={fullNameId}
          name="fullName"
          autoComplete="name"
          value={form.fullName}
          onChange={(e) => onChange("fullName", e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor={phoneNumberId}>
          Phone Number
        </label>
        <Input
          id={phoneNumberId}
          name="phoneNumber"
          autoComplete="tel"
          value={form.phoneNumber}
          onChange={(e) => onChange("phoneNumber", e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor={emailId}>
          Email
        </label>
        <Input
          id={emailId}
          name="email"
          autoComplete="email"
          type="email"
          placeholder="Enter driver email"
          value={form.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </div>
      {showPassword ? (
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor={passwordId}>
            Password
          </label>
          <Input
            id={passwordId}
            name="password"
            autoComplete="new-password"
            type="password"
            placeholder="Minimum 8 characters"
            value={form.passwordHash}
            onChange={(e) => onChange("passwordHash", e.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}

type BaseDriverDialogProps = {
  open: boolean;
  form: DriverFormState;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof DriverFormState>(field: K, value: DriverFormState[K]) => void;
  title: string;
  submitLabel: string;
  showPassword: boolean;
  submitDisabled: boolean;
  onSubmit: () => void;
};

function BaseDriverFormDialog({
  open,
  form,
  onOpenChange,
  onChange,
  title,
  submitLabel,
  showPassword,
  submitDisabled,
  onSubmit,
}: BaseDriverDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Provider cannot be changed.</DialogDescription>
        </DialogHeader>

        <DriverFormFields form={form} onChange={onChange} showPassword={showPassword} />

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

export function CreateDriverDialog({
  open,
  form,
  providerAvailable,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: DriverFormState;
  providerAvailable: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof DriverFormState>(field: K, value: DriverFormState[K]) => void;
  onSubmit: () => void;
}) {
  const submitDisabled =
    !form.fullName.trim() ||
    !form.phoneNumber.trim() ||
    !form.email.trim() ||
    form.passwordHash.trim().length < 8 ||
    !providerAvailable;

  return (
    <BaseDriverFormDialog
      open={open}
      form={form}
      onOpenChange={onOpenChange}
      onChange={onChange}
      title="Add Driver"
      submitLabel="Create Driver"
      showPassword={true}
      submitDisabled={submitDisabled}
      onSubmit={onSubmit}
    />
  );
}

export function EditDriverDialog({
  open,
  form,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: DriverFormState;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof DriverFormState>(field: K, value: DriverFormState[K]) => void;
  onSubmit: () => void;
}) {
  const submitDisabled = !form.fullName.trim() || !form.phoneNumber.trim();

  return (
    <BaseDriverFormDialog
      open={open}
      form={form}
      onOpenChange={onOpenChange}
      onChange={onChange}
      title="Edit Driver"
      submitLabel="Save Changes"
      showPassword={false}
      submitDisabled={submitDisabled}
      onSubmit={onSubmit}
    />
  );
}
