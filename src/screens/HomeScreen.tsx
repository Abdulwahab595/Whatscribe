import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';
import colors from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = StackNavigationProp<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.40;



export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { config: alertConfig, showAlert, hideAlert } = useCustomAlert();

  // Pulsing glow animation
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const glowOpacity1 = useRef(new Animated.Value(0.45)).current;
  const glowOpacity2 = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse1, { toValue: 1.12, duration: 1600, useNativeDriver: true }),
          Animated.timing(glowOpacity1, { toValue: 0.12, duration: 1600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulse1, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(glowOpacity1, { toValue: 0.45, duration: 1600, useNativeDriver: true }),
        ]),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse2, { toValue: 1.25, duration: 2200, useNativeDriver: true }),
          Animated.timing(glowOpacity2, { toValue: 0.06, duration: 2200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulse2, { toValue: 1, duration: 2200, useNativeDriver: true }),
          Animated.timing(glowOpacity2, { toValue: 0.25, duration: 2200, useNativeDriver: true }),
        ]),
      ]),
    ).start();
  }, [pulse1, pulse2, glowOpacity1, glowOpacity2]);

  function handleHowTo() {
    showAlert(
      'How to transcribe',
      'Share a voice note from WhatsApp or another app using the Share menu, then choose Whatscribe.',
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6FB" translucent={false} />

      {/* ── Upper: title + icon grouped together ── */}
      <View style={styles.upperContent}>
        <Text style={styles.title}>Share a Voice note</Text>
        <Text style={styles.subtitle}>from WhatsApp share menu</Text>

        <View style={styles.iconArea}>
          <Animated.View
            style={[
              styles.glowRing,
              {
                width: CIRCLE_SIZE * 1.5,
                height: CIRCLE_SIZE * 1.5,
                borderRadius: CIRCLE_SIZE * 0.75,
                transform: [{ scale: pulse2 }],
                opacity: glowOpacity2,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.glowRing,
              {
                width: CIRCLE_SIZE * 1.24,
                height: CIRCLE_SIZE * 1.24,
                borderRadius: CIRCLE_SIZE * 0.62,
                transform: [{ scale: pulse1 }],
                opacity: glowOpacity1,
              },
            ]}
          />
          <LinearGradient
            colors={['#A5C6FF', '#6EA8FF']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={[
              styles.circle,
              { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2 },
            ]}>
            <Icon name="mic" size={CIRCLE_SIZE * 0.42} color="#FFFFFF" />
          </LinearGradient>
        </View>
      </View>

      {/* ── Flexible spacer ── */}
      <View style={{ flex: 1 }} />

      {/* ── Button ── */}
      <View style={styles.btnSection}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleHowTo}
          activeOpacity={0.85}>
          <Text style={styles.ctaText}>See how to transcribe</Text>
        </TouchableOpacity>
      </View>

      {/* ── Nav bar ── */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.7}>
          <Icon name="time-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>History</Text>
        </TouchableOpacity>

        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}>
          <Icon name="settings-outline" size={22} color={colors.primaryBlue} />
          <Text style={[styles.navLabel, { color: colors.primaryBlue }]}>Settings</Text>
        </TouchableOpacity>
      </View>

      <CustomAlert config={alertConfig} onDismiss={hideAlert} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },

  /* Title + icon grouped in upper portion */
  upperContent: {
    alignItems: 'center',
    paddingTop: 90,
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 32,
  },

  /* Icon wrapper — needs explicit height for glow rings */
  iconArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: CIRCLE_SIZE * 1.6,
    width: CIRCLE_SIZE * 1.6,
  },

  glowRing: {
    position: 'absolute',
    backgroundColor: '#6EA8FF',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#4F7FFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },

  /* Button section */
  btnSection: {
    paddingHorizontal: 24,
    paddingBottom: 130,
  },
  ctaButton: {
    width: '100%',
    backgroundColor: '#4F7FFF',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  /* Nav bar */
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
  },
  navLabel: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
  },
});
