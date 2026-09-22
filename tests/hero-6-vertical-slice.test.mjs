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
const asset = readJson('data/hero/6/asset.sp-artwork.v1.json');
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
  assert.deepEqual(admission.identity.sourceIdentity, {
    sourceFamily: 'CN_ConfigDataHeroInfo',
    sourceField: 'ID',
    sourceValue: 6,
    scope: 'CN'
  });
  assert.equal(admission.identity.canonicalHeroId, 6);
  assert.equal(admission.identity.nameJoinUsed, false);
  assert.equal(admission.identity.idArithmeticUsed, false);
});

test('4B canonical stays minimal and CN-scoped', () => {
  assert.deepEqual(canonical, {
    version: 1,
    heroId: 6,
    facts: {
      heroOwnedTroopHpModifierPct: {
        scope: 'CN',
        value: 15
      }
    }
  });
});

test('4C localization is presentation-only and matches the admitted source label', () => {
  assert.equal(localization.sourceLabel, evidence.sourceEvidence.observed.Name);
  assert.equal(localization.displayLabel, '레온');
  assert.equal(localization.authorityBoundary, 'PRESENTATION_ONLY');
  assert.equal(localization.identityJoinUsed, false);
});

test('4C asset is explicitly SP artwork, not a normal portrait claim', () => {
  assert.equal(asset.heroId, 6);
  assert.equal(asset.kind, 'SP_ARTWORK');
  assert.equal(asset.charImageId, 1013);
  assert.equal(asset.normalPortraitClaim, false);
  assert.equal(asset.proof.resultStatus, 'PASS_SP_ASSET_INTAKE_MIGRATION_INDEPENDENCE');
  assert.equal(asset.expected.sha256, 'd1516cb5304efee27538fcae72468b932aeece57972d9728bd939627c5aa029e');
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
