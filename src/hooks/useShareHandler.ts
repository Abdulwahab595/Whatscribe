import { useEffect, useState } from 'react';
import ShareMenu, { ShareCallback, ShareMenuReactView } from 'react-native-share-menu';

export interface SharedItem {
  mimeType: string;
  data: string;
  extraData?: Record<string, unknown>;
}

export function useShareHandler() {
  const [sharedItem, setSharedItem] = useState<SharedItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleShare: ShareCallback = (item) => {
    if (!item) return;
    setSharedItem({
      mimeType: item.mimeType,
      data: item.data as string,
      extraData: item.extraData as Record<string, unknown> | undefined,
    });
    setModalVisible(true);
  };

  useEffect(() => {
    ShareMenu.getInitialShare(handleShare);
    const subscription = ShareMenu.addNewShareListener(handleShare);
    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { sharedItem, modalVisible, setModalVisible };
}
