// src/utils/afterModal.ts
// Run something *after* a Modal has finished dismissing.
//
// Why this exists: hiding a transparent Modal and navigating in the same tick
// leaves the modal's native window on top of the new screen. It draws nothing,
// so the screen looks completely normal — but it still receives touches, so
// every button is dead. That is what made "Main Menu" unresponsive after
// quitting a game.
//
// Modal's own onDismiss callback would be the tidy answer, but it is iOS-only,
// so this waits out the slide animation instead.

/** Roughly the duration of Modal's slide animation. */
const MODAL_DISMISS_MS = 280;

export function afterModalClose(action: () => void, ms: number = MODAL_DISMISS_MS): void {
  setTimeout(action, ms);
}

/**
 * Convenience for the common shape: close a sheet, then act once it is gone.
 *
 *   const closeThen = closeSheetThen(setShowQuit);
 *   ...
 *   onPress={() => closeThen(() => navigation.replace('Play'))}
 */
export function closeSheetThen(setVisible: (v: boolean) => void) {
  return (action: () => void, ms?: number) => {
    setVisible(false);
    afterModalClose(action, ms);
  };
}
