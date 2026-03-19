import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  AnalyticsInsights,
  AnalyticsResponse,
  AnalyticsZones,
} from "@ambulink/types";

type AnalyticsQuery = {
  from?: string;
  to?: string;
  bookingId?: string;
};

export const useAnalyticsResponse = (params: AnalyticsQuery) => {
  return useQuery({
    queryKey: queryKeys.analyticsResponse("session", params.from, params.to),
    enabled: true,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data } = await api.get<AnalyticsResponse>("/analytics/response", { params });
      return data;
    },
  });
};

export const useAnalyticsZones = (params: AnalyticsQuery) => {
  return useQuery({
    queryKey: queryKeys.analyticsZones("session", params.from, params.to),
    enabled: true,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data } = await api.get<AnalyticsZones>("/analytics/zones", { params });
      return data;
    },
  });
};

export const useAnalyticsInsights = (params: AnalyticsQuery) => {
  return useQuery({
    queryKey: queryKeys.analyticsInsights("session", params.from, params.to),
    enabled: true,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data } = await api.get<AnalyticsInsights>("/analytics/insights", { params });
      return data;
    },
  });
};

export function getAnalyticsReportDownloadUrl(params: AnalyticsQuery) {
  const base = String(api.defaults.baseURL ?? "");
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const url = new URL("analytics/reports", normalizedBase);
  if (params.from) url.searchParams.set("from", params.from);
  if (params.to) url.searchParams.set("to", params.to);
  if (params.bookingId) url.searchParams.set("bookingId", params.bookingId);
  return url.toString();
}
