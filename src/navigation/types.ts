// src/navigation/types.ts
export type RootStackParamList = {
  // Gate — shown once, before anything else, until age is confirmed
  AgeGate: undefined;

  // Bottom nav roots
  Play: undefined;
  Decks: undefined;
  Cards: undefined;

  // Setup flow (no bottom nav)
  DeckSelect: undefined;
  Players: undefined;
  Game: undefined;
  GameOver: undefined;

  // Reachable from Play's header — privacy/terms/support
  Legal: undefined;
};
