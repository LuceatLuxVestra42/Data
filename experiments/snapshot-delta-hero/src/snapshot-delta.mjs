import crypto from 'node:crypto';

const MODELED_FIELDS = new Set(['ID', 'HPCmd_INI']);

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(stable(value));
}

export function sha256(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex');
}

export function projectHeroSnapshot(snapshot) {
  if (!snapshot?.provenance || snapshot.provenance.source_family !== 'CN_ConfigDataHeroInfo') {
    throw new Error('UNSUPPORTED_SOURCE_FAMILY');
  }
  const seen = new Set();
  const records = snapshot.records.map((raw) => {
    if (!Number.isInteger(raw.ID) || raw.ID <= 0) throw new Error('NO_VERIFIED_STABLE_KEY');
    if (seen.has(raw.ID)) throw new Error('DUPLICATE_STABLE_KEY');
    seen.add(raw.ID);

    const modeled = { ID: raw.ID };
    if (Object.hasOwn(raw, 'HPCmd_INI')) {
      if (!Number.isInteger(raw.HPCmd_INI)) throw new Error('INVALID_HPCMD_TYPE');
      modeled.HPCmd_INI = raw.HPCmd_INI;
    }

    const unmodeled = {};
    for (const [key, value] of Object.entries(raw)) {
      if (!MODELED_FIELDS.has(key)) unmodeled[key] = value;
    }

    return { key: raw.ID, modeled, unmodeled };
  }).sort((a, b) => a.key - b.key);

  return {
    provenance: stable(snapshot.provenance),
    records,
  };
}

function fieldDelta(key, before, after) {
  const changes = [];
  const fields = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const field of [...fields].sort()) {
    const hasBefore = Object.hasOwn(before, field);
    const hasAfter = Object.hasOwn(after, field);
    if (!hasBefore && hasAfter) {
      changes.push({ observation: 'FIELD_ADDED', key, path: field, before: undefined, after: after[field] });
    } else if (hasBefore && !hasAfter) {
      changes.push({ observation: 'FIELD_REMOVED', key, path: field, before: before[field], after: undefined });
    } else if (stableStringify(before[field]) !== stableStringify(after[field])) {
      changes.push({
        observation: typeof before[field] === typeof after[field] ? 'VALUE_CHANGED' : 'TYPE_CHANGED',
        key,
        path: field,
        before: before[field],
        after: after[field],
      });
    }
  }
  return changes;
}

export function diffProjected(a, b) {
  if (a.provenance.source_family !== b.provenance.source_family) throw new Error('SOURCE_FAMILY_MISMATCH');
  if (a.provenance.scope !== b.provenance.scope) throw new Error('SOURCE_SCOPE_MISMATCH');

  const aBy = new Map(a.records.map((r) => [r.key, r]));
  const bBy = new Map(b.records.map((r) => [r.key, r]));
  const keys = [...new Set([...aBy.keys(), ...bBy.keys()])].sort((x, y) => x - y);
  const delta = [];

  for (const key of keys) {
    const before = aBy.get(key);
    const after = bBy.get(key);
    if (!before) {
      delta.push({ observation: 'RECORD_ADDED', key, before: null, after });
      continue;
    }
    if (!after) {
      delta.push({ observation: 'RECORD_MISSING', key, before, after: null });
      continue;
    }
    delta.push(...fieldDelta(key, before.modeled, after.modeled));
    delta.push(...fieldDelta(key, before.unmodeled, after.unmodeled).map((d) => ({ ...d, path: `unmodeled.${d.path}` })));
  }
  return delta;
}

export function applyDelta(projected, delta) {
  const cloned = structuredClone(projected);
  const by = new Map(cloned.records.map((r) => [r.key, r]));

  for (const d of delta) {
    if (d.observation === 'RECORD_ADDED') { by.set(d.key, structuredClone(d.after)); continue; }
    if (d.observation === 'RECORD_MISSING') { by.delete(d.key); continue; }
    const rec = by.get(d.key);
    if (!rec) throw new Error('DELTA_TARGET_MISSING');
    const unmodeled = d.path.startsWith('unmodeled.');
    const path = unmodeled ? d.path.slice('unmodeled.'.length) : d.path;
    const target = unmodeled ? rec.unmodeled : rec.modeled;
    if (d.observation === 'FIELD_REMOVED') delete target[path];
    else target[path] = structuredClone(d.after);
  }

  cloned.records = [...by.values()].sort((x, y) => x.key - y.key);
  return cloned;
}

export function decideHeroSemanticCandidates(delta, projectedB) {
  const bBy = new Map(projectedB.records.map((r) => [r.key, r]));
  const candidates = [];
  for (const d of delta) {
    if (d.observation === 'VALUE_CHANGED' && d.path === 'HPCmd_INI') {
      if (!Number.isInteger(d.before) || !Number.isInteger(d.after)) throw new Error('INVALID_HPCMD_TYPE');
      candidates.push({
        heroId: d.key,
        scope: projectedB.provenance.scope,
        fact: 'heroOwnedTroopHpModifierPct',
        before: d.before / 100,
        after: d.after / 100,
        evidence: {
          source_family: projectedB.provenance.source_family,
          source_commit: projectedB.provenance.source_commit,
          logical_path: projectedB.provenance.logical_path,
          locator: `ID=${d.key}.HPCmd_INI`,
          transformation: 'HPCmd_INI / 100',
        },
      });
    }
    if (d.observation === 'FIELD_ADDED' && d.path === 'HPCmd_INI') {
      const rec = bBy.get(d.key);
      if (rec && Number.isInteger(d.after)) {
        candidates.push({
          heroId: d.key,
          scope: projectedB.provenance.scope,
          fact: 'heroOwnedTroopHpModifierPct',
          before: null,
          after: d.after / 100,
          evidence: {
            source_family: projectedB.provenance.source_family,
            source_commit: projectedB.provenance.source_commit,
            logical_path: projectedB.provenance.logical_path,
            locator: `ID=${d.key}.HPCmd_INI`,
            transformation: 'HPCmd_INI / 100',
          },
        });
      }
    }
    // FIELD_REMOVED deliberately produces no semantic zero/default candidate.
  }
  return candidates;
}
