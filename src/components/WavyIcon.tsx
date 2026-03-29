import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../theme/colors';

interface WavyIconProps {
  isAnimating: boolean;
  size?: number;
}

const REST_HEIGHTS = [14, 20, 28, 20, 14];
const MAX_HEIGHTS = [22, 30, 38, 30, 22];
const MIN_HEIGHTS = [8, 12, 16, 12, 8];
const DELAYS = [0, 100, 200, 100, 0];

export default function WavyIcon({ isAnimating, size = 88 }: WavyIconProps) {
  const bar0 = useSharedValue(REST_HEIGHTS[0]);
  const bar1 = useSharedValue(REST_HEIGHTS[1]);
  const bar2 = useSharedValue(REST_HEIGHTS[2]);
  const bar3 = useSharedValue(REST_HEIGHTS[3]);
  const bar4 = useSharedValue(REST_HEIGHTS[4]);
  const bars = [bar0, bar1, bar2, bar3, bar4];

  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (isAnimating) {
      bars.forEach((bar, i) => {
        bar.value = withDelay(
          DELAYS[i],
          withRepeat(
            withSequence(
              withTiming(MAX_HEIGHTS[i], { duration: 300 }),
              withTiming(MIN_HEIGHTS[i], { duration: 300 }),
            ),
            -1,
            true,
          ),
        );
      });
      glowOpacity.value = withRepeat(
        withTiming(0.7, { duration: 1500 }),
        -1,
        true,
      );
    } else {
      bars.forEach((bar, i) => {
        bar.value = withTiming(REST_HEIGHTS[i], { duration: 300 });
      });
      glowOpacity.value = withTiming(0.4, { duration: 300 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const barStyles = bars.map(bar =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({ height: bar.value })),
  );

  const glowSize = size * 1.5;

  return (
    <View style={[styles.container, { width: glowSize, height: glowSize }]}>
      <Animated.View
        style={[
          styles.glowWrapper,
          { width: glowSize, height: glowSize, borderRadius: glowSize / 2 },
          glowStyle,
        ]}>
        <LinearGradient
          colors={[colors.glowColor, 'transparent']}
          style={[
            styles.glow,
            { width: glowSize, height: glowSize, borderRadius: glowSize / 2 },
          ]}
        />
      </Animated.View>

      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.primaryBlue,
          },
        ]}>
        {barStyles.map((style, i) => (
          <Animated.View
            key={i}
            style={[
              styles.bar,
              style,
              { width: 4, borderRadius: 2, backgroundColor: colors.white },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrapper: {
    position: 'absolute',
  },
  glow: {
    flex: 1,
  },
  circle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  bar: {
    alignSelf: 'center',
  },
});
