export type ThemeMode = "light" | "dark";
export type MapTheme = "light" | "dark";

export const THEME_CLASS_BY_MODE: Record<ThemeMode, string | null> = {
  light: null,
  dark: "dark",
};

export const MAP_THEME_BY_MODE: Record<ThemeMode, MapTheme> = {
  light: "light",
  dark: "dark",
};

export const THEME_MODE_OPTIONS: Array<{ value: ThemeMode; label: string; description: string }> = [
  {
    value: "light",
    label: "Light",
    description: "Bright interface with dark text.",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Dark interface with light text.",
  },
];

export const ALL_THEME_CLASSES = Array.from(
  new Set(Object.values(THEME_CLASS_BY_MODE).filter((value): value is string => Boolean(value)))
);

export function applyThemeMode(mode: ThemeMode, root: HTMLElement = document.documentElement) {
  ALL_THEME_CLASSES.forEach((className) => root.classList.remove(className));
  const className = THEME_CLASS_BY_MODE[mode];
  if (className) {
    root.classList.add(className);
  }
}

export function resolveMapTheme(mode: ThemeMode): MapTheme {
  return MAP_THEME_BY_MODE[mode];
}
