import { PixelRatio } from "react-native";

const BASE_WIDTH = 375;

/** Pure function: scale a size proportionally to the given screen width. */
export function scale(size: number, screenWidth: number): number {
  const factor = Math.min(screenWidth / BASE_WIDTH, 1.5);
  return PixelRatio.roundToNearestPixel(size * factor);
}

/** Pure function: scale a font size with a gentler curve. */
export function scaleFont(size: number, screenWidth: number): number {
  const factor = Math.min(screenWidth / BASE_WIDTH, 1.3);
  return PixelRatio.roundToNearestPixel(size * (0.5 + 0.5 * factor));
}

/**
 * Calculate card/item width that fits N columns given container padding + gap.
 */
export function cardWidth(
  screenWidth: number,
  columns: number,
  horizontalPadding: number,
  gap: number,
): number {
  const usable = screenWidth - horizontalPadding * 2 - gap * (columns - 1);
  return Math.max(Math.floor(usable / columns), 60);
}

/** Content area width (screen minus 2× padding). */
export function contentWidth(screenWidth: number, horizontalPadding: number): number {
  return screenWidth - horizontalPadding * 2;
}
