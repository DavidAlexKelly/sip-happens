// src/utils/ageGate.ts
// Persists the age-gate confirmation so it only shows once per install, not
// once per app launch. Deliberately separate from GameContext's state — this
// needs to be readable before the rest of the app (and its providers) mount.

import AsyncStorage from '@react-native-async-storage/async-storage';

const AGE_CONFIRMED_KEY = '@sip_happens_age_confirmed_v1';

export async function isAgeConfirmed(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(AGE_CONFIRMED_KEY)) === 'true';
  } catch {
    // Storage unavailable — fail closed (show the gate) rather than skip it.
    return false;
  }
}

export async function setAgeConfirmed(): Promise<void> {
  try {
    await AsyncStorage.setItem(AGE_CONFIRMED_KEY, 'true');
  } catch {
    // Best-effort. If this fails to persist, the gate just shows again next
    // launch — annoying but never breaks the app.
  }
}
