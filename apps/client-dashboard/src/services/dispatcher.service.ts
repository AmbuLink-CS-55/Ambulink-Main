import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetDispatchers = (params?: {
  providerId?: string;
  isActive?: boolean;
  status?: string;
}) => {
  return useQuery({
    queryKey: ["dispatchers", params ?? null],
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data } = await api.get<User[]>("/dispatchers", { params });
      return data;
    },
  });
};

export const useCreateDispatcher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<User>) => {
      const { data } = await api.post<User>("/dispatchers", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatchers"] });
    },
  });
};

export const useUpdateDispatcher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<User> }) => {
      const { data } = await api.patch<User>(`/dispatchers/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatchers"] });
    },
  });
};
