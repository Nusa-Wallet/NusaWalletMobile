import { useCallback } from "react";
import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { springConfigs } from "@/theme/animations";

interface AnimatedPressableProps extends PressableProps {
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const AnimatedPressable = ({
  children,
  scaleTo = 0.96,
  style,
  onPressIn,
  onPressOut,
  ...props
}: AnimatedPressableProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (e: any) => {
      scale.value = withSpring(scaleTo, springConfigs.press);
      onPressIn?.(e);
    },
    [scaleTo, onPressIn],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      scale.value = withSpring(1, springConfigs.release);
      onPressOut?.(e);
    },
    [onPressOut],
  );

  return (
    <Pressable
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[animatedStyle, style as any]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default AnimatedPressable;
