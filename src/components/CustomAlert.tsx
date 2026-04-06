import React, {useState} from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import colors from '../theme/colors';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
  title: string;
  message: string;
  buttons?: AlertButton[];
}

interface CustomAlertProps {
  config: AlertConfig | null;
  onDismiss: () => void;
}

export function useCustomAlert() {
  const [config, setConfig] = useState<AlertConfig | null>(null);

  function showAlert(title: string, message: string, buttons?: AlertButton[]) {
    setConfig({title, message, buttons});
  }

  function hideAlert() {
    setConfig(null);
  }

  return {config, showAlert, hideAlert};
}

export default function CustomAlert({config, onDismiss}: CustomAlertProps) {
  if (!config) return null;

  const buttons: AlertButton[] = config.buttons ?? [{text: 'OK'}];
  const isSingle = buttons.length === 1;

  function handlePress(btn: AlertButton) {
    onDismiss();
    btn.onPress?.();
  }

  return (
    <Modal
      visible={!!config}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.message}>{config.message}</Text>

          <View style={styles.divider} />

          <View style={[styles.buttonRow, isSingle && styles.buttonRowSingle]}>
            {buttons.map((btn, i) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.button,
                    isSingle && styles.buttonFull,
                    !isSingle && i === 0 && styles.buttonLeft,
                    !isSingle && i === buttons.length - 1 && styles.buttonRight,
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive,
                    !isCancel && !isDestructive && styles.buttonPrimary,
                  ]}
                  onPress={() => handlePress(btn)}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel && styles.buttonTextCancel,
                      isDestructive && styles.buttonTextWhite,
                      !isCancel && !isDestructive && styles.buttonTextWhite,
                    ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingTop: 28,
    paddingHorizontal: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: colors.textSubtle,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: -24,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  buttonRowSingle: {
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  buttonFull: {
    flex: 1,
  },
  buttonLeft: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  buttonRight: {
    flex: 1,
  },
  buttonPrimary: {
    // transparent bg — styled by text color
  },
  buttonCancel: {
    // transparent bg
  },
  buttonDestructive: {
    // transparent bg
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextWhite: {
    color: colors.primaryBlue,
  },
  buttonTextCancel: {
    color: colors.textSecondary,
    fontWeight: '400',
  },
  buttonTextDestructive: {
    color: '#E53935',
    fontWeight: '600',
  },
});
