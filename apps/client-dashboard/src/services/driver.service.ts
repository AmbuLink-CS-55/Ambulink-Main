import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

type DriverQueryParams = {
  providerId?: string;
  isActive?: boolean;
  status?: string;
};

export const useGetDrivers = (params?: DriverQueryParams) => {
  return useQuery({
    queryKey: ["drivers", params],
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data } = await api.get<User[]>("/drivers", { params });
      return data;
    },
  });
};
