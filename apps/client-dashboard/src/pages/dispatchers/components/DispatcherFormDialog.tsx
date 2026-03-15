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

export type DispatcherFormState = {
  fullName: string;
  phoneNumber: string;
  email: string;
  passwordHash: string;
};

type DispatcherFormFieldsProps = {
  form: DispatcherFormState;
  onChange: <K extends keyof DispatcherFormState>(field: K, value: DispatcherFormState[K]) => void;
  showPassword: boolean;
};

function DispatcherFormFields({ form, onChange, showPassword }: DispatcherFormFieldsProps) {
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
          placeholder="Enter dispatcher email"
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

type BaseDispatcherDialogProps = {
  open: boolean;
  form: DispatcherFormState;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof DispatcherFormState>(field: K, value: DispatcherFormState[K]) => void;
  title: string;
  submitLabel: string;
  showPassword: boolean;
  submitDisabled: boolean;
  onSubmit: () => void;
};

function BaseDispatcherFormDialog({
  open,
  form,
  onOpenChange,
  onChange,
  title,
  submitLabel,
  showPassword,
  submitDisabled,
  onSubmit,
}: BaseDispatcherDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Provider cannot be changed.</DialogDescription>
        </DialogHeader>

        <DispatcherFormFields form={form} onChange={onChange} showPassword={showPassword} />

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

export function CreateDispatcherDialog({
  open,
  form,
  providerAvailable,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: DispatcherFormState;
  providerAvailable: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof DispatcherFormState>(field: K, value: DispatcherFormState[K]) => void;
  onSubmit: () => void;
}) {
  const submitDisabled =
    !form.fullName.trim() ||
    !form.phoneNumber.trim() ||
    !form.email.trim() ||
    form.passwordHash.trim().length < 8 ||
    !providerAvailable;

  return (
    <BaseDispatcherFormDialog
      open={open}
      form={form}
      onOpenChange={onOpenChange}
      onChange={onChange}
      title="Add Dispatcher"
      submitLabel="Create Dispatcher"
      showPassword={true}
      submitDisabled={submitDisabled}
      onSubmit={onSubmit}
    />
  );
}

export function EditDispatcherDialog({
  open,
  form,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: DispatcherFormState;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof DispatcherFormState>(field: K, value: DispatcherFormState[K]) => void;
  onSubmit: () => void;
}) {
  const submitDisabled = !form.fullName.trim() || !form.phoneNumber.trim() || !form.email.trim();

  return (
    <BaseDispatcherFormDialog
      open={open}
      form={form}
      onOpenChange={onOpenChange}
      onChange={onChange}
      title="Edit Dispatcher"
      submitLabel="Save Changes"
      showPassword={false}
      submitDisabled={submitDisabled}
      onSubmit={onSubmit}
    />
  );
}
