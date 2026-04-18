import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  getAllEntries,
  deleteEntry,
  type HistoryEntry,
} from '../store/historyStore';
import { formatDuration } from '../utils/formatDuration';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';
import colors from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = StackNavigationProp<RootStackParamList, 'History'>;

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // 0-11
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const { config: alertConfig, showAlert, hideAlert } = useCustomAlert();

  const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const YEARS = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  const load = useCallback(async () => {
    const data = await getAllEntries();
    setEntries(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Combined Filtering Logic (Nuclear Fix)
  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    
    return entries.filter(entry => {
      // 1. SAFE DATE PARSING
      let entryYear: number | null = null;
      let entryMonth: number | null = null;
      
      if (entry.createdAt) {
        try {
          const d = new Date(entry.createdAt);
          if (!isNaN(d.getTime())) {
            entryYear = d.getFullYear();
            entryMonth = d.getMonth();
          }
        } catch (e) {
          console.warn('Invalid date in entry', entry.id);
        }
      }

      // 2. YEAR & MONTH MATCHING
      const matchesYear = selectedYear === null || entryYear === selectedYear;
      const matchesMonth = selectedMonth === null || entryMonth === selectedMonth;
      
      if (!matchesYear || !matchesMonth) return false;

      // 3. UNIVERSAL SEARCH (If query exists)
      if (!q) return true;

      // Flatten everything into one searchable string
      const fullContent = [
        entry.transcript,
        entry.fullSummary,
        entry.fullTranslation,
        ...(entry.bullets || [])
      ].join(' ').toLowerCase();

      return fullContent.includes(q);
    });
  }, [entries, searchQuery, selectedMonth, selectedYear]);

  async function handleDelete(id: string) {
    showAlert('Delete', 'Remove this transcription?', [
      { text: 'Cancel', style: 'cancel' },
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

  function renderHistoryCard({ item }: { item: HistoryEntry }) {
    const preview = item.bullets[0] ?? (item.transcript || '').slice(0, 80);
    const dateObj = new Date(item.createdAt);
    const dateFormatted = dateObj.toLocaleDateString('default', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('Result', {
            transcript: item.transcript,
            bullets: item.bullets,
            fullSummary: item.fullSummary,
            fullTranslation: item.fullTranslation,
            readSeconds: item.readSeconds,
            audioDuration: item.duration,
          })
        }
        onLongPress={() => handleDelete(item.id)}
        activeOpacity={0.85}>
        <View style={styles.cardHeader}>
          <View style={styles.durationBadge}>
            <Icon name="time-outline" size={14} color={colors.white} style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>{formatDuration(item.duration)}</Text>
          </View>
          <Text style={styles.cardDate}>{dateFormatted}</Text>
        </View>

        <Text style={styles.previewText} numberOfLines={3}>
          {preview}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.viewMore}>View full summary</Text>
          <Icon name="arrow-forward" size={16} color={colors.primaryBlue} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transcripts..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Date Selectors */}
        <View style={styles.pickerSection}>
          {/* Year Row */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[null, ...YEARS]}
            keyExtractor={item => String(item ?? 'all-years')}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => {
              const isActive = selectedYear === item;
              return (
                <TouchableOpacity
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedYear(item)}>
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {item ?? 'All Years'}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* Month Row */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]}
            keyExtractor={item => String(item ?? 'all-months')}
            contentContainerStyle={[styles.filterList, { paddingTop: 0 }]}
            renderItem={({ item }) => {
              const isActive = selectedMonth === item;
              return (
                <TouchableOpacity
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedMonth(item)}>
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {item === null ? 'All Months' : MONTH_NAMES[item]}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>

      <FlatList
        data={filteredEntries}
        keyExtractor={item => item.id}
        renderItem={renderHistoryCard}
        contentContainerStyle={filteredEntries.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContent}>
            <Icon 
              name={(searchQuery || selectedMonth !== null || selectedYear !== null) ? "search-outline" : "document-text-outline"} 
              size={64} 
              color={colors.border} 
            />
            <Text style={styles.emptyText}>
              {(searchQuery || selectedMonth !== null || selectedYear !== null) ? 'No matching results' : 'No transcriptions yet'}
            </Text>
            {(searchQuery || selectedMonth !== null || selectedYear !== null) && (
              <TouchableOpacity 
                style={styles.resetBtn}
                onPress={() => { setSearchQuery(''); setSelectedMonth(null); setSelectedYear(null); }}>
                <Text style={styles.resetBtnText}>Clear all filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
      <CustomAlert config={alertConfig} onDismiss={hideAlert} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Sleek off-white
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 10,
    padding: 0,
  },
  pickerSection: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: colors.white,
    marginRight: 10,
    // Soft shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    // Premium shadow
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBlue,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  cardDate: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  previewText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  viewMore: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryBlue,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primaryBlue,
    borderRadius: 12,
  },
  resetBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
});
