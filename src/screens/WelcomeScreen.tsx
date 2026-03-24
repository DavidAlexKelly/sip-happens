import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { Colors } from '../styles/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
};

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.95, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="menu" size={24} color={Colors.onSurface} style={{ opacity: 0.7 }} />
        <LinearGradient
          colors={[Colors.primary, Colors.primaryContainer]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.titleGradient}
        >
          <Text style={styles.headerTitle}>ELECTRIC NOCTURNE</Text>
        </LinearGradient>
        <Ionicons name="person-circle-outline" size={24} color={Colors.onSurface} style={{ opacity: 0.7 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.eyebrow}>Experience the Pulse</Text>
          <Text style={styles.heroLine1}>ELECTRIC</Text>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer, Colors.secondary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.gradientTextWrapper}
          >
            <Text style={styles.heroLine2}>NOCTURNE</Text>
          </LinearGradient>
          <View style={styles.divider} />
        </Animated.View>

        {/* CTAs */}
        <Animated.View style={[styles.ctas, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={() => navigation.navigate('Players')} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>START GAME</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Modes')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>GAME MODES</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>SETTINGS</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Text style={styles.tagline}>
          Enter the neon void. A high-energy social challenge where only the luminous survive.
        </Text>

        {/* Feature tiles */}
        <View style={styles.tiles}>
          <View style={[styles.tile, styles.tileWide]}>
            <Ionicons name="flash" size={60} color={Colors.primary} style={styles.tileWatermark} />
            <Text style={styles.tileHeadline}>DYNAMIC MODES</Text>
            <Text style={styles.tileBody}>5 high-energy modes. Social, Dare, Truth, Drink, or Wild — your crew sets the vibe.</Text>
          </View>
          <View style={styles.tileRow}>
            <View style={[styles.tile, styles.tileHalf]}>
              <Ionicons name="people" size={28} color={Colors.secondary} style={{ marginBottom: 8 }} />
              <Text style={styles.tileHeadline}>8 PLAYERS</Text>
              <Text style={styles.tileBodySmall}>Max squad</Text>
            </View>
            <View style={[styles.tile, styles.tileHalf]}>
              <Ionicons name="wine" size={28} color={Colors.tertiary} style={{ marginBottom: 8 }} />
              <Text style={styles.tileHeadline}>100+</Text>
              <Text style={styles.tileBodySmall}>Challenges</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav current="play" navigation={navigation} />
    </SafeAreaView>
  );
}

export function BottomNav({
  current,
  navigation,
}: {
  current: string;
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
}) {
  const tabs = [
    { id: 'play', label: 'PLAY', icon: 'game-controller', screen: 'Welcome' },
    { id: 'modes', label: 'MODES', icon: 'layers', screen: 'Modes' },
    { id: 'players', label: 'PLAYERS', icon: 'people', screen: 'Players' },
    { id: 'shop', label: 'SHOP', icon: 'flame', screen: null },
  ] as const;

  return (
    <View style={styles.navContainer}>
      {tabs.map(tab => {
        const isActive = tab.id === current;
        if (isActive) {
          return (
            <LinearGradient
              key={tab.id}
              colors={[Colors.primary, Colors.primaryContainer]}
              style={styles.navItemActive}
            >
              <Ionicons name={tab.icon as any} size={22} color={Colors.onPrimary} style={{ fontVariationSettings: "'FILL' 1" }} />
              <Text style={[styles.navLabel, { color: Colors.onPrimary }]}>{tab.label}</Text>
            </LinearGradient>
          );
        }
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => tab.screen && navigation.navigate(tab.screen as any)}
            activeOpacity={0.7}
          >
            <Ionicons name={tab.icon as any} size={22} color={Colors.onSurface} style={{ opacity: 0.4 }} />
            <Text style={styles.navLabel}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: 'rgba(14,14,17,0.9)',
  },
  titleGradient: { borderRadius: 4 },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 17, letterSpacing: -0.5, color: Colors.onPrimary,
    paddingHorizontal: 4,
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
  hero: { alignItems: 'center', marginTop: 48, marginBottom: 48 },
  eyebrow: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 4, color: Colors.secondary,
    textTransform: 'uppercase', marginBottom: 16,
  },
  heroLine1: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 72, color: Colors.onSurface,
    lineHeight: 72, letterSpacing: -3,
  },
  gradientTextWrapper: { borderRadius: 4, marginTop: -4 },
  heroLine2: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 72, lineHeight: 72, letterSpacing: -3,
    color: Colors.onPrimary, paddingHorizontal: 4,
  },
  divider: {
    width: 80, height: 2, borderRadius: 2, marginTop: 24,
    backgroundColor: Colors.primary, opacity: 0.6,
  },
  ctas: { gap: 12, marginBottom: 40 },
  primaryBtn: {
    paddingVertical: 20, borderRadius: 999, alignItems: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  primaryBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18, letterSpacing: 2, color: Colors.onPrimary, textTransform: 'uppercase',
  },
  secondaryRow: { flexDirection: 'row', gap: 12 },
  secondaryBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
  },
  secondaryBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11, letterSpacing: 2, color: Colors.onSurface, textTransform: 'uppercase',
  },
  tagline: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center',
    lineHeight: 20, opacity: 0.6, marginBottom: 40, paddingHorizontal: 16,
  },
  tiles: { gap: 12 },
  tileWide: { position: 'relative', overflow: 'hidden' },
  tileRow: { flexDirection: 'row', gap: 12 },
  tileHalf: { flex: 1 },
  tile: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16, padding: 24,
  },
  tileWatermark: { position: 'absolute', top: 8, right: 8, opacity: 0.08 },
  tileHeadline: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16, color: Colors.primary, marginBottom: 6,
  },
  tileBody: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 18,
  },
  tileBodySmall: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 11, color: Colors.onSurfaceVariant,
  },
  navContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingTop: 12, paddingBottom: 32, paddingHorizontal: 16,
    backgroundColor: 'rgba(14,14,17,0.9)',
    borderTopWidth: 1, borderTopColor: 'rgba(72,71,75,0.2)',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  navItemActive: {
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, gap: 2,
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  navItem: {
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 10, gap: 2,
  },
  navLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 8, letterSpacing: 1.5, color: Colors.onSurface, textTransform: 'uppercase', opacity: 0.4,
  },
});
