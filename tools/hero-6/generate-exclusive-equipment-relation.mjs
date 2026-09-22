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

export function buildRelationConsumer() {
  const relation = readJson('data/relations/hero-exclusive-equipment/hero-6-equipment-416.canonical.v1.json');
  const localization = readJson('data/equipment/416/localization.ko.v1.json');

  if (relation.heroId !== 6 || relation.equipmentId !== 416 || relation.relationType !== 'exclusive') {
    throw new Error('UNEXPECTED_RELATION');
  }
  if (localization.equipmentId !== 416 || localization.authorityBoundary !== 'PRESENTATION_ONLY') {
    throw new Error('INVALID_EQUIPMENT_LOCALIZATION_BOUNDARY');
  }
  if (localization.relationAuthority !== false || localization.identityJoinUsed !== false) {
    throw new Error('LOCALIZATION_MUST_NOT_CREATE_RELATION');
  }

  return {
    version: 1,
    heroId: 6,
    relations: {
      exclusiveEquipment: [
        {
          equipmentId: 416,
          relationType: 'exclusive',
          displayName: localization.displayLabel
        }
      ]
    }
  };
}

export function serializeRelationConsumer() {
  return `${JSON.stringify(stable(buildRelationConsumer()), null, 2)}\n`;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const out = path.join(root, 'data/generated/relations/hero-6-exclusive-equipment.v1.json');
  const next = serializeRelationConsumer();
  if (process.argv.includes('--check')) {
    const current = fs.readFileSync(out, 'utf8');
    if (current !== next) {
      console.error('GENERATED_RELATION_STALE');
      process.exit(1);
    }
    console.log('PASS_HERO_6_EXCLUSIVE_EQUIPMENT_GENERATED_CURRENT');
  } else {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, next);
    console.log(out);
  }
}
