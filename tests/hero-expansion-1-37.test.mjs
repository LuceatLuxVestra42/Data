import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHeroIndex, serializeHeroIndex } from '../tools/heroes/generate-index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

for (const spec of [
  {id:1, name:'马修', ko:'매튜', hpRaw:500, hpPct:5, assetFile:'asset.sp-artwork.v1.json', assetKind:'SP_ARTWORK', assetSha:'866a85af4b320bd02e943445a91dec52c34a00d956d21064aa2d3b80cdde3f64'},
  {id:37, name:'古巨拉', ko:'쥬그라', hpRaw:1500, hpPct:15, assetFile:'asset.sp-artwork.v1.json', assetKind:'SP_ARTWORK', assetSha:'c91022024571d103dee3c49be81fea9251e41662cb73fbf7e511f149be0af2f2'}
]) {
  test(`Hero ${spec.id} expansion preserves actual source and explicit admission`, () => {
    const evidence = readJson(`data/hero/${spec.id}/evidence.v1.json`);
    const admission = readJson(`data/hero/${spec.id}/admission.v1.json`);
    const canonical = readJson(`data/hero/${spec.id}/canonical.v1.json`);
    assert.equal(evidence.sourceEvidence.locator.value, spec.id);
    assert.equal(evidence.sourceEvidence.observed.Name, spec.name);
    assert.equal(evidence.sourceEvidence.observed.HPCmd_INI, spec.hpRaw);
    assert.equal(evidence.syntheticInputUsed, false);
    assert.equal(admission.identity.nameJoinUsed, false);
    assert.equal(admission.identity.idArithmeticUsed, false);
    assert.equal(admission.facts[0].value, spec.hpPct);
    assert.equal(canonical.facts.heroOwnedTroopHpModifierPct.value, spec.hpPct);
  });

  test(`Hero ${spec.id} localization and current asset remain presentation-only`, () => {
    const localization = readJson(`data/hero/${spec.id}/localization.ko.v1.json`);
    const asset = readJson(`data/hero/${spec.id}/${spec.assetFile}`);
    assert.equal(localization.displayLabel, spec.ko);
    assert.equal(localization.authorityBoundary, 'PRESENTATION_ONLY');
    assert.equal(localization.identityJoinUsed, false);
    assert.equal(asset.expected.sha256, spec.assetSha);
    assert.equal(asset.kind, spec.assetKind);
  });
}

test('Hero 6 uses BASE_PORTRAIT while retained expansion peers still use SP_ARTWORK', () => {
  const index = buildHeroIndex();
  assert.deepEqual(index.heroes.map(x => [x.heroId, x.display.asset.kind]), [
    [1, 'SP_ARTWORK'],
    [6, 'BASE_PORTRAIT'],
    [37, 'SP_ARTWORK']
  ]);
  assert.equal(index.heroes.find(x => x.heroId === 6).display.asset.sha256, '7f679f80b4712353f727aeb6e087ce8ba8380bce8542bc992115b154889b23f3');
});

test('aggregate Hero consumer proves one pattern across 1, 6, and 37', () => {
  const index = buildHeroIndex();
  assert.deepEqual(index.heroes.map(x => x.heroId), [1,6,37]);
  assert.deepEqual(index.heroes.map(x => x.display.name), ['매튜','레온','쥬그라']);
  assert.deepEqual(index.heroes.map(x => x.facts.heroOwnedTroopHpModifierPct.value), [5,15,15]);
});

test('aggregate Hero consumer is deterministic and pinned', () => {
  const text = serializeHeroIndex();
  assert.equal(text, fs.readFileSync(path.join(root, 'data/generated/heroes/index.v1.json'), 'utf8'));
  const digest = crypto.createHash('sha256').update(text).digest('hex');
  assert.equal(digest, 'b6983f245fc4dd8bc67bf05f951c38320e4b6a8a531b4b9abc95a9afc9a308ac');
  const handoff = readJson('data/contracts/hero-expansion-handoff.v1.json');
  assert.equal(handoff.producer.contentSha256, digest);
});

test('aggregate generated consumer excludes source provenance', () => {
  const text = serializeHeroIndex();
  assert.doesNotMatch(text, /HPCmd_INI|ConfigData|sourceCommit|logicalPath|checkpoint|Legacy/);
});


test('CARD_ARTWORK and legacy card paths are excluded from the new Hero producer', () => {
  const generated = fs.readFileSync(path.join(root, 'data/generated/heroes/index.v1.json'), 'utf8');
  const producer = fs.readFileSync(path.join(root, 'tools/heroes/generate-index.mjs'), 'utf8');
  const combined = `${generated}\n${producer}`;

  assert.doesNotMatch(combined, /CARD_ARTWORK|hero-card-artwork|heroes\/cards/i);
  assert.deepEqual(
    buildHeroIndex().heroes.map((hero) => hero.display.asset.kind),
    ['SP_ARTWORK', 'BASE_PORTRAIT', 'SP_ARTWORK']
  );
});
