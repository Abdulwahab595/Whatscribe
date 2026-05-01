import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  useAnimatedScrollHandler,
  Extrapolate,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../navigation/AppNavigator';
import colors from '../theme/colors';
import {VoiceWave, AISparkle, PrivacyShield} from '../components/OnboardingAnimations';

const {width, height} = Dimensions.get('window');

type Nav = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const SLIDES = [
  {
    id: '1',
    title: 'Listen Without\nListening',
    description: 'Instantly transcribe long voice notes into readable text. No more audio playbacks in public.',
    component: VoiceWave,
  },
  {
    id: '2',
    title: 'Precision AI\nSummaries',
    description: 'Get the gist in seconds. Our advanced AI highlights key decisions and action items from any conversation.',
    component: AISparkle,
  },
  {
    id: '3',
    title: 'Private &\nSecure',
    description: 'Your data never leaves your device. We use local encryption to keep your transcriptions for your eyes only.',
    component: PrivacyShield,
  },
];

const SlideItem = ({item, index, scrollX}: {item: any; index: number; scrollX: Animated.SharedValue<number>}) => {
  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [(index - 0.5) * width, index * width, (index + 0.5) * width],
      [0, 1, 0]
    );
    const translateY = interpolate(
      scrollX.value,
      [(index - 0.5) * width, index * width, (index + 0.5) * width],
      [40, 0, 40]
    );
    return {opacity, transform: [{translateY}]};
  });

  const animatedImageStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.6, 1, 0.6]
    );
    return {
      transform: [{scale}]
    };
  });

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.visualContainer, animatedImageStyle]}>
        <item.component />
      </Animated.View>
      <Animated.View style={[styles.textContainer, animatedTextStyle]}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </Animated.View>
    </View>
  );
};

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<Animated.FlatList<any>>(null);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  async function handleFinish() {
    await AsyncStorage.setItem('HAS_ONBOARDED', 'true');
    navigation.replace('Home');
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      <TouchableOpacity 
        style={styles.skipBtn} 
        onPress={handleFinish}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={({item, index}) => (
          <SlideItem item={item} index={index} scrollX={scrollX} />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => {
            const dotStyle = useAnimatedStyle(() => {
              const dotWidth = interpolate(
                scrollX.value,
                [(i - 1) * width, i * width, (i + 1) * width],
                [8, 24, 8],
                Extrapolate.CLAMP
              );
              const opacity = interpolate(
                scrollX.value,
                [(i - 1) * width, i * width, (i + 1) * width],
                [0.3, 1, 0.3],
                Extrapolate.CLAMP
              );
              return {width: dotWidth, opacity};
            });
            return <Animated.View key={i} style={[styles.dot, dotStyle]} />;
          })}
        </View>

        <TouchableOpacity 
          style={styles.nextBtn} 
          onPress={() => {
            const nextIndex = Math.round(scrollX.value / width) + 1;
            if (nextIndex < SLIDES.length) {
              flatListRef.current?.scrollToIndex({index: nextIndex});
            } else {
              handleFinish();
            }
          }}
          activeOpacity={0.8}>
          <LinearGradient
            colors={['#4F7FFF', '#3A5FCC']}
            style={styles.nextBtnGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
          >
            <Text style={styles.nextBtnText}>
              {scrollX.value >= (SLIDES.length - 1.5) * width ? 'Get Started' : 'Next'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: height * 0.1,
  },
  visualContainer: {
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 0, 
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryBlue,
    marginHorizontal: 4,
  },
  nextBtn: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    overflow: 'hidden',
  },
  nextBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
