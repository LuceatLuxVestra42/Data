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
  {id:12, name:'艾尔文', ko:'엘윈', hpRaw:500, hpPct:5, assetFile:'asset.base-portrait.v1.json', assetKind:'BASE_PORTRAIT', assetSha:'2475f034d9734ebc561bec08faccfbb98636931081efeb17601010f852574a4b'},
  {id:15, name:'莉亚娜', ko:'리아나', hpRaw:1500, hpPct:15, assetFile:'asset.base-portrait.v1.json', assetKind:'BASE_PORTRAIT', assetSha:'28f074e86b1c16709a67d1cea8da496cf31ab1ec34aed83b7af5de682b677221'},
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

test('new portrait admissions preserve reverified raw Drive evidence', () => {
  const elwin = readJson('data/hero/12/asset.base-portrait.v1.json');
  const riana = readJson('data/hero/15/asset.base-portrait.v1.json');

  assert.equal(elwin.source.driveFileId, '1S0Mftmvm4Lu-pdHPvzkant9zfyFGAXNE');
  assert.equal(elwin.source.sha256, 'fc7d6c625d76e69e367b323cf6bd36af96d64e68cc36f50c922ad5cc69d8bcb9');
  assert.deepEqual([elwin.source.width, elwin.source.height, elwin.source.alpha], [1238,1847,true]);

  assert.equal(riana.source.driveFileId, '1cOdLxGc46d9oqJ7Epk7GDZ8wqsZIiF2p');
  assert.equal(riana.source.sha256, '1fe078b3bb4bf51843bceb23d627015091c4d4bddaf657b0c4ae9be5c1911a22');
  assert.deepEqual([riana.source.width, riana.source.height, riana.source.alpha], [914,1654,true]);
});

test('aggregate Hero consumer uses verified base portraits only where explicitly admitted', () => {
  const index = buildHeroIndex();
  assert.deepEqual(index.heroes.map(x => [x.heroId, x.display.asset.kind]), [
    [1, 'SP_ARTWORK'],
    [6, 'BASE_PORTRAIT'],
    [12, 'BASE_PORTRAIT'],
    [15, 'BASE_PORTRAIT'],
    [37, 'SP_ARTWORK']
  ]);
});

test('aggregate Hero consumer proves one pattern across five Heroes', () => {
  const index = buildHeroIndex();
  assert.deepEqual(index.heroes.map(x => x.heroId), [1,6,12,15,37]);
  assert.deepEqual(index.heroes.map(x => x.display.name), ['매튜','레온','엘윈','리아나','쥬그라']);
  assert.deepEqual(index.heroes.map(x => x.facts.heroOwnedTroopHpModifierPct.value), [5,15,5,15,15]);
});

test('aggregate Hero consumer is deterministic and pinned', () => {
  const text = serializeHeroIndex();
  assert.equal(text, fs.readFileSync(path.join(root, 'data/generated/heroes/index.v1.json'), 'utf8'));
  const digest = crypto.createHash('sha256').update(text).digest('hex');
  assert.equal(digest, '009a2a02281686ecf4c30d66fcd6ffe5a8102144055ecea9747a0528fc9347de');
  const handoff = readJson('data/contracts/hero-expansion-handoff.v1.json');
  assert.equal(handoff.producer.contentSha256, digest);
  assert.deepEqual(handoff.population.heroIds, [1,6,12,15,37]);
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
});
