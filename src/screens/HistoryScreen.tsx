import React, {useState, useCallback} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {
  getAllEntries,
  deleteEntry,
  type HistoryEntry,
} from '../store/historyStore';
import {formatDuration} from '../utils/formatDuration';
import CustomAlert, {useCustomAlert} from '../components/CustomAlert';
import colors from '../theme/colors';
import type {RootStackParamList} from '../navigation/AppNavigator';

type Nav = StackNavigationProp<RootStackParamList, 'History'>;

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const {config: alertConfig, showAlert, hideAlert} = useCustomAlert();

  const load = useCallback(async () => {
    const data = await getAllEntries();
    setEntries(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleDelete(id: string) {
    showAlert('Delete', 'Remove this transcription?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteEntry(id);
          load();
        },
      },
    ]);
  }

  function renderItem({item}: {item: HistoryEntry}) {
    const preview = item.bullets[0] ?? item.transcript.slice(0, 60);
    const date = new Date(item.createdAt).toLocaleDateString();

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          navigation.navigate('Result', {
            transcript: item.transcript,
            bullets: item.bullets,
            readSeconds: item.readSeconds,
            audioDuration: item.duration,
          })
        }
        onLongPress={() => handleDelete(item.id)}
        activeOpacity={0.7}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{formatDuration(item.duration)}</Text>
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.preview} numberOfLines={2}>
            {preview}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={entries.length === 0 ? styles.empty : undefined}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No transcriptions yet</Text>
        }
      />
      <CustomAlert config={alertConfig} onDismiss={hideAlert} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  badge: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 12,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  textGroup: {
    flex: 1,
  },
  preview: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 20,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});
