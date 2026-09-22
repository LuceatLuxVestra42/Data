import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildRelationConsumer, serializeRelationConsumer } from '../tools/hero-6/generate-exclusive-equipment-relation.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const evidence = readJson('data/relations/hero-exclusive-equipment/hero-6-equipment-416.evidence.v1.json');
const admission = readJson('data/relations/hero-exclusive-equipment/hero-6-equipment-416.admission.v1.json');
const canonical = readJson('data/relations/hero-exclusive-equipment/hero-6-equipment-416.canonical.v1.json');
const localization = readJson('data/equipment/416/localization.ko.v1.json');
const generatedText = fs.readFileSync(path.join(root, 'data/generated/relations/hero-6-exclusive-equipment.v1.json'), 'utf8');
const generated = JSON.parse(generatedText);
const handoff = readJson('data/contracts/hero-6-exclusive-equipment-handoff.v1.json');

test('4R preserves direct SkillHero provenance for the migrated pair', () => {
  assert.deepEqual(evidence.directSourceProvenance, {
    sourceKind: 'EQUIPMENT_SKILL_HERO',
    table: 'ConfigDataEquipmentInfo',
    recordId: 416,
    field: 'SkillHero',
    value: 6,
    nativeDirection: 'equipmentId -> heroId'
  });
  assert.equal(evidence.boundaries.nameJoinUsed, false);
  assert.equal(evidence.boundaries.idArithmeticUsed, false);
});

test('4R admission and canonical relation are exactly Hero 6 -> Equipment 416', () => {
  assert.equal(admission.decision, 'ADMIT_MIGRATED_RELATION');
  assert.deepEqual(canonical, {
    version: 1,
    heroId: 6,
    equipmentId: 416,
    relationType: 'exclusive'
  });
});

test('equipment Korean label is presentation-only and cannot create ownership', () => {
  assert.equal(localization.displayLabel, '청룡의 갑옷');
  assert.equal(localization.authorityBoundary, 'PRESENTATION_ONLY');
  assert.equal(localization.relationAuthority, false);
  assert.equal(localization.identityJoinUsed, false);
});

test('generated relation consumer matches canonical edge without provenance leakage', () => {
  assert.deepEqual(buildRelationConsumer(), generated);
  assert.equal(serializeRelationConsumer(), generatedText);
  assert.deepEqual(generated.relations.exclusiveEquipment, [{
    displayName: '청룡의 갑옷',
    equipmentId: 416,
    relationType: 'exclusive'
  }]);
  assert.doesNotMatch(generatedText, /SkillHero|ConfigData|Legacy|checkpoint/);
});

test('handoff digest pins the generated relation bytes', () => {
  const digest = crypto.createHash('sha256').update(generatedText).digest('hex');
  assert.equal(digest, '3ef515fca9788a77cb0872ee867eadd31281ddac72499c975eabcbf521f347e2');
  assert.equal(digest, handoff.producer.contentSha256);
});
