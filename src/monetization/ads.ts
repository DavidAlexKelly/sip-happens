// src/monetization/ads.ts
// Interstitial ads for Sip Happens — two placements per game (midpoint + end).
//
// Requires: npm install react-native-google-mobile-ads
// This is a NATIVE module: it will NOT run in Expo Go. You already use
// expo-dev-client, so rebuild the dev client after installing
// (eas build --profile development) and it works.
//
// Design rules encoded here:
//   • FAIL OPEN — if an ad isn't loaded, consent was declined, or anything
//     throws, show() calls onDone() immediately. Ads can never block the game.
//   • Preload — the next interstitial starts loading as soon as the previous
//     one closes, so it's ready when the placement fires.
//   • Cooldown — a safety net so a bug can never chain-fire ads.
//   • Test ads in dev — Google bans accounts for clicking real ads in
//     development, so __DEV__ always uses Google's test unit ids.
//
// CHANGED for release readiness:
//   • init(personalizedAdsAllowed) — pass the App Tracking Transparency
//     result (see src/utils/tracking.ts). When false, every ad request sets
//     requestNonPersonalizedAdsOnly: true, so a "no" on the iOS tracking
//     prompt is actually honored rather than silently ignored.
//   • Call order matters: request ATT BEFORE Ads.init() so the flag is known
//     before the first ad loads. See App.tsx.

import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  AdsConsent,
  InterstitialAd,
  MaxAdContentRating,
  TestIds,
} from 'react-native-google-mobile-ads';

// ─────────────────────────────────────────────
// Your real ad unit ids from the AdMob console
// (Apps → Sip Happens → Ad units → Interstitial).
// These are UNIT ids (ca-app-pub-…/…), different from
// the APP ids that go in app.json (ca-app-pub-…~…).
// ─────────────────────────────────────────────
const PROD_INTERSTITIAL_ID = Platform.select({
  ios:     'ca-app-pub-9454232511983330/7295615202',
  android: 'ca-app-pub-9454232511983330/2085474956',
})!;

const UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : PROD_INTERSTITIAL_ID;

const COOLDOWN_MS = 60_000; // never two ads within a minute, whatever happens

class InterstitialManager {
  private ad: InterstitialAd | null = null;
  private loaded = false;
  private initialized = false;
  private lastShownAt = 0;
  private personalizedAdsAllowed = true;
  private unsubscribers: Array<() => void> = [];

  /**
   * Call once from App.tsx after mount — AFTER the ATT prompt has resolved.
   * Runs the Google UMP consent flow (GDPR/UK consent form), then
   * initializes the SDK and preloads the first interstitial.
   * Safe to call more than once (no-ops after the first successful call).
   *
   * @param personalizedAdsAllowed  Result of requestTrackingPermission().
   *   false → every ad request is marked non-personalized (no IDFA use).
   */
  async init(personalizedAdsAllowed: boolean = true): Promise<void> {
    this.personalizedAdsAllowed = personalizedAdsAllowed;
    if (this.initialized) {
      return;
    }
    try {
      // Consent first — required for UK/EU users. Shows Google's consent
      // form when needed; no-ops for users outside consent regions.
      await AdsConsent.gatherConsent();

      await mobileAds().setRequestConfiguration({
        // Drinking game, 17+/18 rated app → allow mature ad inventory.
        maxAdContentRating: MaxAdContentRating.MA,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });

      await mobileAds().initialize();
      this.initialized = true;
      this.loadNext();
    } catch (err) {
      // Consent flow or init failed (offline first launch, etc.).
      // Stay uninitialized — show() will fail open. Retry next launch.
    }
  }

  private clearListeners() {
    this.unsubscribers.forEach(u => u());
    this.unsubscribers = [];
  }

  private loadNext() {
    if (!this.initialized) return;
    this.clearListeners();
    this.loaded = false;

    const ad = InterstitialAd.createForAdRequest(UNIT_ID, {
      // UMP consent governs EU/UK personalization; this flag additionally
      // covers the iOS ATT decision, which UMP doesn't know about.
      requestNonPersonalizedAdsOnly: !this.personalizedAdsAllowed,
    });

    this.unsubscribers.push(
      ad.addAdEventListener(AdEventType.LOADED, () => {
        this.loaded = true;
      }),
      ad.addAdEventListener(AdEventType.ERROR, (err) => {
        // No fill / network error — retry after a pause.
        this.loaded = false;
        setTimeout(() => this.loadNext(), 30_000);
      }),
    );

    ad.load();
    this.ad = ad;
  }

  /** True if an ad is ready and off cooldown (handy for debugging/UI). */
  isReady(): boolean {
    return this.initialized && this.loaded && Date.now() - this.lastShownAt > COOLDOWN_MS;
  }

  /**
   * Show the interstitial, then run onDone when the user closes it (the X is
   * rendered by Google after a few seconds — nothing for you to build).
   * If no ad is available for any reason, onDone runs immediately.
   */
  show(onDone: () => void): void {
    if (!this.isReady() || !this.ad) {
      onDone();
      return;
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      this.lastShownAt = Date.now();
      onDone();
      this.loadNext(); // preload the next one for the second placement
    };

    this.unsubscribers.push(
      this.ad.addAdEventListener(AdEventType.CLOSED, finish),
      this.ad.addAdEventListener(AdEventType.ERROR, finish),
    );

    try {
      this.ad.show();
    } catch {
      finish(); // fail open, always
    }
  }
}

export const Ads = new InterstitialManager();