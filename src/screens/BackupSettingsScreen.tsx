import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import DocumentPicker from 'react-native-document-picker';
import { getAllEntries, saveEntry, clearAll } from '../store/historyStore';
import colors from '../theme/colors';
import { showToast } from '../utils/toast';

export default function BackupSettingsScreen() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const entries = await getAllEntries();
      if (entries.length === 0) {
        Alert.alert('No data', 'You have no transcription history to export.');
        return;
      }

      const jsonData = JSON.stringify(entries, null, 2);
      const path = `${RNFS.CachesDirectoryPath}/whatscribe_backup_${Date.now()}.json`;
      
      await RNFS.writeFile(path, jsonData, 'utf8');

      await Share.open({
        url: `file://${path}`,
        type: 'application/json',
        title: 'Export History',
        filename: 'whatscribe_backup',
      });
      
      showToast('Backup file generated');
    } catch (error) {
       console.log('Export error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });

      setLoading(true);
      
      const fileContent = await RNFS.readFile(res.uri, 'utf8');
      const importedData = JSON.parse(fileContent);

      if (!Array.isArray(importedData)) {
        throw new Error('Invalid backup file format');
      }

      // Merge Logic: Get existing, merge by ID to avoid duplicates
      const currentEntries = await getAllEntries();
      const currentIds = new Set(currentEntries.map(e => e.id));
      
      let importedCount = 0;
      for (const entry of importedData) {
        if (!currentIds.has(entry.id)) {
          await saveEntry(entry);
          importedCount++;
        }
      }

      Alert.alert(
        'Success',
        `Successfully imported ${importedCount} new transcriptions.`
      );
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled
      } else {
        Alert.alert('Import Failed', 'Please select a valid Whatscribe backup file.');
        console.warn('Import error:', err);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleClearHistory() {
     Alert.alert(
      'Clear All History',
      'This will permanently delete all local transcriptions. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All', 
          style: 'destructive', 
          onPress: async () => {
             await clearAll();
             showToast('History cleared');
          } 
        }
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="cloud-upload-outline" size={48} color={colors.primaryBlue} />
        <Text style={styles.title}>Backup & Restore</Text>
        <Text style={styles.subtitle}>
          Since we don't store your data on our servers, you can manually export your history to keep it safe.
        </Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={handleExport}
          disabled={loading}>
          <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
            <Icon name="download-outline" size={24} color="#0369A1" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Export History</Text>
            <Text style={styles.cardDesc}>Save your transcriptions as a backup file.</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.border} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={handleImport}
          disabled={loading}>
          <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
            <Icon name="cloud-download-outline" size={24} color="#15803D" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Import History</Text>
            <Text style={styles.cardDesc}>Restore transcriptions from a backup file.</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.border} />
        </TouchableOpacity>
      </View>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>
        <TouchableOpacity 
          style={styles.dangerCard}
          onPress={handleClearHistory}>
          <Icon name="trash-outline" size={20} color="#EF4444" />
          <Text style={styles.dangerText}>Permanently Clear History</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
          <Text style={styles.loaderText}>Processing your data...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  section: {
    padding: 20,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dangerZone: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 12,
    marginLeft: 4,
  },
  dangerCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  dangerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
