import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

const OVERVIEW_PANEL_VALUES = ["open", "closed"] as const;
const OVERVIEW_TAB_VALUES = ["all", "ongoing", "requests"] as const;
const SIDEBAR_VALUES = ["open", "closed"] as const;
const ANALYTICS_TAB_VALUES = ["response", "zones", "insights"] as const;
const ANALYTICS_ZONE_LAYER_VALUES = ["origins", "destinations"] as const;

type OverviewPanelState = (typeof OVERVIEW_PANEL_VALUES)[number];
type OverviewTabState = (typeof OVERVIEW_TAB_VALUES)[number];
type AnalyticsTabState = (typeof ANALYTICS_TAB_VALUES)[number];
type AnalyticsZoneLayerState = (typeof ANALYTICS_ZONE_LAYER_VALUES)[number];

const DEFAULT_OVERVIEW_PANEL: OverviewPanelState = "open";
const DEFAULT_OVERVIEW_TAB: OverviewTabState = "all";
const DEFAULT_SIDEBAR = "open";
const DEFAULT_ANALYTICS_TAB: AnalyticsTabState = "response";
const DEFAULT_ANALYTICS_ZONE_LAYER: AnalyticsZoneLayerState = "origins";

const PARAM_OVERVIEW_PANEL = "ov";
const PARAM_OVERVIEW_TAB = "ovTab";
const PARAM_SIDEBAR = "sb";
const PARAM_ANALYTICS_TAB = "anTab";
const PARAM_ANALYTICS_ZONE_LAYER = "anZone";

function parseEnumParam<const TValue extends readonly string[]>(
  value: string | null,
  allowedValues: TValue,
  fallback: TValue[number]
): TValue[number] {
  if (value && allowedValues.includes(value)) {
    return value as TValue[number];
  }
  return fallback;
}

export function useDashboardUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const overviewPanel = parseEnumParam(
    searchParams.get(PARAM_OVERVIEW_PANEL),
    OVERVIEW_PANEL_VALUES,
    DEFAULT_OVERVIEW_PANEL
  );
  const overviewTab = parseEnumParam(
    searchParams.get(PARAM_OVERVIEW_TAB),
    OVERVIEW_TAB_VALUES,
    DEFAULT_OVERVIEW_TAB
  );
  const sidebar = parseEnumParam(searchParams.get(PARAM_SIDEBAR), SIDEBAR_VALUES, DEFAULT_SIDEBAR);
  const analyticsTab = parseEnumParam(
    searchParams.get(PARAM_ANALYTICS_TAB),
    ANALYTICS_TAB_VALUES,
    DEFAULT_ANALYTICS_TAB
  );
  const analyticsZoneLayer = parseEnumParam(
    searchParams.get(PARAM_ANALYTICS_ZONE_LAYER),
    ANALYTICS_ZONE_LAYER_VALUES,
    DEFAULT_ANALYTICS_ZONE_LAYER
  );

  const setEnumParam = useCallback(
    (paramName: string, value: string, defaultValue: string) => {
      setSearchParams(
        (prevParams) => {
          const nextParams = new URLSearchParams(prevParams);
          if (value === defaultValue) {
            nextParams.delete(paramName);
          } else {
            nextParams.set(paramName, value);
          }
          return nextParams;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return {
    overviewOpen: overviewPanel === "open",
    setOverviewOpen: (open: boolean) =>
      setEnumParam(PARAM_OVERVIEW_PANEL, open ? "open" : "closed", DEFAULT_OVERVIEW_PANEL),

    overviewTab,
    setOverviewTab: (next: OverviewTabState) =>
      setEnumParam(PARAM_OVERVIEW_TAB, next, DEFAULT_OVERVIEW_TAB),

    sidebarOpen: sidebar === "open",
    setSidebarOpen: (open: boolean) =>
      setEnumParam(PARAM_SIDEBAR, open ? "open" : "closed", DEFAULT_SIDEBAR),

    analyticsTab,
    setAnalyticsTab: (next: AnalyticsTabState) =>
      setEnumParam(PARAM_ANALYTICS_TAB, next, DEFAULT_ANALYTICS_TAB),

    analyticsZoneLayer,
    setAnalyticsZoneLayer: (next: AnalyticsZoneLayerState) =>
      setEnumParam(PARAM_ANALYTICS_ZONE_LAYER, next, DEFAULT_ANALYTICS_ZONE_LAYER),
  };
}
