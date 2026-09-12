// src/components/QuitSheet.tsx
// The "leave the game?" sheet, shared by every mode.
//
// Was duplicated five times with slightly different wording and, in two modes,
// a different set of buttons. Modes that keep a score offer "End Game" (stop
// here, see the results); modes that don't just leave.

import React from 'react';
import {
  View, Text, StyleSheet, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, Jack, Type } from '../styles/theme';
import { JackButton } from './jack';

type Props = {
  visible: boolean;
  title: string;
  subtitle: string;
  onDismiss: () => void;
  onQuitToMenu: () => void;
  /**
   * Provided by modes with results worth seeing. Omit it and the sheet offers
   * only "Keep Playing" and "Quit" — Truth or Dare and Trivia have nothing to
   * show, so offering results there would be a dead end.
   */
  onEndGame?: () => void;
  endLabel?: string;
};

export default function QuitSheet({
  visible, title, subtitle, onDismiss, onQuitToMenu, onEndGame, endLabel = 'End Game',
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <JackButton label="Keep Playing" size="medium" onPress={onDismiss} />
            </View>
            <View style={{ flex: 1 }}>
              <JackButton
                label={onEndGame ? endLabel : 'Quit'}
                size="medium"
                variant="ghost"
                onPress={onEndGame ?? onQuitToMenu}
              />
            </View>
          </View>

          {onEndGame && (
            <JackButton
              label="Quit to Menu"
              size="small"
              variant="ghost"
              onPress={onQuitToMenu}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,6,32,0.72)' },
  sheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: Jack.border, borderTopColor: Colors.ink,
    padding: 22, paddingBottom: 34, gap: 12,
  },
  title: { fontFamily: Type.display, fontSize: 20, color: Colors.onSurface },
  subtitle: {
    fontFamily: Type.body, fontSize: 13.5, lineHeight: 19,
    color: Colors.onSurfaceVariant,
  },
  row: { flexDirection: 'row', gap: 12 },
});
