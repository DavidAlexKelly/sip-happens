// src/components/ItemForm.tsx
// Renders a scope adapter's `fields` as a form. This is what lets one editor
// serve cards, questions and words — the screens never know which.
//
// 'tokenText' keeps the {token} chip inserter that Truth or Dare's bespoke
// editor had; losing it would have been a regression for card authoring.

import React from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
} from 'react-native';
import { Colors, Jack, Type } from '../styles/theme';
import { TOKEN_META } from '../data/tokens';
import { FieldSpec, FormValues } from '../data/scopes/types';
import TokenText from './TokenText';

type Props = {
  fields: FieldSpec[];
  values: FormValues;
  onChange: (key: string, value: string) => void;
  /** Which field the token chips insert into. */
  tokenTargetKey?: string;
};

const INSERTABLE_TOKENS = Object.keys(TOKEN_META);

export default function ItemForm({ fields, values, onChange, tokenTargetKey }: Props) {
  const insertToken = (key: string, token: string) => {
    onChange(key, `${values[key] ?? ''}{${token}}`);
  };

  return (
    <View style={styles.wrap}>
      {fields.map(field => {
        const value = values[field.key] ?? '';

        if (field.kind === 'choice') {
          return (
            <View key={field.key} style={styles.field}>
              <Text style={styles.label}>
                {field.label}{field.required ? ' *' : ''}
              </Text>
              <View style={styles.choices}>
                {(field.choices ?? []).map(choice => {
                  const active = value === choice.value;
                  return (
                    <TouchableOpacity
                      key={choice.value}
                      activeOpacity={0.85}
                      onPress={() => onChange(field.key, choice.value)}
                      style={[
                        styles.choice,
                        active
                          ? {
                              backgroundColor: choice.color ?? Colors.primary,
                              borderColor: Colors.ink,
                            }
                          : { borderColor: Colors.outlineVariant },
                      ]}
                    >
                      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
                        {choice.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {field.helper && <Text style={styles.helper}>{field.helper}</Text>}
            </View>
          );
        }

        const multiline = field.kind !== 'text';
        const showTokens = field.kind === 'tokenText'
          && (tokenTargetKey === undefined || tokenTargetKey === field.key);

        return (
          <View key={field.key} style={styles.field}>
            <Text style={styles.label}>
              {field.label}{field.required ? ' *' : ''}
            </Text>

            {showTokens && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tokenRow}
              >
                {INSERTABLE_TOKENS.map(token => (
                  <TouchableOpacity
                    key={token}
                    activeOpacity={0.8}
                    onPress={() => insertToken(field.key, token)}
                    style={[
                      styles.tokenChip,
                      { backgroundColor: TOKEN_META[token].color },
                    ]}
                  >
                    <Text style={styles.tokenChipText}>{TOKEN_META[token].label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.inputOuter}>
              <View style={styles.inputShadow} />
              <TextInput
                style={[styles.input, multiline && styles.inputMultiline]}
                value={value}
                onChangeText={(v: string) => onChange(field.key, v)}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.outline}
                maxLength={field.maxLength}
                multiline={multiline}
                textAlignVertical={multiline ? 'top' : 'center'}
              />
            </View>

            {/* Live preview so the author sees tokens as the group will. */}
            {field.kind === 'tokenText' && value.includes('{') && (
              <View style={styles.preview}>
                <TokenText text={value} variant="paper" fontSize={13} />
              </View>
            )}

            {field.helper && <Text style={styles.helper}>{field.helper}</Text>}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  field: { gap: 7 },
  label: {
    fontFamily: Type.display, fontSize: 11, letterSpacing: 1.5,
    color: Colors.outline, textTransform: 'uppercase',
  },
  helper: { fontFamily: Type.body, fontSize: 11.5, color: Colors.outline },

  inputOuter: { position: 'relative' },
  inputShadow: {
    position: 'absolute', top: 4, left: 0, right: 0, bottom: 0,
    borderRadius: Jack.radius, backgroundColor: Colors.ink,
  },
  input: {
    minHeight: 48, borderRadius: Jack.radius, paddingHorizontal: 14,
    paddingVertical: 12, marginBottom: 4,
    backgroundColor: Colors.surfaceContainer, color: Colors.onSurface,
    fontFamily: Type.bodyMedium, fontSize: 14,
    borderWidth: Jack.border, borderColor: Colors.ink,
  },
  inputMultiline: { minHeight: 96 },

  tokenRow: { gap: 6, paddingBottom: 2 },
  tokenChip: {
    borderRadius: 8, borderWidth: 2, borderColor: Colors.ink,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  tokenChipText: {
    fontFamily: Type.display, fontSize: 10, color: Colors.ink, letterSpacing: 0.3,
  },

  preview: {
    backgroundColor: Colors.paper, borderRadius: Jack.radius,
    borderWidth: 2, borderColor: Colors.ink, padding: 10,
  },

  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    borderRadius: 10, borderWidth: 2.5, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.surfaceContainerLow,
  },
  choiceText: {
    fontFamily: Type.display, fontSize: 11, color: Colors.onSurfaceVariant,
  },
  choiceTextActive: { color: Colors.ink },
});
