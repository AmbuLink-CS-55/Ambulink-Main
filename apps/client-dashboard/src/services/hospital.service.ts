import { api } from "@/lib/api";
import type { Hospital } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

export const useGetHospitals = () => {
  //NOTE: check if we have it sotred localy
  return useQuery({
    queryKey: queryKeys.hospitals(),
    staleTime: 6000 * 60 * 10,
    queryFn: async () => {
      const { data } = await api.get<Hospital[]>("/hospitals");
      return data;
    },
  });
};
