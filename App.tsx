import 'react-native-reanimated';
import React from 'react';
import {StyleSheet} from 'react-native';

import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import BottomSheetModal from './src/components/BottomSheetModal';
import {useShareHandler} from './src/hooks/useShareHandler';
import AppNavigator from './src/navigation/AppNavigator';
function RootApp(): React.JSX.Element {
  const {sharedItem, modalVisible, setModalVisible} = useShareHandler();

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
