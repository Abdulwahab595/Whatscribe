import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';

interface TranscriptDropdownProps {
  summary: string;
}

const COLLAPSED_HEIGHT = 0;
const EXPANDED_HEIGHT = 200;

export default function TranscriptDropdown({summary}: TranscriptDropdownProps) {
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
          {expanded ? 'Hide original transcript' : 'See original transcript'}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={16}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      <Animated.View style={animStyle}>
        <Text style={styles.transcriptText}>{summary}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  toggleText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  transcriptText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
