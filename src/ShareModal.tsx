import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  StatusBar,
  NativeModules,
  Platform,
} from 'react-native';
import ShareMenu, { ShareMenuReactView } from 'react-native-share-menu';
import { NavigationContainer } from '@react-navigation/native';
import BottomSheetModal from './components/BottomSheetModal';

type SharedItem = {
  mimeType: string;
  data: string;
  extraData?: any;
};

export default function ShareModal() {
  const [sharedItem, setSharedItem] = useState<SharedItem | null>(null);
  const [visible, setVisible] = useState(false);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      // Check if the native module exists before calling dismissExtension to avoid crashes
      if (NativeModules.ShareMenuReactView) {
        ShareMenuReactView.dismissExtension();
      } else if (Platform.OS === 'android') {
        // Fallback for Android if the module is missing: close the current activity
        BackHandler.exitApp();
      }
    }, 350);
  }, []);

  const handleShare = useCallback((item: SharedItem | null) => {
    if (!item || !item.data) return;
    setSharedItem(item);
    setVisible(true);
  }, []);

  useEffect(() => {
    ShareMenu.getInitialShare(handleShare);
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleClose();
        return true;
      }
    );
    return () => backHandler.remove();
  }, [handleShare, handleClose]);

  return (
    <NavigationContainer>
      <StatusBar translucent backgroundColor="transparent" />
      <View style={styles.root}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <BottomSheetModal
          visible={visible}
          onClose={handleClose}
          audioUri={sharedItem?.data ?? null}
          mimeType={sharedItem?.mimeType ?? null}
          audioDuration={0}
        />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
