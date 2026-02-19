import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

type DriverQueryParams = {
  providerId?: string;
  isActive?: boolean;
  status?: string;
};

export const useGetDrivers = (params?: DriverQueryParams) => {
  return useQuery({
    queryKey: queryKeys.drivers(params),
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data } = await api.get<User[]>("/drivers", { params });
      return data;
    },
  });
};

export const useCreateDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<User>) => {
      const { data } = await api.post<User>("/drivers", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers() });
    },
  });
};

export const useUpdateDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<User> }) => {
      const { data } = await api.patch<User>(`/drivers/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers() });
    },
  });
};
