import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

export const useGetEmts = (params?: {
  providerId?: string;
  isActive?: boolean;
  status?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.emts(params),
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data } = await api.get<User[]>("/emts", { params });
      return data;
    },
  });
};

export const useCreateEmt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<User>) => {
      const { data } = await api.post<User>("/emts", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emts() });
    },
  });
};

export const useUpdateEmt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<User> }) => {
      const { data } = await api.patch<User>(`/emts/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emts() });
    },
  });
};
