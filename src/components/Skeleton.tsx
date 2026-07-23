import { useEffect } from "react";
import { View, ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { colors, radius } from "@/theme/colors";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius: customRadius,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    return () => cancelAnimation(opacity);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: customRadius ?? radius.sm,
          backgroundColor: colors.fill,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{ padding: 16, gap: 12 }, style]}>
      <Skeleton width="40%" height={14} />
      <Skeleton width="100%" height={32} />
      <Skeleton width="60%" height={14} />
    </View>
  );
}

export function SkeletonTxRow() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 }}>
      <Skeleton width={10} height={10} borderRadius={5} />
      <View style={{ flex: 1, gap: 4 }}>
        <Skeleton width="65%" height={14} />
        <Skeleton width="30%" height={11} />
      </View>
      <Skeleton width={80} height={16} />
    </View>
  );
}
