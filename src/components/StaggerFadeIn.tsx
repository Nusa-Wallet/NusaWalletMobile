import { PropsWithChildren, useEffect, useRef } from "react";
import { Animated, Platform, View } from "react-native";

import { easing } from "@/theme/animations";

type StaggerFadeInProps = {
  index?: number;
  baseDelay?: number;
  step?: number;
  webDisabled?: boolean;
};

export function StaggerFadeIn({
  children,
  index = 0,
  baseDelay = 80,
  step = 60,
  webDisabled = true,
}: PropsWithChildren<StaggerFadeInProps>) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (Platform.OS === "web" && webDisabled) return;
    const delay = baseDelay + index * step;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay,
        easing: easing.smooth,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        delay,
        easing: easing.smooth,
        useNativeDriver: true,
      }),
    ]).start();
  }, [baseDelay, index, opacity, step, translateY, webDisabled]);

  if (Platform.OS === "web" && webDisabled) {
    return <View>{children}</View>;
  }

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}
