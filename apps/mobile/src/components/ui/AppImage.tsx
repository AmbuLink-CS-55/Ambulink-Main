/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import type { ComponentType } from "react";
import { Image as RNImage, type ImageProps as RNImageProps } from "react-native";

type AppImageProps = RNImageProps & {
  contentFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
};

const expoImageModuleName = "expo-image";

let ExpoImage: ComponentType<any> | null = null;
try {
  ExpoImage = require(expoImageModuleName).Image as ComponentType<any>;
} catch {
  ExpoImage = null;
}

export function AppImage({ contentFit, resizeMode, ...props }: AppImageProps) {
  if (ExpoImage) {
    return <ExpoImage {...props} contentFit={contentFit ?? resizeMode ?? "cover"} />;
  }

  return <RNImage {...props} resizeMode={resizeMode ?? contentFit ?? "cover"} />;
}
