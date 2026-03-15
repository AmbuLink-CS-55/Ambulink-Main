import { api } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { DispatcherSession } from "@/stores/auth.store";
import type { ProviderType } from "@/lib/types";

export type DispatcherBootstrapSignupPayload = {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  providerName: string;
  providerType: ProviderType;
  hotlineNumber?: string;
  address?: string;
  initialPrice?: number;
  pricePerKm?: number;
};

export type StaffInviteRole = "DISPATCHER" | "DRIVER" | "EMT";

export type StaffInvitePayload = {
  role: StaffInviteRole;
  fullName?: string;
  phoneNumber?: string;
  email: string;
  expiresInHours?: number;
};

export type StaffInviteResponse = {
  id: string;
  providerId: string;
  role: StaffInviteRole;
  invitedEmail: string | null;
  expiresAt: string;
  inviteToken: string;
};

export const useLoginDispatcher = () => {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const { data } = await api.post<DispatcherSession>("/auth/dispatcher/login", payload);
      return data;
    },
  });
};

export const useBootstrapDispatcherSignup = () => {
  return useMutation({
    mutationFn: async (payload: DispatcherBootstrapSignupPayload) => {
      const { data } = await api.post<DispatcherSession>("/auth/dispatcher/bootstrap-signup", payload);
      return data;
    },
  });
};

export type StaffInvitePreview = {
  valid: boolean;
  role: StaffInviteRole | null;
  invitedEmail: string | null;
  expiresAt: string | null;
};

export const usePreviewStaffInvite = (inviteToken: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["staff-invite-preview", inviteToken],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<StaffInvitePreview>("/auth/staff/invites/preview", {
        params: { inviteToken },
      });
      return data;
    },
  });
};

export const useActivateStaffInvite = () => {
  return useMutation({
    mutationFn: async (payload: {
      inviteToken: string;
      password: string;
      confirmPassword: string;
    }) => {
      const { data } = await api.post<DispatcherSession>("/auth/staff/invites/activate", payload);
      return data;
    },
  });
};

export const useAuthMe = (enabled: boolean) => {
  return useQuery({
    queryKey: ["auth", "me"],
    enabled,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data } = await api.get<{ user: DispatcherSession["user"] }>("/auth/me");
      return data;
    },
  });
};

export const useCreateStaffInvite = () => {
  return useMutation({
    mutationFn: async (payload: StaffInvitePayload) => {
      const { data } = await api.post<StaffInviteResponse>("/staff-invites", payload);
      return data;
    },
  });
};
