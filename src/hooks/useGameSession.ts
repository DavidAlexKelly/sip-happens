// src/hooks/useGameSession.ts
// The scaffolding every game mode repeats: the quit sheet, the Android back
// intercept, the midpoint ad, and the game-over hand-off to the results screen.
//
// This existed five times, copy-pasted. The dead-button bug proved the cost —
// one mistake (navigating while a Modal was still dismissing) replicated across
// all five screens and needed five separate fixes. Now there is one.
//
// The screens keep their own layout; only the plumbing is shared.

import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { Ads } from '../monetization/ads';
import { closeSheetThen } from '../utils/afterModal';

export interface GameSessionOptions {
  /** Engine's terminal flag. When it flips, the session hands off to results. */
  isOver: boolean;
  /** Snapshot the standings before navigating — engines unmount on replace. */
  onFinish: () => void;
  /** Called when the session should end from inside the quit sheet. */
  onQuit?: () => void;
  /** Where to go when the game ends. */
  toResults: () => void;
  /** Where to go when the player abandons entirely. */
  toMenu: () => void;
  /** How far in to show the single midpoint interstitial. */
  midpointAfter?: number;
}

export function useGameSession(opts: GameSessionOptions) {
  const [showQuit, setShowQuit] = useState(false);
  const closeQuitThen = closeSheetThen(setShowQuit);

  const midpointShown = useRef(false);
  const endHandled = useRef(false);

  // Read through refs so the effect below can depend on `isOver` alone. The
  // engines return a new object every render, so depending on them directly
  // re-ran this on every frame.
  const finishRef = useRef(opts.onFinish);
  finishRef.current = opts.onFinish;
  const resultsRef = useRef(opts.toResults);
  resultsRef.current = opts.toResults;

  // Hardware back opens the quit sheet rather than silently abandoning.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowQuit(true);
      return true;
    });
    return () => sub.remove();
  }, []);

  // Game over can arrive from several places — the last card, a win, the deck
  // running out, or the player ending it — so it is driven off engine state
  // rather than from any one button handler.
  useEffect(() => {
    if (!opts.isOver || endHandled.current) return;
    endHandled.current = true;
    finishRef.current();
    Ads.show(() => resultsRef.current());
  }, [opts.isOver]);

  /**
   * Show the one midpoint interstitial, if it is due, then continue.
   *
   * `suppress` exists because the final turn must not queue an ad: the
   * game-over effect shows its own, and the 60s cooldown would swallow the
   * second rather than making it correct.
   */
  const withMidpointAd = useCallback((
    progress: number,
    proceed: () => void,
    suppress = false,
  ) => {
    const threshold = opts.midpointAfter;
    if (!suppress
      && threshold !== undefined
      && !midpointShown.current
      && progress >= threshold) {
      midpointShown.current = true;
      Ads.show(proceed);
      return;
    }
    proceed();
  }, [opts.midpointAfter]);

  const quitRef = useRef(opts.onQuit);
  quitRef.current = opts.onQuit;
  const menuRef = useRef(opts.toMenu);
  menuRef.current = opts.toMenu;

  return {
    showQuit,
    openQuit: useCallback(() => setShowQuit(true), []),
    dismissQuit: useCallback(() => setShowQuit(false), []),
    /** End the game and show the results. */
    endGame: useCallback(() => closeQuitThen(() => quitRef.current?.()), [closeQuitThen]),
    /** Abandon entirely and go back to the menu. */
    quitToMenu: useCallback(() => closeQuitThen(() => menuRef.current()), [closeQuitThen]),
    withMidpointAd,
  };
}
