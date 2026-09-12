// src/components/ErrorBoundary.tsx
// Catches render-time crashes so the app shows a recoverable screen instead of
// dying silently.
//
// Why this matters here specifically: resolveRule() in data/ringSets.ts THROWS
// when a rule set has no entry for a rank. That is the right call — a blank
// card mid-game is worse than a loud failure — but with no boundary the throw
// unmounts the whole tree and the app is simply gone, mid-party, with no way
// back. loadActiveSet() guards the normal path; this covers everything else.
//
// Deliberately a class: componentDidCatch has no hooks equivalent.

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Jack, Type } from '../styles/theme';
import { JackButton } from './jack';

type Props = {
  children: ReactNode;
  /** Called when the player taps "Start Again" — used to reset navigation. */
  onReset?: () => void;
};

type State = {
  error: Error | null;
  /** Bumping this remounts the subtree, clearing whatever bad state caused it. */
  generation: number;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, generation: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No crash reporter in the app yet, so at least make it findable in a dev
    // console or device log rather than vanishing.
    console.error('[SipHappens] render crash:', error.message, info.componentStack);
  }

  private handleReset = () => {
    this.setState(prev => ({ error: null, generation: prev.generation + 1 }));
    this.props.onReset?.();
  };

  render() {
    const { error, generation } = this.state;

    if (!error) {
      // The key is what makes "Start Again" actually re-run the subtree.
      return <View key={generation} style={styles.flex}>{this.props.children}</View>;
    }

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.panelOuter}>
            <View style={styles.panelShadow} />
            <View style={styles.panelFace}>
              <Text style={styles.eyebrow}>WELL, THAT'S AWKWARD</Text>
              <Text style={styles.title}>Something broke.</Text>
              <Text style={styles.body}>
                The game hit a problem and had to stop. Nothing you saved has
                been lost — your players, decks and packs are all still there.
              </Text>
            </View>
          </View>

          <View style={styles.detailOuter}>
            <Text style={styles.detailLabel}>WHAT WENT WRONG</Text>
            <Text style={styles.detailText}>{error.message || String(error)}</Text>
          </View>

          <JackButton label="Start Again" icon="refresh" onPress={this.handleReset} />
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: 24, paddingVertical: 40, gap: 22,
  },

  panelOuter: { position: 'relative' },
  panelShadow: {
    position: 'absolute', top: Jack.shadowBig, left: 0, right: 0, bottom: 0,
    borderRadius: Jack.radiusBig, backgroundColor: Colors.error,
  },
  panelFace: {
    borderRadius: Jack.radiusBig, borderWidth: Jack.border, borderColor: Colors.ink,
    backgroundColor: Colors.surfaceContainer,
    padding: 24, marginBottom: Jack.shadowBig, gap: 8,
  },
  eyebrow: {
    fontFamily: Type.display, fontSize: 11, letterSpacing: 2.5, color: Colors.error,
  },
  title: { fontFamily: Type.display, fontSize: 30, color: Colors.onSurface },
  body: {
    fontFamily: Type.body, fontSize: 14, lineHeight: 21, color: Colors.onSurfaceVariant,
  },

  detailOuter: {
    borderRadius: Jack.radius, borderWidth: 2, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow, padding: 14, gap: 6,
  },
  detailLabel: {
    fontFamily: Type.display, fontSize: 9, letterSpacing: 1.5, color: Colors.outline,
  },
  detailText: {
    fontFamily: Type.bodyMedium, fontSize: 12, lineHeight: 17,
    color: Colors.onSurfaceVariant,
  },
});
