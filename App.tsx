import 'react-native-reanimated';
import React, {useEffect} from 'react';
import {StyleSheet, Platform} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Purchases from 'react-native-purchases';
import Config from 'react-native-config';
import AppNavigator from './src/navigation/AppNavigator';
import BottomSheetModal from './src/components/BottomSheetModal';
import {useShareHandler} from './src/hooks/useShareHandler';

import {NavigationContainer} from '@react-navigation/native';

function RootApp(): React.JSX.Element {
  const { sharedItem, modalVisible, setModalVisible } = useShareHandler();

  return (
    <NavigationContainer>
      <AppNavigator />
      {sharedItem && (
        <BottomSheetModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          audioUri={sharedItem.data}
          audioDuration={0}
        />
      )}
    </NavigationContainer>
  );
}

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize RevenueCat once at app startup.
    // Use platform-specific keys if you ever create separate iOS/Android projects.
    const apiKey = Config.REVENUECAT_API_KEY ?? '';
    if (apiKey) {
      Purchases.configure({apiKey});
      console.log('RevenueCat configured');
    } else {
      console.warn('REVENUECAT_API_KEY missing from .env');
    }
  }, []);
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <RootApp />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
