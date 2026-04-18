import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootStackParamList } from '../navigation/AppNavigator';
import colors from '../theme/colors';

const { width, height } = Dimensions.get('window');

type Nav = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const SLIDES = [
  {
    id: '1',
    title: 'Listen Without Listening',
    description: 'Instantly transcribe long voice notes into readable text. No more audio playbacks in public.',
    image: require('../../assets/onboarding/t_v3.png'),
  },
  {
    id: '2',
    title: 'Get the Point in Seconds',
    description: 'Our AI summarizes complex messages into clear, actionable bullet points instantly.',
    image: require('../../assets/onboarding/s_v3.png'),
  },
  {
    id: '3',
    title: 'Your Privacy Matters',
    description: "We don't store your data on servers. Your transcriptions stay on your device, safe and sound.",
    image: require('../../assets/onboarding/p_v2.png'),
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  async function handleFinish() {
    await AsyncStorage.setItem('HAS_ONBOARDED', 'true');
    navigation.replace('Home');
  }

  function handleNext() {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleFinish();
    }
  }

  const Pagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {SLIDES.map((_, i) => {
          const isActive = i === currentIndex;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                isActive && styles.dotActive,
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <TouchableOpacity 
        style={styles.skipBtn} 
        onPress={handleFinish}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        data={SLIDES}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.imageContainer}>
              <Image source={item.image} style={styles.image} resizeMode="contain" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />

      <View style={styles.footer}>
        <Pagination />

        <TouchableOpacity 
          style={styles.nextBtn} 
          onPress={handleNext}
          activeOpacity={0.8}>
          <Text style={styles.nextBtnText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
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
    top: 50,
    right: 30,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
  },
  textContainer: {
    flex: 0.4,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  footer: {
    height: height * 0.2,
    justifyContent: 'center',
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 5,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primaryBlue,
  },
  nextBtn: {
    backgroundColor: colors.primaryBlue,
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
