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

import ErrorBoundary from './src/components/ErrorBoundary';
import { GameProvider } from './src/components/GameContext';
import { TriviaProvider } from './src/components/TriviaContext';
import { DealerProvider } from './src/components/DealerContext';
import { TraitorsProvider } from './src/components/TraitorsContext';
import { RingProvider } from './src/components/RingContext';
import { Ads } from './src/monetization/ads';
import { isAgeConfirmed } from './src/utils/ageGate';
import { runLegacyMigration } from './src/data/packStorage';
import { requestTrackingPermission } from './src/utils/tracking';
import { RootStackParamList } from './src/navigation/types';

// Gate
import AgeGateScreen from './src/screens/AgeGateScreen';

// Bottom nav screens
import PlayScreen  from './src/screens/PlayScreen';

// Shared content library
import PackListScreen   from './src/screens/PackListScreen';
import PackEditorScreen from './src/screens/PackEditorScreen';
import ItemLibraryScreen from './src/screens/ItemLibraryScreen';

// Truth or Dare setup flow (no bottom nav)
import DeckSelectScreen from './src/screens/DeckSelectScreen';
import PlayersScreen    from './src/screens/PlayersScreen';
import GameScreen       from './src/screens/GameScreen';
import GameOverScreen   from './src/screens/GameOverScreen';

// Trivia
import TriviaSetupScreen from './src/screens/TriviaSetupScreen';
import TriviaGameScreen  from './src/screens/TriviaGameScreen';
import TriviaOverScreen  from './src/screens/TriviaOverScreen';

// Screw the Dealer!
import DealerSetupScreen from './src/screens/DealerSetupScreen';
import DealerGameScreen  from './src/screens/DealerGameScreen';
import DealerOverScreen  from './src/screens/DealerOverScreen';

// Word Traitors!
import TraitorsSetupScreen from './src/screens/TraitorsSetupScreen';
import TraitorsGameScreen  from './src/screens/TraitorsGameScreen';
import TraitorsOverScreen  from './src/screens/TraitorsOverScreen';

// Ring of Fire
import RingSetupScreen from './src/screens/RingSetupScreen';
import RingGameScreen  from './src/screens/RingGameScreen';
import RingOverScreen  from './src/screens/RingOverScreen';
import RingSetEditorScreen from './src/screens/RingSetEditorScreen';

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

  // One-time move of the legacy @nekkit_* decks and cards into the scoped
  // pack store. Deliberately fire-and-forget: it is idempotent, it never
  // overwrites newer data, and it leaves the old keys in place, so a failure
  // here must not delay or block the app booting.
  useEffect(() => {
    runLegacyMigration().catch(() => {});
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
      <ErrorBoundary>
      <GameProvider>
        <TriviaProvider>
        <DealerProvider>
        <TraitorsProvider>
        <RingProvider>
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
            <Stack.Screen name="DeckSelect" component={DeckSelectScreen} />

            {/* Content library — shared by every mode that has one */}
            <Stack.Screen name="PackList"    component={PackListScreen} />
            <Stack.Screen name="PackEditor"  component={PackEditorScreen} />
            <Stack.Screen name="ItemLibrary" component={ItemLibraryScreen} />
            <Stack.Screen
              name="Players"
              component={PlayersScreen}
              initialParams={{ next: 'Game' }}
            />
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

            {/* Trivia — same no-swipe-out treatment as Game/GameOver */}
            <Stack.Screen name="TriviaSetup" component={TriviaSetupScreen} />
            <Stack.Screen
              name="TriviaGame"
              component={TriviaGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="TriviaOver"
              component={TriviaOverScreen}
              options={{ gestureEnabled: false }}
            />

            {/* Screw the Dealer! */}
            <Stack.Screen name="DealerSetup" component={DealerSetupScreen} />
            <Stack.Screen
              name="DealerGame"
              component={DealerGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="DealerOver"
              component={DealerOverScreen}
              options={{ gestureEnabled: false }}
            />

            {/* Word Traitors! */}
            <Stack.Screen name="TraitorsSetup" component={TraitorsSetupScreen} />
            <Stack.Screen
              name="TraitorsGame"
              component={TraitorsGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="TraitorsOver"
              component={TraitorsOverScreen}
              options={{ gestureEnabled: false }}
            />

            {/* Ring of Fire */}
            <Stack.Screen name="RingSetup" component={RingSetupScreen} />
            <Stack.Screen name="RingSetEditor" component={RingSetEditorScreen} />
            <Stack.Screen
              name="RingGame"
              component={RingGameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="RingOver"
              component={RingOverScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="Legal" component={LegalScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        </RingProvider>
        </TraitorsProvider>
        </DealerProvider>
        </TriviaProvider>
      </GameProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
