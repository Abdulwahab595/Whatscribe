import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import RNBlobUtil from 'react-native-blob-util';
import WavyIcon from '../components/WavyIcon';
import colors from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();

  async function handlePickAudio() {
    try {

      Alert.alert(
        'How to transcribe',
        'Share a voice note from WhatsApp or another app using the Share menu, then choose Whatscribe.',
      );
    } catch (e) {
     
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <TouchableOpacity onPress={handlePickAudio} activeOpacity={0.8}>
          <WavyIcon isAnimating={false} size={100} />
        </TouchableOpacity>
        <Text style={styles.hint}>Share a voice note from WhatsApp</Text>
      </View>

      <View style={styles.bottomRow}>
        <TouchableOpacity
          onPress={() => navigation.navigate('History')}
          style={styles.navBtn}>
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.navBtn}>
          <Text style={styles.navText}>Setting</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 16,
    color: colors.textMid,
    textAlign: 'center',
    marginTop: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 32,
  },
  navBtn: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  navText: {
    fontSize: 14,
    color: colors.textSubtle,
  },
});
