import { api } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { DispatcherSession } from "@/stores/auth.store";

export type DispatcherSignupPayload = {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  providerId?: string;
  inviteToken?: string;
};

export type DispatcherInvitePayload = {
  email?: string;
  expiresInHours?: number;
};

export type DispatcherInviteResponse = {
  id: string;
  providerId: string;
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

export const useSignupDispatcher = () => {
  return useMutation({
    mutationFn: async (payload: DispatcherSignupPayload) => {
      const { data } = await api.post<DispatcherSession>("/auth/dispatcher/signup", payload);
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

export const useCreateDispatcherInvite = () => {
  return useMutation({
    mutationFn: async (payload: DispatcherInvitePayload) => {
      const { data } = await api.post<DispatcherInviteResponse>("/dispatchers/invites", payload);
      return data;
    },
  });
};
