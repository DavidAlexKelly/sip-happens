#!/usr/bin/env node
// src/data/validate-cards.js
//
// Validates all card JSON files. Plain Node.js — no TypeScript, no extra deps.
// Run from the project root:
//
//   node src/data/validate-cards.js
//
// Exits with code 1 if any errors are found.

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

const CARDS_DIR = path.join(__dirname, 'cards');

const VALID_TOKENS = new Set([
  '{sip}', '{small}', '{medium}', '{large}', '{max}', '{player1}', '{player2}',
]);

const VALID_ICONS = new Set([
  'beer', 'wine', 'camera', 'chatbubble', 'chatbubble-ellipses', 'eye', 'eye-off',
  'flash', 'flame', 'happy', 'heart', 'heart-half', 'hand-left', 'hand-right',
  'body', 'mic', 'musical-notes', 'notifications', 'people', 'person', 'podium',
  'shield', 'shirt', 'trophy', 'warning', 'airplane', 'boat', 'call', 'car',
  'cash', 'checkmark-circle', 'color-palette', 'cut', 'film', 'finger-print',
  'game-controller', 'gift', 'globe', 'help-circle', 'link', 'logo-instagram',
  'logo-twitter', 'medkit', 'moon', 'phone-portrait', 'pizza', 'planet', 'radio',
  'ribbon', 'rose', 'search', 'timer', 'volume-mute', 'calculator',
]);

const VALID_INTENSITY = new Set([1, 2, 3]);
const MODE_FILES      = ['social', 'truth', 'drink', 'wild'];

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

let errors   = 0;
let warnings = 0;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function err(file, index, msg) {
  console.error(`  ✗ [${file}] #${index}: ${msg}`);
  errors++;
}

function warn(file, index, msg) {
  console.warn(`  ⚠  [${file}] #${index}: ${msg}`);
  warnings++;
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return e;
  }
}

function validateCard(card, file, index) {
  if (!card || typeof card !== 'object') {
    err(file, index, 'card is not an object');
    return;
  }

  // Required string fields
  if (typeof card.text !== 'string' || !card.text.trim())
    err(file, index, 'missing or empty "text"');

  if (typeof card.action !== 'string' || !card.action.trim())
    err(file, index, 'missing or empty "action"');

  // Icon
  if (typeof card.icon !== 'string')
    err(file, index, 'missing "icon"');
  else if (!VALID_ICONS.has(card.icon))
    warn(file, index, `unknown icon "${card.icon}" — verify the Ionicons name`);

  // Intensity
  if (!VALID_INTENSITY.has(card.intensity))
    err(file, index, `"intensity" must be 1, 2, or 3 (got ${JSON.stringify(card.intensity)})`);

  // Token check
  const text = typeof card.text === 'string' ? card.text : '';
  const tokenMatches = text.match(/\{[^}]+\}/g) || [];
  for (const token of tokenMatches) {
    if (!VALID_TOKENS.has(token))
      err(file, index, `unknown token "${token}" — valid: ${[...VALID_TOKENS].join(', ')}`);
  }

  // Length warnings
  if (text.length > 0 && text.length < 20)
    warn(file, index, `text is very short (${text.length} chars)`);
  if (text.length > 300)
    warn(file, index, `text is very long (${text.length} chars) — may overflow the card UI`);
}

// ─────────────────────────────────────────────
// Validate mode files
// ─────────────────────────────────────────────

for (const mode of MODE_FILES) {
  const filePath = path.join(CARDS_DIR, `${mode}.json`);
  console.log(`\nChecking ${mode}.json...`);

  if (!fs.existsSync(filePath)) {
    err(mode, 'root', `file not found: ${filePath}`);
    continue;
  }

  const data = loadJson(filePath);

  if (data instanceof Error) {
    err(mode, 'root', `JSON parse error — ${data.message}`);
    continue;
  }

  if (!Array.isArray(data)) {
    err(mode, 'root', 'root value must be a JSON array');
    continue;
  }

  if (data.length === 0)
    warn(mode, 'root', 'no cards in this file');

  data.forEach((card, i) => validateCard(card, mode, i));
  console.log(`  → ${data.length} card(s)`);
}

// ─────────────────────────────────────────────
// Validate rules.json
// ─────────────────────────────────────────────

const rulesPath = path.join(CARDS_DIR, 'rules.json');
console.log('\nChecking rules.json...');

if (!fs.existsSync(rulesPath)) {
  err('rules', 'root', `file not found: ${rulesPath}`);
} else {
  const data = loadJson(rulesPath);

  if (data instanceof Error) {
    err('rules', 'root', `JSON parse error — ${data.message}`);
  } else if (!Array.isArray(data)) {
    err('rules', 'root', 'root value must be a JSON array');
  } else {
    const seenIds = new Set();

    data.forEach((pair, i) => {
      if (!pair || typeof pair !== 'object') {
        err('rules', i, 'entry is not an object');
        return;
      }

      // ruleId
      if (typeof pair.ruleId !== 'string' || !pair.ruleId.trim())
        err('rules', i, 'missing or empty "ruleId"');
      else if (seenIds.has(pair.ruleId))
        err('rules', i, `duplicate ruleId "${pair.ruleId}"`);
      else
        seenIds.add(pair.ruleId);

      // start / end cards
      if (!pair.start) err('rules', i, 'missing "start" card');
      else validateCard(pair.start, `rules[${i}].start`, i);

      if (!pair.end) err('rules', i, 'missing "end" card');
      else validateCard(pair.end, `rules[${i}].end`, i);
    });

    console.log(`  → ${data.length} rule pair(s)`);
  }
}

// ─────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────

console.log('\n────────────────────────────────────────');
if (errors === 0 && warnings === 0) {
  console.log('✅  All cards valid. No issues found.\n');
} else {
  if (warnings > 0) console.warn(`⚠   ${warnings} warning(s)`);
  if (errors   > 0) console.error(`✗   ${errors} error(s) — fix before shipping\n`);
}
console.log('────────────────────────────────────────\n');

process.exit(errors > 0 ? 1 : 0);