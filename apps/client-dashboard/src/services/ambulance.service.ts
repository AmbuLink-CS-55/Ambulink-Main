import { api } from "@/lib/api";
import type { Ambulance } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type AmbulanceQueryParams = {
  providerId?: string;
};

export const useGetAmbulances = (params?: AmbulanceQueryParams) => {
  return useQuery({
    queryKey: ["ambulances", params],
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data } = await api.get<Ambulance[]>("/ambulances", { params });
      return data;
    },
  });
};

export const useCreateAmbulance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Ambulance>) => {
      const { data } = await api.post<Ambulance>("/ambulances", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ambulances"] });
    },
  });
};

export const useUpdateAmbulance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Ambulance> }) => {
      const { data } = await api.patch<Ambulance>(`/ambulances/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ambulances"] });
    },
  });
};
