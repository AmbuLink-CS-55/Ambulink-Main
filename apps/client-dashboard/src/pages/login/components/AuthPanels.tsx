import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SignupValidation, LoginFormState, SignupFormState } from "@/pages/login/login-utils";

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1 block text-sm font-medium text-[color:var(--form-label)]">{children}</label>;
}

export function InviteActivationPanel({
  assignedEmail,
  password,
  confirmPassword,
  pending,
  previewLoading,
  inviteValid,
  onPasswordChange,
  onConfirmPasswordChange,
  onActivate,
}: {
  assignedEmail: string;
  password: string;
  confirmPassword: string;
  pending: boolean;
  previewLoading: boolean;
  inviteValid: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onActivate: () => void;
}) {
  return (
    <div className="mb-6 space-y-3 rounded-md border border-[color:var(--border)] bg-muted/20 p-3">
      <p className="text-sm font-medium text-foreground">Dispatcher Invite Link</p>
      <p className="text-xs text-muted-foreground">
        Create your dispatcher account password to activate this invite.
      </p>
      <p className="text-xs text-muted-foreground">Assigned email: {assignedEmail}</p>
      <div>
        <FieldLabel>Password</FieldLabel>
        <Input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
        />
      </div>
      <div>
        <FieldLabel>Confirm password</FieldLabel>
        <Input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
        />
      </div>
      <Button
        className="w-full"
        onClick={onActivate}
        disabled={pending || previewLoading || !inviteValid || password.length < 8 || password !== confirmPassword}
      >
        {pending ? "Activating..." : "Activate Invite"}
      </Button>
    </div>
  );
}

export function AuthTabSwitch({
  tab,
  setTab,
}: {
  tab: "login" | "signup";
  setTab: (tab: "login" | "signup") => void;
}) {
  return (
    <div className="mb-6 flex gap-2">
      <Button
        type="button"
        variant={tab === "login" ? "default" : "outline"}
        className="flex-1"
        onClick={() => setTab("login")}
      >
        Login
      </Button>
      <Button
        type="button"
        variant={tab === "signup" ? "default" : "outline"}
        className="flex-1"
        onClick={() => setTab("signup")}
      >
        Signup
      </Button>
    </div>
  );
}

export function LoginPanel({
  form,
  pending,
  onChange,
  onSubmit,
}: {
  form: LoginFormState;
  pending: boolean;
  onChange: (field: keyof LoginFormState, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Email</FieldLabel>
        <Input
          type="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={(event) => onChange("email", event.target.value)}
        />
      </div>
      <div>
        <FieldLabel>Password</FieldLabel>
        <Input
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={(event) => onChange("password", event.target.value)}
        />
      </div>
      <Button className="w-full" onClick={onSubmit} disabled={pending || !form.email.trim() || !form.password}>
        {pending ? "Signing in..." : "Sign In"}
      </Button>
    </div>
  );
}

export function SignupPanel({
  form,
  validation,
  pending,
  onChange,
  onSubmit,
}: {
  form: SignupFormState;
  validation: SignupValidation;
  pending: boolean;
  onChange: <K extends keyof SignupFormState>(field: K, value: SignupFormState[K]) => void;
  onSubmit: () => void;
}) {
  const isSignupDisabled = pending || validation.issues.length > 0;

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Full name</FieldLabel>
        <Input
          placeholder="Enter your name"
          className={!validation.hasFullName ? "border-[color:var(--destructive)]" : undefined}
          value={form.fullName}
          onChange={(event) => onChange("fullName", event.target.value)}
        />
      </div>
      <div>
        <FieldLabel>Phone number</FieldLabel>
        <Input
          placeholder="Enter your phone number"
          className={!validation.hasPhoneNumber ? "border-[color:var(--destructive)]" : undefined}
          value={form.phoneNumber}
          onChange={(event) => onChange("phoneNumber", event.target.value)}
        />
      </div>
      <div>
        <FieldLabel>Email</FieldLabel>
        <Input
          type="email"
          placeholder="Enter your email"
          className={!validation.hasEmail || !validation.hasValidEmailFormat ? "border-[color:var(--destructive)]" : undefined}
          value={form.email}
          onChange={(event) => onChange("email", event.target.value)}
        />
      </div>
      <div>
        <FieldLabel>Password</FieldLabel>
        <Input
          type="password"
          placeholder="Minimum 8 characters"
          className={!validation.hasPasswordLength ? "border-[color:var(--destructive)]" : undefined}
          value={form.password}
          onChange={(event) => onChange("password", event.target.value)}
        />
      </div>
      <div>
        <FieldLabel>Organization name</FieldLabel>
        <Input
          placeholder="e.g. CityCare Ambulance Services"
          className={!validation.hasProviderName ? "border-[color:var(--destructive)]" : undefined}
          value={form.providerName}
          onChange={(event) => onChange("providerName", event.target.value)}
        />
      </div>
      <div>
        <FieldLabel>Provider type</FieldLabel>
        <Select
          value={form.providerType}
          onChange={(event) => onChange("providerType", event.target.value === "PUBLIC" ? "PUBLIC" : "PRIVATE")}
          options={[
            { label: "Private", value: "PRIVATE" },
            { label: "Public", value: "PUBLIC" },
          ]}
        />
      </div>
      <div>
        <FieldLabel>Organization hotline (optional)</FieldLabel>
        <Input
          placeholder="e.g. +94 11 234 5678"
          className={!validation.hasValidHotline ? "border-[color:var(--destructive)]" : undefined}
          value={form.hotlineNumber}
          onChange={(event) => onChange("hotlineNumber", event.target.value)}
        />
      </div>
      <div>
        <FieldLabel>Organization address (optional)</FieldLabel>
        <Input
          placeholder="Street, city"
          className={!validation.hasValidAddress ? "border-[color:var(--destructive)]" : undefined}
          value={form.address}
          onChange={(event) => onChange("address", event.target.value)}
        />
      </div>
      <div>
        <FieldLabel>Initial price (optional)</FieldLabel>
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="0.00"
          className={!validation.hasValidInitialPrice ? "border-[color:var(--destructive)]" : undefined}
          value={form.initialPrice}
          onChange={(event) => onChange("initialPrice", event.target.value)}
        />
      </div>
      <div>
        <FieldLabel>Price per km (optional)</FieldLabel>
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="0.00"
          className={!validation.hasValidPricePerKm ? "border-[color:var(--destructive)]" : undefined}
          value={form.pricePerKm}
          onChange={(event) => onChange("pricePerKm", event.target.value)}
        />
      </div>
      {validation.issues.length > 0 ? (
        <div className="rounded-md border border-[color:var(--destructive)]/40 bg-[color:var(--destructive)]/10 p-3">
          <p className="mb-1 text-sm font-medium text-[color:var(--destructive)]">Complete these fields:</p>
          <ul className="list-disc pl-5 text-xs text-[color:var(--destructive)]">
            {validation.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <Button className="w-full" onClick={onSubmit} disabled={isSignupDisabled}>
        {pending ? "Creating account..." : "Create Organization & Admin Account"}
      </Button>
    </div>
  );
}
