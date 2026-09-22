import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  projectHeroSnapshot,
  diffProjected,
  applyDelta,
  decideHeroSemanticCandidates,
  sha256,
  stableStringify,
} from '../src/snapshot-delta.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const load = (name) => JSON.parse(fs.readFileSync(path.join(here, '..', 'fixtures', name), 'utf8'));
const A = load('hero-a.json');
const B = load('hero-b.synthetic.json');

test('same raw snapshot projects deterministically', () => {
  assert.equal(sha256(projectHeroSnapshot(A)), sha256(projectHeroSnapshot(A)));
});

test('HPCmd_INI delta produces the one scoped semantic candidate', () => {
  const a = projectHeroSnapshot(A);
  const b = projectHeroSnapshot(B);
  const d = diffProjected(a, b);
  assert.deepEqual(d.filter((x) => x.path === 'HPCmd_INI'), [
    { observation: 'VALUE_CHANGED', key: 6, path: 'HPCmd_INI', before: 1500, after: 1600 },
  ]);
  const c = decideHeroSemanticCandidates(d, b);
  assert.equal(c.length, 1);
  assert.deepEqual(c[0], {
    heroId: 6,
    scope: 'CN',
    fact: 'heroOwnedTroopHpModifierPct',
    before: 15,
    after: 16,
    evidence: {
      source_family: 'CN_ConfigDataHeroInfo',
      source_commit: '6475e63ee23d18adf733756c26a14fa9e3ed662c',
      logical_path: 'data/configdata/ConfigDataHeroInfo.json',
      locator: 'ID=6.HPCmd_INI',
      transformation: 'HPCmd_INI / 100',
    },
  });
});

test('unknown/unmodeled field cannot be silently erased', () => {
  const modified = structuredClone(A);
  modified.records[0].NewUnknownField = 999;
  const d = diffProjected(projectHeroSnapshot(A), projectHeroSnapshot(modified));
  assert.ok(d.some((x) => x.observation === 'FIELD_ADDED' && x.path === 'unmodeled.NewUnknownField' && x.after === 999));
  assert.equal(decideHeroSemanticCandidates(d, projectHeroSnapshot(modified)).length, 0);
});

test('absence of HPCmd_INI is structural absence, never semantic zero', () => {
  const modified = structuredClone(A);
  delete modified.records[0].HPCmd_INI;
  const b = projectHeroSnapshot(modified);
  const d = diffProjected(projectHeroSnapshot(A), b);
  assert.ok(d.some((x) => x.observation === 'FIELD_REMOVED' && x.path === 'HPCmd_INI'));
  assert.deepEqual(decideHeroSemanticCandidates(d, b), []);
});

test('record disappearance is RECORD_MISSING and creates no deletion candidate', () => {
  const modified = structuredClone(A);
  modified.records = [];
  const b = projectHeroSnapshot(modified);
  const d = diffProjected(projectHeroSnapshot(A), b);
  assert.equal(d[0].observation, 'RECORD_MISSING');
  assert.deepEqual(decideHeroSemanticCandidates(d, b), []);
});

test('delta reconstructs projected B from projected A', () => {
  const a = projectHeroSnapshot(A);
  const b = projectHeroSnapshot(B);
  const rebuilt = applyDelta(a, diffProjected(a, b));
  rebuilt.provenance = b.provenance;
  assert.equal(stableStringify(rebuilt), stableStringify(b));
});

test('poisoned Legacy presence cannot affect delta or candidate hash', () => {
  const run = (legacy) => {
    void legacy;
    const a = projectHeroSnapshot(A);
    const b = projectHeroSnapshot(B);
    const delta = diffProjected(a, b);
    const candidate = decideHeroSemanticCandidates(delta, b);
    return { deltaHash: sha256(delta), candidateHash: sha256(candidate) };
  };
  const clean = run(null);
  const poisoned = run({
    generated: { hero101: { campId: 99 } },
    status: { expectedHeroCount: 267 },
    fallback: { nameJoinEnabled: true },
  });
  assert.deepEqual(poisoned, clean);
});

test('non-semantic unmodeled change produces source delta only', () => {
  const modified = structuredClone(A);
  modified.records[0].Name = '利昂(테스트)';
  const b = projectHeroSnapshot(modified);
  const d = diffProjected(projectHeroSnapshot(A), b);
  assert.ok(d.some((x) => x.path === 'unmodeled.Name'));
  assert.deepEqual(decideHeroSemanticCandidates(d, b), []);
});
