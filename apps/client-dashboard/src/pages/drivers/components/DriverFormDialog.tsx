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
};

type DriverFormFieldsProps = {
  form: DriverFormState;
  onChange: <K extends keyof DriverFormState>(field: K, value: DriverFormState[K]) => void;
};

function DriverFormFields({ form, onChange }: DriverFormFieldsProps) {
  const fullNameId = useId();
  const phoneNumberId = useId();
  const emailId = useId();

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
  submitDisabled: boolean;
  validationMessage?: string | null;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onSubmit: () => void;
};

function BaseDriverFormDialog({
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
}: BaseDriverDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Provider cannot be changed.</DialogDescription>
        </DialogHeader>

        <DriverFormFields form={form} onChange={onChange} />

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

export function CreateDriverDialog({
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
  form: DriverFormState;
  providerAvailable: boolean;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof DriverFormState>(field: K, value: DriverFormState[K]) => void;
  onSubmit: () => void;
}) {
  const submitDisabled =
    !form.fullName.trim() ||
    !form.phoneNumber.trim() ||
    !form.email.trim() ||
    !providerAvailable;
  const validationMessage = !form.fullName.trim()
    ? "Full name is required."
    : !form.phoneNumber.trim()
      ? "Phone number is required."
      : !form.email.trim()
        ? "Email is required."
        : !providerAvailable
          ? "Provider is not available for this action."
          : null;

  return (
    <BaseDriverFormDialog
      open={open}
      form={form}
      onOpenChange={onOpenChange}
      onChange={onChange}
      title="Add Driver"
      submitLabel="Create Driver"
      submitDisabled={submitDisabled}
      validationMessage={validationMessage}
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    />
  );
}

export function EditDriverDialog({
  open,
  form,
  errorMessage,
  isSubmitting,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: DriverFormState;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof DriverFormState>(field: K, value: DriverFormState[K]) => void;
  onSubmit: () => void;
}) {
  const submitDisabled = !form.fullName.trim() || !form.phoneNumber.trim();
  const validationMessage = !form.fullName.trim()
    ? "Full name is required."
    : !form.phoneNumber.trim()
      ? "Phone number is required."
      : null;

  return (
    <BaseDriverFormDialog
      open={open}
      form={form}
      onOpenChange={onOpenChange}
      onChange={onChange}
      title="Edit Driver"
      submitLabel="Save Changes"
      submitDisabled={submitDisabled}
      validationMessage={validationMessage}
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    />
  );
}
