import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import colors from '../theme/colors';

interface TranscriptDropdownProps {
  transcript: string;
}

const COLLAPSED_HEIGHT = 0;
const EXPANDED_HEIGHT = 200;

export default function TranscriptDropdown({ transcript }: TranscriptDropdownProps) {
  const [expanded, setExpanded] = useState(false);
  const animHeight = useSharedValue(COLLAPSED_HEIGHT);

  const animStyle = useAnimatedStyle(() => ({
    height: animHeight.value,
    overflow: 'hidden',
  }));

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    animHeight.value = withTiming(next ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT, {
      duration: 300,
    });
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggle} style={styles.toggle}>
        <Text style={styles.toggleText}>
          {expanded ? 'Hide transcript ∧' : 'Show full transcript ∨'}
        </Text>
      </TouchableOpacity>
      <Animated.View style={animStyle}>
        <Text style={styles.transcriptText}>{transcript}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    marginTop: 12,
    paddingHorizontal: 24,
  },
  toggle: {
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 14,
    color: colors.primaryBlue,
    fontWeight: '600',
  },
  transcriptText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
