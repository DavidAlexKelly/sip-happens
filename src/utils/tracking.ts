// src/utils/tracking.ts
// iOS App Tracking Transparency (ATT). AdMob's IDFA-based personalized ads
// need this system prompt on iOS 14.5+ — without it, ads still work, they're
// just non-personalized (lower revenue, but nothing breaks). Android has no
// ATT equivalent, so this is a no-op there.
//
// SETUP REQUIRED — this file imports a package not yet in package.json:
//   npx expo install expo-tracking-transparency
// Use `expo install`, not `npm install`, so you get the version matched to
// your Expo SDK. Then rebuild your dev client (this is a native module, same
// as react-native-google-mobile-ads — it won't work in Expo Go).
//
// Your app.json already carries the Info.plist usage string for this prompt
// via the react-native-google-mobile-ads plugin's `userTrackingUsageDescription`
// option, so you do NOT need to add expo-tracking-transparency's own config
// plugin too — that would risk writing NSUserTrackingUsageDescription twice.
// Just install the JS package; this file only uses its runtime API.

import { Platform } from 'react-native';
import {
  requestTrackingPermissionsAsync,
  getTrackingPermissionsAsync,
} from 'expo-tracking-transparency';

/**
 * Resolves true if personalized ads are allowed (tracking granted, or
 * there's no ATT concept on this platform), false if the person should only
 * see non-personalized ads.
 */
export async function requestTrackingPermission(): Promise<boolean> {
  if (Platform.OS !== 'ios') return true;

  try {
    const current = await getTrackingPermissionsAsync();
    if (current.status === 'granted') return true;
    if (current.status === 'denied' || current.status === 'restricted') return false;

    // status === 'undetermined' — show the system prompt.
    const result = await requestTrackingPermissionsAsync();
    return result.status === 'granted';
  } catch {
    // Anything unexpected (simulator quirks, etc.) — fail to the safer,
    // privacy-preserving default rather than crash.
    return false;
  }
}
