import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  StatusBar,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {
  getAllEntries,
  deleteEntry,
  type HistoryEntry,
} from '../store/historyStore';
import { formatDuration } from '../utils/formatDuration';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = StackNavigationProp<RootStackParamList, 'History'>;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const PRIMARY = '#4F7FFF';
const BG = '#F4F6FB';

// ── Beautiful dropdown component ────────────────────────────────────────────
interface DropdownItem { label: string; value: number | null }

function Dropdown({
  label,
  items,
  selected,
  onSelect,
}: {
  label: string;
  items: DropdownItem[];
  selected: number | null;
  onSelect: (v: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = items.find(i => i.value === selected)?.label ?? label;
  const isActive = selected !== null;

  return (
    <>
      {/* Trigger button */}
      <TouchableOpacity
        style={[styles.dropBtn, isActive && styles.dropBtnActive]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}>
        <Text style={[styles.dropBtnText, isActive && styles.dropBtnTextActive]}>
          {selectedLabel}
        </Text>
        <Icon
          name="chevron-down"
          size={14}
          color={isActive ? '#FFFFFF' : '#666'}
        />
      </TouchableOpacity>

      {/* Modal dropdown */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.dropSheet} onPress={e => e.stopPropagation()}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>{label}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {items.map(item => {
                const active = selected === item.value;
                return (
                  <TouchableOpacity
                    key={String(item.value)}
                    style={[styles.sheetItem, active && styles.sheetItemActive]}
                    onPress={() => {
                      onSelect(item.value);
                      setOpen(false);
                    }}
                    activeOpacity={0.7}>
                    <Text style={[styles.sheetItemText, active && styles.sheetItemTextActive]}>
                      {item.label}
                    </Text>
                    {active && (
                      <Icon name="checkmark-circle" size={20} color={PRIMARY} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const { config: alertConfig, showAlert, hideAlert } = useCustomAlert();

  const YEARS = useMemo(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2];
  }, []);

  const yearItems: DropdownItem[] = useMemo(() => [
    { label: 'All Years', value: null },
    ...YEARS.map(y => ({ label: String(y), value: y })),
  ], [YEARS]);

  const monthItems: DropdownItem[] = [
    { label: 'All Months', value: null },
    ...MONTH_NAMES.map((m, i) => ({ label: m, value: i })),
  ];

  const load = useCallback(async () => {
    const data = await getAllEntries();
    setEntries(data);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter(entry => {
      let entryYear: number | null = null;
      let entryMonth: number | null = null;
      if (entry.createdAt) {
        try {
          const d = new Date(entry.createdAt);
          if (!isNaN(d.getTime())) {
            entryYear = d.getFullYear();
            entryMonth = d.getMonth();
          }
        } catch { /* skip */ }
      }
      const matchesYear = selectedYear === null || entryYear === selectedYear;
      const matchesMonth = selectedMonth === null || entryMonth === selectedMonth;
      if (!matchesYear || !matchesMonth) { return false; }
      if (!q) { return true; }
      const fullContent = [
        entry.transcript,
        entry.fullSummary,
        entry.fullTranslation,
        ...(entry.bullets || []),
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
        onPress: async () => { await deleteEntry(id); load(); },
      },
    ]);
  }

  const isFiltering = !!(searchQuery || selectedMonth !== null || selectedYear !== null);

  function renderCard({ item, index }: { item: HistoryEntry; index: number }) {
    const preview = item.bullets?.[0] ?? (item.transcript || '').slice(0, 100);
    const dateObj = new Date(item.createdAt);
    const dateFormatted = dateObj.toLocaleDateString('default', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    const timeFormatted = dateObj.toLocaleTimeString('default', {
      hour: '2-digit', minute: '2-digit',
    });
    const bulletCount = item.bullets?.length ?? 0;

    return (
      <TouchableOpacity
        style={[styles.card, { marginTop: index === 0 ? 16 : 0 }]}
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
        activeOpacity={0.92}>

        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <View style={styles.iconCircle}>
              <Icon name="mic" size={16} color={PRIMARY} />
            </View>
            <View>
              <Text style={styles.cardDateText}>{dateFormatted}</Text>
              <Text style={styles.cardTimeText}>{timeFormatted}</Text>
            </View>
          </View>
          <View style={styles.durationBadge}>
            <Icon name="time-outline" size={12} color={PRIMARY} />
            <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.previewText} numberOfLines={3}>
          {preview}
        </Text>

        <View style={styles.cardFooter}>
          {bulletCount > 0 && (
            <View style={styles.bulletsBadge}>
              <Icon name="list-outline" size={12} color="#666" />
              <Text style={styles.bulletsText}>{bulletCount} bullet{bulletCount !== 1 ? 's' : ''}</Text>
            </View>
          )}
          <View style={styles.viewMoreBtn}>
            <Text style={styles.viewMoreText}>Open</Text>
            <Icon name="chevron-forward" size={14} color={PRIMARY} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>History</Text>
          {filteredEntries.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filteredEntries.length}</Text>
            </View>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transcripts..."
            placeholderTextColor="#AAAAAA"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close-circle" size={18} color="#BBBBBB" />
            </TouchableOpacity>
          )}
        </View>

        {/* Dropdowns row */}
        <View style={styles.dropRow}>
          <View style={styles.dropItem}>
            <Dropdown
              label="All Years"
              items={yearItems}
              selected={selectedYear}
              onSelect={setSelectedYear}
            />
          </View>
          <View style={styles.dropItem}>
            <Dropdown
              label="All Months"
              items={monthItems}
              selected={selectedMonth}
              onSelect={setSelectedMonth}
            />
          </View>
          {isFiltering && (
            <TouchableOpacity
              style={styles.clearPill}
              onPress={() => { setSearchQuery(''); setSelectedMonth(null); setSelectedYear(null); }}>
              <Icon name="close" size={13} color="#FF5A5F" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── List ── */}
      <FlatList
        data={filteredEntries}
        keyExtractor={item => item.id}
        renderItem={renderCard}
        contentContainerStyle={
          filteredEntries.length === 0 ? styles.emptyContainer : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContent}>
            <LinearGradient
              colors={['#EEF3FF', '#F4F6FB']}
              style={styles.emptyIconWrap}>
              <Icon
                name={isFiltering ? 'search-outline' : 'mic-outline'}
                size={36}
                color={PRIMARY}
              />
            </LinearGradient>
            <Text style={styles.emptyTitle}>
              {isFiltering ? 'No results found' : 'No transcriptions yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isFiltering
                ? 'Try adjusting your search or filters'
                : 'Share a WhatsApp voice note to get started'}
            </Text>
            {isFiltering && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => { setSearchQuery(''); setSelectedMonth(null); setSelectedYear(null); }}>
                <Text style={styles.clearBtnText}>Clear filters</Text>
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
  container: { flex: 1, backgroundColor: BG },

  /* Header */
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 10,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: '#EEF3FF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
  },

  /* Search */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F6FB',
    marginHorizontal: 20,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111111',
    marginLeft: 10,
    padding: 0,
  },

  /* Dropdown row */
  dropRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    alignItems: 'center',
  },
  dropItem: {
    flex: 1,
  },

  /* Dropdown trigger button */
  dropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F6FB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E4EE',
  },
  dropBtnActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  dropBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555555',
    flex: 1,
  },
  dropBtnTextActive: {
    color: '#FFFFFF',
  },

  /* Clear pill */
  clearPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },

  /* Modal backdrop */
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },

  /* Dropdown sheet */
  dropSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 36,
    paddingHorizontal: 20,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  sheetItemActive: {
    backgroundColor: '#EEF3FF',
  },
  sheetItemText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  sheetItemTextActive: {
    color: PRIMARY,
    fontWeight: '700',
  },

  /* List */
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1A2B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F2F8',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
  },
  cardTimeText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF3FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY,
  },
  divider: {
    height: 1,
    backgroundColor: '#F4F6FB',
    marginBottom: 12,
  },
  previewText: {
    fontSize: 14,
    color: '#444444',
    lineHeight: 21,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bulletsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4F6FB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bulletsText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
  },

  /* Empty */
  emptyContainer: { flex: 1 },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  clearBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 11,
    backgroundColor: PRIMARY,
    borderRadius: 20,
  },
  clearBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
