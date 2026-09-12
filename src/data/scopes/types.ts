// src/data/scopes/types.ts
// A ScopeAdapter describes one mode's content to the shared library screens.
//
// The screens are fully generic: they render whatever `fields` says, and they
// only ever handle FormValues (flat string maps). Payload shapes are private
// to each adapter, which is what keeps one set of screens type-safe across
// four different content types.
//
// Everything here is PURE, so tools/scopes-smoke.ts can test the validation
// and form round-tripping without a device.

import { PackScope } from '../packs';

export type FieldKind =
  /** One line. */
  | 'text'
  /** Multi-line. */
  | 'longText'
  /** Multi-line with the {token} chip inserter above it. */
  | 'tokenText'
  /** Pick one of `choices`. */
  | 'choice';

export interface FieldChoice {
  value: string;
  label: string;
  /** Theme colour for the chip when selected. */
  color?: string;
}

export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  choices?: FieldChoice[];
  helper?: string;
}

/** Flat form state, keyed by FieldSpec.key. */
export type FormValues = Record<string, string>;

/** A built-in item offered in the mix-and-match picker. */
export interface BuiltinEntry {
  /** Bare id — the picker wraps it with builtinRef(). */
  id: string;
  title: string;
  subtitle?: string;
  /** Optional grouping header, e.g. the wedge or category. */
  group?: string;
}

export interface ScopeAdapter {
  scope: PackScope;

  /** Nouns for the UI, so screens read naturally per mode. */
  itemNoun: string;          // "Card"
  itemNounPlural: string;    // "Cards"
  packNoun: string;          // "Deck"
  packNounPlural: string;    // "Decks"

  /** Ionicons glyph + theme colour for new packs by default. */
  defaultPackIcon: string;
  defaultPackColor: string;

  fields: FieldSpec[];

  /** Blank form for the "new item" state. */
  emptyForm: () => FormValues;

  /**
   * Validate a filled form. Return a human-readable problem, or null when the
   * item is good. Mirrors the rules the ValidateX.js CLIs enforce on shipped
   * content, so hand-authored and user-authored content are held to the same
   * standard.
   */
  validate: (form: FormValues) => string | null;

  /** Form -> stored payload. Only called after validate() returns null. */
  payloadFromForm: (form: FormValues) => unknown;

  /** Stored payload -> form, for editing. Tolerant of legacy shapes. */
  formFromPayload: (payload: unknown) => FormValues;

  /** Row title and subtitle for list rows. */
  describe: (payload: unknown) => { title: string; subtitle: string };

  /** Built-ins available to mix into packs. */
  builtins: () => BuiltinEntry[];
}
