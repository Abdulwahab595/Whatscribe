import React, {useEffect} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

const {width} = Dimensions.get('window');
const SIZE = width * 0.6;

// --- 1. VOICE BAR ANIMATION (NO SVG) ---
const VoiceBar = ({delay}: {delay: number}) => {
  const height = useSharedValue(20);

  useEffect(() => {
    height.value = withDelay(
      delay,
      withRepeat(
        withTiming(80, {duration: 600, easing: Easing.inOut(Easing.ease)}),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    height: height.value,
    opacity: interpolate(height.value, [20, 80], [0.4, 1]),
  }));

  return <Animated.View style={[styles.voiceBar, style]} />;
};

export const VoiceWave = () => {
  return (
    <View style={styles.animContainer}>
      <View style={styles.voiceContainer}>
        {[...Array(12)].map((_, i) => (
          <VoiceBar key={i} delay={i * 100} />
        ))}
      </View>
    </View>
  );
};

// --- 2. AI ORBIT ANIMATION (NO SVG) ---
const OrbitParticle = ({index}: {index: number}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {duration: 3000 + index * 500, easing: Easing.linear}),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      {rotate: `${rotation.value + index * 45}deg`},
      {translateY: 60 + (index % 3) * 10},
    ],
  }));

  return <Animated.View style={[styles.particle, style]} />;
};

export const AISparkle = () => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.2, {duration: 1000}), withTiming(1, {duration: 1000})),
      -1,
      true
    );
  }, []);

  const centerStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return (
    <View style={styles.animContainer}>
      <View style={styles.orbitContainer}>
        {[...Array(8)].map((_, i) => (
          <OrbitParticle key={i} index={i} />
        ))}
        <Animated.View style={[styles.aiCenter, centerStyle]}>
          <LinearGradient
            colors={['#7C4DFF', '#4F7FFF']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
};

// --- 3. PRIVACY SCAN ANIMATION (NO SVG) ---
export const PrivacyShield = () => {
  const scanPos = useSharedValue(0);

  useEffect(() => {
    scanPos.value = withRepeat(
      withTiming(160, {duration: 2000, easing: Easing.inOut(Easing.ease)}),
      -1,
      true
    );
  }, []);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{translateY: scanPos.value}],
  }));

  return (
    <View style={styles.animContainer}>
      <View style={styles.shieldBase}>
        <Animated.View style={[styles.scanLine, scanStyle]} />
        <View style={styles.lockIconContainer}>
           <View style={styles.lockShackle} />
           <View style={styles.lockBody} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  animContainer: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Voice Styles
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 100,
  },
  voiceBar: {
    width: 6,
    backgroundColor: '#4F7FFF',
    marginHorizontal: 3,
    borderRadius: 3,
  },
  // AI Styles
  orbitContainer: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#7C4DFF',
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7C4DFF',
    opacity: 0.6,
  },
  // Privacy Styles
  shieldBase: {
    width: 140,
    height: 170,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 4,
    backgroundColor: '#00C853',
    opacity: 0.5,
    shadowColor: '#00C853',
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  lockIconContainer: {
    alignItems: 'center',
  },
  lockShackle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 4,
    borderColor: '#00C853',
    marginBottom: -15,
  },
  lockBody: {
    width: 46,
    height: 36,
    backgroundColor: '#00C853',
    borderRadius: 6,
  },
});
