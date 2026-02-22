import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export const useGetPatients = (params?: { isActive?: boolean }) => {
  return useQuery({
    queryKey: ["patients", params ?? null],
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data } = await api.get<User[]>("/patients", {
        params: {
          isActive: params?.isActive,
        },
      });
      return data;
    },
  });
};
