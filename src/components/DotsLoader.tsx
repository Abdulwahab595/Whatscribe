import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import colors from '../theme/colors';

const DOT_DELAYS = [0, 300, 600];

function AnimatedDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 450 }),
          withTiming(0, { duration: 450 }),
        ),
        -1,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text style={[styles.dot, animStyle]}>•</Animated.Text>
  );
}

export default function DotsLoader() {
  return (
    <View style={styles.row}>
      {DOT_DELAYS.map((delay, i) => (
        <AnimatedDot key={i} delay={delay} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    fontSize: 22,
    color: colors.textSecondary,
  },
});
