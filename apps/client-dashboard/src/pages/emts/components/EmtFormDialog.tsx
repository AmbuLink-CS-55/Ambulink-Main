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

export type EmtFormState = {
  fullName: string;
  phoneNumber: string;
  email: string;
  passwordHash: string;
};

type EmtFormFieldsProps = {
  form: EmtFormState;
  onChange: <K extends keyof EmtFormState>(field: K, value: EmtFormState[K]) => void;
  showPassword: boolean;
};

function EmtFormFields({ form, onChange, showPassword }: EmtFormFieldsProps) {
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
            value={form.passwordHash}
            onChange={(e) => onChange("passwordHash", e.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}

type BaseEmtDialogProps = {
  open: boolean;
  form: EmtFormState;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof EmtFormState>(field: K, value: EmtFormState[K]) => void;
  title: string;
  submitLabel: string;
  showPassword: boolean;
  submitDisabled: boolean;
  onSubmit: () => void;
};

function BaseEmtFormDialog({
  open,
  form,
  onOpenChange,
  onChange,
  title,
  submitLabel,
  showPassword,
  submitDisabled,
  onSubmit,
}: BaseEmtDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Provider cannot be changed.</DialogDescription>
        </DialogHeader>

        <EmtFormFields form={form} onChange={onChange} showPassword={showPassword} />

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

export function CreateEmtDialog({
  open,
  form,
  providerAvailable,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: EmtFormState;
  providerAvailable: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof EmtFormState>(field: K, value: EmtFormState[K]) => void;
  onSubmit: () => void;
}) {
  const submitDisabled =
    !form.fullName.trim() ||
    !form.phoneNumber.trim() ||
    !form.passwordHash.trim() ||
    !providerAvailable;

  return (
    <BaseEmtFormDialog
      open={open}
      form={form}
      onOpenChange={onOpenChange}
      onChange={onChange}
      title="Add EMT"
      submitLabel="Create EMT"
      showPassword={true}
      submitDisabled={submitDisabled}
      onSubmit={onSubmit}
    />
  );
}

export function EditEmtDialog({
  open,
  form,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: EmtFormState;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof EmtFormState>(field: K, value: EmtFormState[K]) => void;
  onSubmit: () => void;
}) {
  const submitDisabled = !form.fullName.trim() || !form.phoneNumber.trim();

  return (
    <BaseEmtFormDialog
      open={open}
      form={form}
      onOpenChange={onOpenChange}
      onChange={onChange}
      title="Edit EMT"
      submitLabel="Save Changes"
      showPassword={false}
      submitDisabled={submitDisabled}
      onSubmit={onSubmit}
    />
  );
}
