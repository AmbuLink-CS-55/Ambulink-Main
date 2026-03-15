import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useActivateStaffInvite,
  useBootstrapDispatcherSignup,
  useLoginDispatcher,
  usePreviewStaffInvite,
} from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { toUiErrorMessage } from "@/lib/ui-error";
import {
  AuthTabSwitch,
  InviteActivationPanel,
  LoginPanel,
  SignupPanel,
} from "@/pages/login/components/AuthPanels";
import {
  initialInviteFormState,
  initialLoginFormState,
  initialSignupFormState,
  type AuthTab,
  type InviteFormState,
  type LoginFormState,
  type SignupFormState,
  validateSignupForm,
} from "@/pages/login/login-utils";

function parseOptionalNumber(value: string) {
  const normalized = value.trim();
  return normalized ? Number(normalized) : undefined;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const inviteTokenFromUrl = searchParams.get("inviteToken")?.trim() ?? "";

  const [tab, setTab] = useState<AuthTab>("login");
  const [error, setError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState<LoginFormState>(initialLoginFormState);
  const [inviteForm, setInviteForm] = useState<InviteFormState>(initialInviteFormState);
  const [signupForm, setSignupForm] = useState<SignupFormState>(initialSignupFormState);

  const loginDispatcher = useLoginDispatcher();
  const previewInvite = usePreviewStaffInvite(inviteTokenFromUrl, Boolean(inviteTokenFromUrl));
  const activateInvite = useActivateStaffInvite();
  const bootstrapSignup = useBootstrapDispatcherSignup();

  const signupValidation = validateSignupForm(signupForm);

  const updateLoginForm = (field: keyof LoginFormState, value: string) => {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
  };
  const updateInviteForm = (field: keyof InviteFormState, value: string) => {
    setInviteForm((prev) => ({ ...prev, [field]: value }));
  };
  const updateSignupForm = <K extends keyof SignupFormState>(field: K, value: SignupFormState[K]) => {
    setSignupForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitLogin = async () => {
    setError(null);
    try {
      const session = await loginDispatcher.mutateAsync({
        email: loginForm.email.trim(),
        password: loginForm.password,
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
        password: inviteForm.password,
        confirmPassword: inviteForm.confirmPassword,
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
      const session = await bootstrapSignup.mutateAsync({
        fullName: signupForm.fullName.trim(),
        phoneNumber: signupForm.phoneNumber.trim(),
        email: signupForm.email.trim(),
        password: signupForm.password,
        providerName: signupForm.providerName.trim(),
        providerType: signupForm.providerType,
        hotlineNumber: signupForm.hotlineNumber.trim() || undefined,
        address: signupForm.address.trim() || undefined,
        initialPrice: parseOptionalNumber(signupForm.initialPrice),
        pricePerKm: parseOptionalNumber(signupForm.pricePerKm),
      });
      setSession(session);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("[auth] signup failed", err);
      setError(toUiErrorMessage(err, "Signup failed. Please review the form and try again."));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-lg border bg-card p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">Dispatch.Ambulink</h1>
          <p className="mt-2 text-muted-foreground">Dispatcher authentication</p>
        </div>

        {inviteTokenFromUrl ? (
          <InviteActivationPanel
            assignedEmail={previewInvite.data?.invitedEmail ?? "Loading..."}
            password={inviteForm.password}
            confirmPassword={inviteForm.confirmPassword}
            pending={activateInvite.isPending}
            previewLoading={previewInvite.isLoading}
            inviteValid={Boolean(previewInvite.data?.valid)}
            onPasswordChange={(value) => updateInviteForm("password", value)}
            onConfirmPasswordChange={(value) => updateInviteForm("confirmPassword", value)}
            onActivate={() => void submitInviteActivate()}
          />
        ) : null}

        <AuthTabSwitch tab={tab} setTab={setTab} />

        {tab === "login" ? (
          <LoginPanel
            form={loginForm}
            pending={loginDispatcher.isPending}
            onChange={updateLoginForm}
            onSubmit={() => void submitLogin()}
          />
        ) : (
          <SignupPanel
            form={signupForm}
            validation={signupValidation}
            pending={bootstrapSignup.isPending}
            onChange={updateSignupForm}
            onSubmit={() => void submitSignup()}
          />
        )}

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
