// App.tsx
// Release-readiness additions on top of the existing monetization setup:
//   • Age gate — AgeGateScreen is the initial route until the person has
//     confirmed once (persisted via src/utils/ageGate.ts). Nothing else
//     mounts its effects before that: Ads.init() no longer fires blindly on
//     app mount, it fires only after confirmation (see handleAgeConfirmed).
//   • ATT before ads — on iOS, requestTrackingPermission() runs and resolves
//     BEFORE Ads.init(), so the very first ad request already respects the
//     person's tracking choice instead of defaulting to personalized ads
//     for a few seconds.
//   • Legal screen registered — reachable from PlayScreen's header icon.
//
// Everything else (fonts, gestureEnabled:false on Game/GameOver) is
// unchanged from the existing setup.

import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  PlusJakartaSans_800ExtraBold_Italic,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';

import { GameProvider } from './src/components/GameContext';
import { Ads } from './src/monetization/ads';
import { isAgeConfirmed } from './src/utils/ageGate';
import { requestTrackingPermission } from './src/utils/tracking';
import { RootStackParamList } from './src/navigation/types';

// Gate
import AgeGateScreen from './src/screens/AgeGateScreen';

// Bottom nav screens
import PlayScreen  from './src/screens/PlayScreen';
import DecksScreen from './src/screens/DecksScreen';
import CardsScreen from './src/screens/CardsScreen';

// Setup flow (no bottom nav)
import DeckSelectScreen from './src/screens/DeckSelectScreen';
import PlayersScreen    from './src/screens/PlayersScreen';
import GameScreen       from './src/screens/GameScreen';
import GameOverScreen   from './src/screens/GameOverScreen';

// Legal
import LegalScreen from './src/screens/LegalScreen';

import { Colors } from './src/styles/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    PlusJakartaSans_800ExtraBold_Italic,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_700Bold,
  });

  // Resolved before first render of the navigator: has this install already
  // confirmed the age gate? null = still checking AsyncStorage.
  const [ageConfirmed, setAgeConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    isAgeConfirmed().then(setAgeConfirmed);
  }, []);

  /**
   * Runs once, right after the person taps confirm on the age gate (or
   * immediately on launch if a prior install already confirmed it).
   * ATT is requested first so the flag is known before the first ad loads.
   */
  const initMonetization = useCallback(async () => {
    const personalizedAdsAllowed = await requestTrackingPermission();
    Ads.init(personalizedAdsAllowed);
  }, []);

  // If a returning user already confirmed age on a previous launch, start
  // monetization immediately — the gate screen won't mount to trigger it.
  useEffect(() => {
    if (ageConfirmed === true) {
      initMonetization();
    }
  }, [ageConfirmed, initMonetization]);

  if (!fontsLoaded || ageConfirmed === null) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <GameProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName={ageConfirmed ? 'Play' : 'AgeGate'}
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: 'fade_from_bottom',
            }}
          >
            <Stack.Screen
              name="AgeGate"
              options={{ gestureEnabled: false }}
            >
              {(props) => <AgeGateScreen {...props} onConfirmed={initMonetization} />}
            </Stack.Screen>
            <Stack.Screen name="Play"       component={PlayScreen} />
            <Stack.Screen name="Decks"      component={DecksScreen} />
            <Stack.Screen name="Cards"      component={CardsScreen} />
            <Stack.Screen name="DeckSelect" component={DeckSelectScreen} />
            <Stack.Screen name="Players"    component={PlayersScreen} />
            <Stack.Screen
              name="Game"
              component={GameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="GameOver"
              component={GameOverScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="Legal" component={LegalScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </GameProvider>
    </SafeAreaProvider>
  );
}
