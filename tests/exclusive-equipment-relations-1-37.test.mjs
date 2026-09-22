import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildExclusiveEquipmentIndex, serializeExclusiveEquipmentIndex } from '../tools/heroes/generate-exclusive-equipment-index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

test('migrated relations preserve direct SkillHero provenance', () => {
  const evidence = readJson('data/relations/hero-exclusive-equipment/expansion-1-37.evidence.v1.json');
  assert.deepEqual(evidence.records.map(x => [x.heroId,x.equipmentId,x.directSourceProvenance.field,x.directSourceProvenance.value]), [
    [1,277,'SkillHero',1],
    [37,280,'SkillHero',37]
  ]);
  assert.equal(evidence.boundaries.nameJoinUsed, false);
  assert.equal(evidence.boundaries.idArithmeticUsed, false);
});

test('canonical relation expansion admits only the two requested pairs', () => {
  const canonical = readJson('data/relations/hero-exclusive-equipment/expansion-1-37.canonical.v1.json');
  assert.deepEqual(canonical.relations, [
    {heroId:1,equipmentId:277,relationType:'exclusive'},
    {heroId:37,equipmentId:280,relationType:'exclusive'}
  ]);
});

test('equipment labels are presentation-only', () => {
  for (const [id,name] of [[277,'단결의 반지'],[280,'쥬그미의 선물']]) {
    const item = readJson(`data/equipment/${id}/localization.ko.v1.json`);
    assert.equal(item.displayLabel, name);
    assert.equal(item.authorityBoundary, 'PRESENTATION_ONLY');
    assert.equal(item.relationAuthority, false);
    assert.equal(item.identityJoinUsed, false);
  }
});

test('aggregate relation handoff covers Heroes 1, 6 and 37 deterministically', () => {
  const generated = buildExclusiveEquipmentIndex();
  assert.deepEqual(generated.relations, [
    {heroId:1,equipmentId:277,relationType:'exclusive',displayName:'단결의 반지'},
    {heroId:6,equipmentId:416,relationType:'exclusive',displayName:'청룡의 갑옷'},
    {heroId:37,equipmentId:280,relationType:'exclusive',displayName:'쥬그미의 선물'}
  ]);
  const text = serializeExclusiveEquipmentIndex();
  assert.equal(text, fs.readFileSync(path.join(root, 'data/generated/relations/hero-exclusive-equipment-index.v1.json'), 'utf8'));
  const digest = crypto.createHash('sha256').update(text).digest('hex');
  assert.equal(digest, '3b9c303eb1892b8380d0826af6a8f5f8da1cd6f64e16df432ba8aa1efae35779');
  const handoff = readJson('data/contracts/hero-exclusive-equipment-expansion-handoff.v1.json');
  assert.equal(handoff.producer.contentSha256, digest);
});

test('generated relation payload excludes source provenance', () => {
  assert.doesNotMatch(serializeExclusiveEquipmentIndex(), /SkillHero|ConfigData|Legacy|checkpoint|sourceContract/);
});
