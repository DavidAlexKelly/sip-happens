// src/screens/LegalScreen.tsx
// Both stores require the privacy policy to be reachable from INSIDE the
// app, not just on the store listing page. This is that screen — also
// carries Terms of Use, support contact, and the app version (useful for
// support requests and required by some review checklists).

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { Colors, Jack, Type } from '../styles/theme';
import { APP_NAME, PRIVACY_URL, TERMS_URL, SUPPORT_EMAIL, MIN_AGE } from '../branding';
import { JackIconButton } from '../components/jack';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Legal'>;
};

const ROWS = [
  { icon: 'shield-checkmark' as const, label: 'Privacy Policy', action: () => Linking.openURL(PRIVACY_URL) },
  { icon: 'document-text' as const,    label: 'Terms of Use',   action: () => Linking.openURL(TERMS_URL) },
  { icon: 'mail' as const,             label: 'Contact Support', action: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`) },
];

export default function LegalScreen({ navigation }: Props) {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const build = Constants.expoConfig?.ios?.buildNumber
    ?? String(Constants.expoConfig?.android?.versionCode ?? '1');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <JackIconButton icon="arrow-back" onPress={() => navigation.goBack()} size={42} />
        <Text style={styles.headerTitle}>LEGAL & SUPPORT</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.rowList}>
          {ROWS.map(row => (
            <TouchableOpacity
              key={row.label}
              onPress={row.action}
              activeOpacity={0.8}
              style={styles.row}
            >
              <View style={styles.rowIcon}>
                <Ionicons name={row.icon} size={18} color={Colors.onSurface} />
              </View>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Ionicons name="open-outline" size={16} color={Colors.outline} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.disclaimer}>
          {APP_NAME} is intended for adults of legal drinking age ({MIN_AGE}+) and
          promotes drinking responsibly. Please drink water, know your limits,
          and never drink and drive.
        </Text>

        <Text style={styles.version}>Version {version} ({build})</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerTitle: { fontFamily: Type.display, fontSize: 13, letterSpacing: 2, color: Colors.onSurfaceVariant },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

  rowList: { gap: 12, marginTop: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: Jack.radius, borderWidth: 2.5, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 14, paddingHorizontal: 14,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontFamily: Type.bodyBold, fontSize: 14, color: Colors.onSurface },

  disclaimer: {
    fontFamily: Type.body, fontSize: 12.5, lineHeight: 19, color: Colors.onSurfaceVariant,
    marginTop: 28,
  },
  version: {
    fontFamily: Type.bodyMedium, fontSize: 11, color: Colors.outline,
    textAlign: 'center', marginTop: 24,
  },
});
