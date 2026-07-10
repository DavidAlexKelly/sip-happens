// src/screens/AgeGateScreen.tsx
// First-launch gate: confirm legal drinking age before anything else loads.
// This is the FIRST screen in the stack when age isn't yet confirmed (see
// App.tsx), and it's the trigger point for ATT + ads init — both fire only
// after the person confirms, never before.
//
// Decline path: shows a dead-end screen with no way forward. Apple prohibits
// apps from calling exit() programmatically, so on iOS this is genuinely a
// wall, not a fake one — that's the correct, store-compliant behavior for an
// age-gated app. Android gets a real Exit button since BackHandler.exitApp()
// is allowed there.

import React, { useState } from 'react';
import { View, Text, StyleSheet, Linking, Platform, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Jack, Type } from '../styles/theme';
import { MIN_AGE, PRIVACY_URL, TERMS_URL } from '../branding';
import { setAgeConfirmed } from '../utils/ageGate';
import Logo from '../components/Logo';
import { JackButton, JackPanel, ConfettiDots } from '../components/jack';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AgeGate'>;
  /** Runs after confirmation — App.tsx wires this to the ATT + ads sequence. */
  onConfirmed: () => void;
};

export default function AgeGateScreen({ navigation, onConfirmed }: Props) {
  const [declined, setDeclined] = useState(false);

  const handleConfirm = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setAgeConfirmed();
    onConfirmed();
    navigation.replace('Play');
  };

  const handleDecline = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setDeclined(true);
  };

  if (declined) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.declinedContent}>
          <JackPanel color={Colors.surfaceContainer} faceStyle={styles.declinedPanel}>
            <Text style={styles.declinedTitle}>Come back later.</Text>
            <Text style={styles.declinedBody}>
              Sip Happens is only for people of legal drinking age. Thanks for
              being honest — we'll see you when you're old enough.
            </Text>
          </JackPanel>
          {Platform.OS === 'android' && (
            <JackButton
              label="Exit App"
              variant="ghost"
              size="medium"
              onPress={() => BackHandler.exitApp()}
              style={{ marginTop: 20 }}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ConfettiDots opacity={0.35} />

      <View style={styles.content}>
        <View style={styles.logoRow}>
          <Logo size="large" />
        </View>

        <JackPanel
          color={Colors.surfaceContainer}
          tilt={Jack.tiltL}
          shadow={Jack.shadowBig}
          faceStyle={styles.panelFace}
        >
          <Text style={styles.title}>QUICK CHECK{'\n'}BEFORE WE START.</Text>
          <Text style={styles.body}>
            Sip Happens is a drinking game for adults. You must be of legal
            drinking age in your country to play.
          </Text>
        </JackPanel>

        <View style={styles.actions}>
          <JackButton
            label={`I'm ${MIN_AGE}+ / Legal Age`}
            icon="checkmark"
            onPress={handleConfirm}
          />
          <JackButton
            label="I'm not old enough"
            variant="ghost"
            size="medium"
            onPress={handleDecline}
          />
        </View>

        <View style={styles.legalRow}>
          <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_URL)}>
            Privacy Policy
          </Text>
          <Text style={styles.legalDot}>·</Text>
          <Text style={styles.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>
            Terms of Use
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1, paddingHorizontal: 26, justifyContent: 'center', gap: 28,
  },
  logoRow: { alignItems: 'center' },
  panelFace: { padding: 26, gap: 12 },
  title: {
    fontFamily: Type.display, fontSize: 26, lineHeight: 32, color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: Type.body, fontSize: 14, lineHeight: 21, color: Colors.onSurfaceVariant,
  },
  actions: { gap: 12 },
  legalRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  legalLink: {
    fontFamily: Type.bodyMedium, fontSize: 12, color: Colors.outline,
    textDecorationLine: 'underline',
  },
  legalDot: { color: Colors.outlineVariant },

  declinedContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 26 },
  declinedPanel: { padding: 26, gap: 12, alignItems: 'center' },
  declinedTitle: {
    fontFamily: Type.display, fontSize: 22, color: Colors.onSurface, textAlign: 'center',
  },
  declinedBody: {
    fontFamily: Type.body, fontSize: 14, lineHeight: 21, color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
