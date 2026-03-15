export type AuthTab = "login" | "signup";

export type LoginFormState = {
  email: string;
  password: string;
};

export type InviteFormState = {
  password: string;
  confirmPassword: string;
};

export type SignupFormState = {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  providerName: string;
  providerType: "PUBLIC" | "PRIVATE";
  hotlineNumber: string;
  address: string;
  initialPrice: string;
  pricePerKm: string;
};

export type SignupValidation = {
  hasFullName: boolean;
  hasPhoneNumber: boolean;
  hasEmail: boolean;
  hasValidEmailFormat: boolean;
  hasPasswordLength: boolean;
  hasProviderName: boolean;
  hasValidHotline: boolean;
  hasValidAddress: boolean;
  hasValidInitialPrice: boolean;
  hasValidPricePerKm: boolean;
  issues: string[];
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const initialLoginFormState: LoginFormState = {
  email: "",
  password: "",
};

export const initialInviteFormState: InviteFormState = {
  password: "",
  confirmPassword: "",
};

export const initialSignupFormState: SignupFormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
  password: "",
  providerName: "",
  providerType: "PRIVATE",
  hotlineNumber: "",
  address: "",
  initialPrice: "",
  pricePerKm: "",
};

function isOptionalNonNegativeNumber(raw: string) {
  if (!raw.trim()) return true;
  const number = Number(raw);
  return !Number.isNaN(number) && number >= 0;
}

export function validateSignupForm(form: SignupFormState): SignupValidation {
  const hasFullName = form.fullName.trim().length >= 2;
  const hasPhoneNumber = form.phoneNumber.trim().length >= 5;
  const hasEmail = form.email.trim().length > 0;
  const hasValidEmailFormat = !hasEmail || EMAIL_REGEX.test(form.email.trim());
  const hasPasswordLength = form.password.length >= 8;
  const hasProviderName = form.providerName.trim().length >= 2;
  const hasValidHotline = !form.hotlineNumber.trim() || form.hotlineNumber.trim().length >= 5;
  const hasValidAddress = !form.address.trim() || form.address.trim().length >= 5;
  const hasValidInitialPrice = isOptionalNonNegativeNumber(form.initialPrice);
  const hasValidPricePerKm = isOptionalNonNegativeNumber(form.pricePerKm);

  const issues: string[] = [];
  if (!hasFullName) issues.push("Full name must be at least 2 characters.");
  if (!hasPhoneNumber) issues.push("Phone number must be at least 5 characters.");
  if (!hasEmail) issues.push("Email is required.");
  if (hasEmail && !hasValidEmailFormat) issues.push("Email format is invalid.");
  if (!hasPasswordLength) issues.push("Password must be at least 8 characters.");
  if (!hasProviderName) issues.push("Organization name must be at least 2 characters.");
  if (!hasValidHotline) issues.push("Hotline number must be at least 5 characters.");
  if (!hasValidAddress) issues.push("Address must be at least 5 characters.");
  if (!hasValidInitialPrice) issues.push("Initial price must be a non-negative number.");
  if (!hasValidPricePerKm) issues.push("Price per km must be a non-negative number.");

  return {
    hasFullName,
    hasPhoneNumber,
    hasEmail,
    hasValidEmailFormat,
    hasPasswordLength,
    hasProviderName,
    hasValidHotline,
    hasValidAddress,
    hasValidInitialPrice,
    hasValidPricePerKm,
    issues,
  };
}
