import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

interface BulletPointsProps {
  bullets: string[];
}

export default function BulletPoints({ bullets }: BulletPointsProps) {
  return (
    <View style={styles.container}>
      {bullets.map((bullet, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.prefix}>•</Text>
          <Text style={styles.text}>{bullet}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    paddingHorizontal: 24,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  prefix: {
    fontSize: 16,
    color: colors.textPrimary,
    marginRight: 8,
    lineHeight: 22,
  },
  text: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
});
