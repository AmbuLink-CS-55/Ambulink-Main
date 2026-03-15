import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  useActivateStaffInvite,
  useBootstrapDispatcherSignup,
  useLoginDispatcher,
  usePreviewStaffInvite,
} from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { toUiErrorMessage } from "@/lib/ui-error";

type AuthTab = "login" | "signup";

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1 block text-sm font-medium text-[color:var(--form-label)]">{children}</label>;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);

  const [tab, setTab] = useState<AuthTab>("login");
  const [error, setError] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteConfirmPassword, setInviteConfirmPassword] = useState("");

  const [signupFullName, setSignupFullName] = useState("");
  const [signupPhoneNumber, setSignupPhoneNumber] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupProviderName, setSignupProviderName] = useState("");
  const [signupProviderType, setSignupProviderType] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [signupHotlineNumber, setSignupHotlineNumber] = useState("");
  const [signupAddress, setSignupAddress] = useState("");
  const [signupInitialPrice, setSignupInitialPrice] = useState("");
  const [signupPricePerKm, setSignupPricePerKm] = useState("");
  const inviteTokenFromUrl = useMemo(
    () => searchParams.get("inviteToken")?.trim() ?? "",
    [searchParams]
  );

  const loginDispatcher = useLoginDispatcher();
  const previewInvite = usePreviewStaffInvite(inviteTokenFromUrl, Boolean(inviteTokenFromUrl));
  const activateInvite = useActivateStaffInvite();
  const bootstrapSignup = useBootstrapDispatcherSignup();
  const submitLogin = async () => {
    setError(null);
    try {
      const session = await loginDispatcher.mutateAsync({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      setSession(session);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("[auth] login failed", err);
      setError(toUiErrorMessage(err, "Login failed. Check your credentials and try again."));
    }
  };

  const submitInviteActivate = async () => {
    if (!inviteTokenFromUrl) {
      setError("Invite link is missing token.");
      return;
    }
    setError(null);
    try {
      const session = await activateInvite.mutateAsync({
        inviteToken: inviteTokenFromUrl,
        password: invitePassword,
        confirmPassword: inviteConfirmPassword,
      });
      setSession(session);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("[auth] invite activate failed", err);
      setError(toUiErrorMessage(err, "Invite activation failed. Please try again."));
    }
  };

  const submitSignup = async () => {
    setError(null);
    try {
      const parsedInitialPrice = signupInitialPrice.trim() ? Number(signupInitialPrice) : undefined;
      const parsedPricePerKm = signupPricePerKm.trim() ? Number(signupPricePerKm) : undefined;
      const session = await bootstrapSignup.mutateAsync({
        fullName: signupFullName.trim(),
        phoneNumber: signupPhoneNumber.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        providerName: signupProviderName.trim(),
        providerType: signupProviderType,
        hotlineNumber: signupHotlineNumber.trim() || undefined,
        address: signupAddress.trim() || undefined,
        initialPrice: parsedInitialPrice,
        pricePerKm: parsedPricePerKm,
      });
      setSession(session);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("[auth] signup failed", err);
      setError(toUiErrorMessage(err, "Signup failed. Please review the form and try again."));
    }
  };
  const hasFullName = signupFullName.trim().length > 0;
  const hasPhoneNumber = signupPhoneNumber.trim().length > 0;
  const hasEmail = signupEmail.trim().length > 0;
  const hasPasswordLength = signupPassword.length >= 8;
  const hasProviderName = signupProviderName.trim().length > 0;
  const hasValidEmailFormat = !hasEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail.trim());
  const hasValidInitialPrice =
    !signupInitialPrice.trim() || (!Number.isNaN(Number(signupInitialPrice)) && Number(signupInitialPrice) >= 0);
  const hasValidPricePerKm =
    !signupPricePerKm.trim() || (!Number.isNaN(Number(signupPricePerKm)) && Number(signupPricePerKm) >= 0);

  const signupIssues: string[] = [];
  if (!hasFullName) signupIssues.push("Full name is required.");
  if (!hasPhoneNumber) signupIssues.push("Phone number is required.");
  if (!hasEmail) signupIssues.push("Email is required.");
  if (hasEmail && !hasValidEmailFormat) signupIssues.push("Email format is invalid.");
  if (!hasPasswordLength) signupIssues.push("Password must be at least 8 characters.");
  if (!hasProviderName) signupIssues.push("Organization name is required.");
  if (!hasValidInitialPrice) signupIssues.push("Initial price must be a non-negative number.");
  if (!hasValidPricePerKm) signupIssues.push("Price per km must be a non-negative number.");

  const isSignupDisabled = bootstrapSignup.isPending || signupIssues.length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-lg border bg-card p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">Dispatch.Ambulink</h1>
          <p className="mt-2 text-muted-foreground">Dispatcher authentication</p>
        </div>

        {inviteTokenFromUrl ? (
          <div className="mb-6 space-y-3 rounded-md border border-[color:var(--border)] bg-muted/20 p-3">
            <p className="text-sm font-medium text-foreground">Dispatcher Invite Link</p>
            <p className="text-xs text-muted-foreground">
              Create your dispatcher account password to activate this invite.
            </p>
            <p className="text-xs text-muted-foreground">
              Assigned email: {previewInvite.data?.invitedEmail ?? "Loading..."}
            </p>
            <div>
              <FieldLabel>Password</FieldLabel>
              <Input
                type="password"
                placeholder="Enter password"
                value={invitePassword}
                onChange={(event) => setInvitePassword(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Confirm password</FieldLabel>
              <Input
                type="password"
                placeholder="Confirm password"
                value={inviteConfirmPassword}
                onChange={(event) => setInviteConfirmPassword(event.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => void submitInviteActivate()}
              disabled={
                activateInvite.isPending ||
                previewInvite.isLoading ||
                !previewInvite.data?.valid ||
                invitePassword.length < 8 ||
                invitePassword !== inviteConfirmPassword
              }
            >
              {activateInvite.isPending ? "Activating..." : "Activate Invite"}
            </Button>
          </div>
        ) : null}

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

        {tab === "login" ? (
          <div className="space-y-3">
            <div>
              <FieldLabel>Email</FieldLabel>
              <Input
                type="email"
                placeholder="Enter your email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Password</FieldLabel>
              <Input
                type="password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => void submitLogin()}
              disabled={loginDispatcher.isPending || !loginEmail.trim() || !loginPassword}
            >
              {loginDispatcher.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <FieldLabel>Full name</FieldLabel>
              <Input
                placeholder="Enter your name"
                className={!hasFullName ? "border-[color:var(--destructive)]" : undefined}
                value={signupFullName}
                onChange={(event) => setSignupFullName(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Phone number</FieldLabel>
              <Input
                placeholder="Enter your phone number"
                className={!hasPhoneNumber ? "border-[color:var(--destructive)]" : undefined}
                value={signupPhoneNumber}
                onChange={(event) => setSignupPhoneNumber(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <Input
                type="email"
                placeholder="Enter your email"
                className={!hasEmail || !hasValidEmailFormat ? "border-[color:var(--destructive)]" : undefined}
                value={signupEmail}
                onChange={(event) => setSignupEmail(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Password</FieldLabel>
              <Input
                type="password"
                placeholder="Minimum 8 characters"
                className={!hasPasswordLength ? "border-[color:var(--destructive)]" : undefined}
                value={signupPassword}
                onChange={(event) => setSignupPassword(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Organization name</FieldLabel>
              <Input
                placeholder="e.g. CityCare Ambulance Services"
                className={!hasProviderName ? "border-[color:var(--destructive)]" : undefined}
                value={signupProviderName}
                onChange={(event) => setSignupProviderName(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Provider type</FieldLabel>
              <Select
                value={signupProviderType}
                onChange={(event) =>
                  setSignupProviderType(event.target.value === "PUBLIC" ? "PUBLIC" : "PRIVATE")
                }
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
                value={signupHotlineNumber}
                onChange={(event) => setSignupHotlineNumber(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Organization address (optional)</FieldLabel>
              <Input
                placeholder="Street, city"
                value={signupAddress}
                onChange={(event) => setSignupAddress(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Initial price (optional)</FieldLabel>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                className={!hasValidInitialPrice ? "border-[color:var(--destructive)]" : undefined}
                value={signupInitialPrice}
                onChange={(event) => setSignupInitialPrice(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Price per km (optional)</FieldLabel>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                className={!hasValidPricePerKm ? "border-[color:var(--destructive)]" : undefined}
                value={signupPricePerKm}
                onChange={(event) => setSignupPricePerKm(event.target.value)}
              />
            </div>
            {signupIssues.length > 0 ? (
              <div className="rounded-md border border-[color:var(--destructive)]/40 bg-[color:var(--destructive)]/10 p-3">
                <p className="mb-1 text-sm font-medium text-[color:var(--destructive)]">
                  Complete these fields:
                </p>
                <ul className="list-disc pl-5 text-xs text-[color:var(--destructive)]">
                  {signupIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Button
              className="w-full"
              onClick={() => void submitSignup()}
              disabled={isSignupDisabled}
            >
              {bootstrapSignup.isPending ? "Creating account..." : "Create Organization & Admin Account"}
            </Button>
          </div>
        )}

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
