import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHero6Consumer, serializeHero6Consumer } from '../tools/hero-6/generate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

const evidence = readJson('data/hero/6/evidence.v1.json');
const admission = readJson('data/hero/6/admission.v1.json');
const canonical = readJson('data/hero/6/canonical.v1.json');
const localization = readJson('data/hero/6/localization.ko.v1.json');
const asset = readJson('data/hero/6/asset.base-portrait.v1.json');
const generated = readJson('data/generated/hero/6.v1.json');

test('4A uses actual pinned evidence, not the synthetic 3A value', () => {
  assert.equal(evidence.sourceEvidence.commit, '6475e63ee23d18adf733756c26a14fa9e3ed662c');
  assert.equal(evidence.sourceEvidence.locator.value, 6);
  assert.equal(evidence.sourceEvidence.observed.HPCmd_INI, 1500);
  assert.equal(evidence.syntheticInputUsed, false);
  assert.equal(admission.facts[0].sourceValue, 1500);
  assert.equal(admission.facts[0].value, 15);
  assert.notEqual(admission.facts[0].value, 16);
});

test('4A identity admission is explicit and does not use names or ID arithmetic', () => {
  assert.equal(admission.identity.canonicalHeroId, 6);
  assert.equal(admission.identity.nameJoinUsed, false);
  assert.equal(admission.identity.idArithmeticUsed, false);
});

test('4B canonical stays minimal and CN-scoped', () => {
  assert.equal(canonical.heroId, 6);
  assert.equal(canonical.facts.heroOwnedTroopHpModifierPct.scope, 'CN');
  assert.equal(canonical.facts.heroOwnedTroopHpModifierPct.value, 15);
});

test('4C localization remains presentation-only', () => {
  assert.equal(localization.sourceLabel, evidence.sourceEvidence.observed.Name);
  assert.equal(localization.displayLabel, '레온');
  assert.equal(localization.authorityBoundary, 'PRESENTATION_ONLY');
  assert.equal(localization.identityJoinUsed, false);
});

test('Hero 6 current asset is the verified clean base portrait', () => {
  assert.equal(asset.heroId, 6);
  assert.equal(asset.kind, 'BASE_PORTRAIT');
  assert.equal(asset.normalPortraitClaim, true);
  assert.equal(asset.source.decorationPolicy, 'CLEAN_CHARACTER_ART_ONLY');
  assert.equal(asset.source.sha256, '8d04d4858d8bbb8021cef1439183018293ff28659f42e486ae1306d8c5f616d1');
  assert.equal(asset.expected.sha256, '7f679f80b4712353f727aeb6e087ce8ba8380bce8542bc992115b154889b23f3');
  assert.equal(asset.proof.manifestStatus, 'PASS');
});

test('4D generation uses only admitted internal inputs and matches committed output', () => {
  assert.deepEqual(buildHero6Consumer(), generated);
  const generatorSource = fs.readFileSync(path.join(root, 'tools/hero-6/generate.mjs'), 'utf8');
  assert.doesNotMatch(generatorSource, /ConfigData|langrisser-future-guide|HPCmd_INI|source_commit/);
});

test('4D generation is deterministic', () => {
  assert.equal(serializeHero6Consumer(), serializeHero6Consumer());
  assert.equal(serializeHero6Consumer(), fs.readFileSync(path.join(root, 'data/generated/hero/6.v1.json'), 'utf8'));
});

test('generated presentation consumer excludes source and migration provenance', () => {
  const text = JSON.stringify(generated);
  for (const forbidden of ['sourceCommit', 'source_commit', 'logicalPath', 'HPCmd_INI', 'checkpoint', 'Legacy', 'stage']) {
    assert.equal(text.includes(forbidden), false, `unexpected generated provenance: ${forbidden}`);
  }
});
