import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import type { AmbulanceProvider } from "@/lib/types";
import { useLoginDispatcher, useSignupDispatcher } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { toUiErrorMessage } from "@/lib/ui-error";

type AuthTab = "login" | "signup";

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1 block text-sm font-medium text-[color:var(--form-label)]">{children}</label>;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const [tab, setTab] = useState<AuthTab>("login");
  const [error, setError] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupFullName, setSignupFullName] = useState("");
  const [signupPhoneNumber, setSignupPhoneNumber] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupProviderId, setSignupProviderId] = useState("");
  const [signupInviteToken, setSignupInviteToken] = useState("");

  const providers = useQuery({
    queryKey: ["ambulance-providers", "public"],
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data } = await api.get<AmbulanceProvider[]>("/ambulance-providers");
      return data.filter((provider) => provider.isActive);
    },
  });

  const loginDispatcher = useLoginDispatcher();
  const signupDispatcher = useSignupDispatcher();

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

  const submitSignup = async () => {
    setError(null);
    try {
      const session = await signupDispatcher.mutateAsync({
        fullName: signupFullName.trim(),
        phoneNumber: signupPhoneNumber.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        providerId: signupInviteToken.trim() ? undefined : signupProviderId || undefined,
        inviteToken: signupInviteToken.trim() || undefined,
      });
      setSession(session);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("[auth] signup failed", err);
      setError(toUiErrorMessage(err, "Signup failed. Please review the form and try again."));
    }
  };

  const providerOptions = (providers.data ?? []).map((provider) => ({
    label: provider.name,
    value: provider.id,
  }));

  const hasInviteToken = signupInviteToken.trim().length > 0;
  const hasFullName = signupFullName.trim().length > 0;
  const hasPhoneNumber = signupPhoneNumber.trim().length > 0;
  const hasEmail = signupEmail.trim().length > 0;
  const hasPasswordLength = signupPassword.length >= 8;
  const hasProviderSelection = signupProviderId.length > 0;
  const hasValidEmailFormat = !hasEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail.trim());

  const signupIssues: string[] = [];
  if (!hasFullName) signupIssues.push("Full name is required.");
  if (!hasPhoneNumber) signupIssues.push("Phone number is required.");
  if (!hasEmail) signupIssues.push("Email is required.");
  if (hasEmail && !hasValidEmailFormat) signupIssues.push("Email format is invalid.");
  if (!hasPasswordLength) signupIssues.push("Password must be at least 8 characters.");
  if (!hasInviteToken && !hasProviderSelection) {
    signupIssues.push("Select a provider or enter an invite token.");
  }

  const isSignupDisabled = signupDispatcher.isPending || signupIssues.length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-lg border bg-card p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">Dispatch.Ambulink</h1>
          <p className="mt-2 text-muted-foreground">Dispatcher authentication</p>
        </div>

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
              <FieldLabel>Invite token (optional)</FieldLabel>
              <Input
                placeholder="Paste invite token if you have one"
                value={signupInviteToken}
                onChange={(event) => setSignupInviteToken(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Select provider</FieldLabel>
              <Select
                value={signupProviderId}
                onChange={(event) => setSignupProviderId(event.target.value)}
                options={providerOptions}
                placeholder={providers.isLoading ? "Loading providers..." : "Select provider"}
                disabled={Boolean(signupInviteToken.trim())}
                className={!hasInviteToken && !hasProviderSelection ? "border-[color:var(--destructive)]" : undefined}
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
              {signupDispatcher.isPending ? "Creating account..." : "Create Dispatcher Account"}
            </Button>
          </div>
        )}

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
