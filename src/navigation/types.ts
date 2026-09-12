// src/navigation/types.ts
import { LibraryScope } from '../data/scopes';

export type RootStackParamList = {
  // Gate — shown once, before anything else, until age is confirmed
  AgeGate: undefined;

  Play: undefined;

  // ── Truth or Dare setup flow (no bottom nav) ──
  DeckSelect: undefined;
  Game: undefined;
  GameOver: undefined;

  // ── Trivia setup flow ──
  TriviaSetup: undefined;
  TriviaGame: undefined;
  TriviaOver: undefined;

  // ── Screw the Dealer! setup flow ──
  DealerSetup: undefined;
  DealerGame: undefined;
  DealerOver: undefined;

  // ── Word Traitors! setup flow ──
  TraitorsSetup: undefined;
  TraitorsGame: undefined;
  TraitorsOver: undefined;

  // ── Ring of Fire setup flow ──
  RingSetup: undefined;
  RingGame: undefined;
  RingOver: undefined;

  /**
   * Shared lobby. Every game mode collects players here, so it has to be told
   * where to go next — otherwise it can only ever start Truth or Dare.
   */
  Players: { next: 'Game' | 'TriviaGame' | 'DealerGame' | 'TraitorsGame' | 'RingGame' };

  /** Ring of Fire rule-set editor. Rule sets aren't packs — exactly one entry
   *  per rank rather than a mixable list — so they get their own screen. */
  RingSetEditor: { setId: string };

  // ── Shared content library, one screen per job for every mode ──
  PackList: { scope: LibraryScope };
  PackEditor: { scope: LibraryScope; packId: string };
  ItemLibrary: { scope: LibraryScope };

  // Reachable from Play's header — privacy/terms/support
  Legal: undefined;
};
