import { PropsWithChildren } from "react";
import { Platform, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { easing } from "@/theme/animations";

type StaggerFadeInProps = {
  index?: number;
  baseDelay?: number;
  step?: number;
  /** Skip animation on web to avoid Reanimated layout-animation race condition */
  webDisabled?: boolean;
};

export function StaggerFadeIn({
  children,
  index = 0,
  baseDelay = 80,
  step = 60,
  webDisabled = true,
}: PropsWithChildren<StaggerFadeInProps>) {
  if (Platform.OS === "web" && webDisabled) {
    return <View>{children}</View>;
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(320)
        .easing(easing.smooth)
        .delay(baseDelay + index * step)
        .withInitialValues({ transform: [{ translateY: 16 }] })}
    >
      {children}
    </Animated.View>
  );
}
