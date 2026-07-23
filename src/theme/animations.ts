import { Easing } from "react-native-reanimated";

// Inspired by Rainbow's animationConfigs.ts — centralized spring/timing presets

export const easing = {
  buttonPress: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  fade: Easing.bezier(0.22, 1, 0.36, 1),
  smooth: Easing.bezier(0.4, 0, 0.22, 1),
  inOut: Easing.inOut(Easing.ease),
  out: Easing.out(Easing.ease),
} as const;

export const springConfigs = {
  /** Crisp press-down feedback (scale to 0.96) */
  press: { damping: 20, mass: 0.5, stiffness: 300 },
  /** Gentle lift-back */
  release: { damping: 15, mass: 0.5, stiffness: 200 },
  /** Smooth card entry */
  cardEntry: { damping: 24, mass: 0.8, stiffness: 200 },
  /** Tab switch */
  tabSwitch: { damping: 40, mass: 1.25, stiffness: 420 },
} as const;

export const timingConfigs = {
  fadeIn: { duration: 250, easing: easing.fade },
  fadeOut: { duration: 150, easing: easing.fade },
  shimmer: { duration: 2200, easing: easing.smooth },
  slowFade: { duration: 400, easing: easing.fade },
} as const;

/** Stagger delay per item index (for list entries) */
export function staggerDelay(index: number, base = 60) {
  return index * base;
}
