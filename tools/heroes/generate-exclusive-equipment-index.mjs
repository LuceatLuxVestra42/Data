import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function buildExclusiveEquipmentIndex() {
  const expansion = readJson('data/relations/hero-exclusive-equipment/expansion-1-37.canonical.v1.json');
  const leon = readJson('data/relations/hero-exclusive-equipment/hero-6-equipment-416.canonical.v1.json');
  const labels = new Map([
    [277, readJson('data/equipment/277/localization.ko.v1.json')],
    [416, readJson('data/equipment/416/localization.ko.v1.json')],
    [280, readJson('data/equipment/280/localization.ko.v1.json')]
  ]);

  const canonical = [
    expansion.relations.find(x => x.heroId === 1),
    leon,
    expansion.relations.find(x => x.heroId === 37)
  ];

  const relations = canonical.map((edge) => {
    if (!edge || edge.relationType !== 'exclusive') throw new Error('INVALID_CANONICAL_RELATION');
    const label = labels.get(edge.equipmentId);
    if (!label || label.equipmentId !== edge.equipmentId) throw new Error('MISSING_EQUIPMENT_LABEL');
    if (label.authorityBoundary !== 'PRESENTATION_ONLY' || label.relationAuthority !== false || label.identityJoinUsed !== false) {
      throw new Error('INVALID_LOCALIZATION_BOUNDARY');
    }
    return {
      heroId: edge.heroId,
      equipmentId: edge.equipmentId,
      relationType: edge.relationType,
      displayName: label.displayLabel
    };
  });

  return { version: 1, relations };
}

export function serializeExclusiveEquipmentIndex() {
  return `${JSON.stringify(stable(buildExclusiveEquipmentIndex()), null, 2)}\n`;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const out = path.join(root, 'data/generated/relations/hero-exclusive-equipment-index.v1.json');
  const next = serializeExclusiveEquipmentIndex();
  if (process.argv.includes('--check')) {
    if (fs.readFileSync(out, 'utf8') !== next) {
      console.error('GENERATED_RELATION_INDEX_STALE');
      process.exit(1);
    }
    console.log('PASS_EXCLUSIVE_EQUIPMENT_RELATION_INDEX_CURRENT');
  } else {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, next);
    console.log(out);
  }
}
