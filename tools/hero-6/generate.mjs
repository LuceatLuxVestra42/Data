import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function buildHero6Consumer() {
  const canonical = readJson('data/hero/6/canonical.v1.json');
  const localization = readJson('data/hero/6/localization.ko.v1.json');
  const asset = readJson('data/hero/6/asset.sp-artwork.v1.json');

  if (canonical.heroId !== 6 || localization.heroId !== 6 || asset.heroId !== 6) {
    throw new Error('HERO_ID_MISMATCH');
  }
  if (localization.authorityBoundary !== 'PRESENTATION_ONLY' || localization.identityJoinUsed !== false) {
    throw new Error('INVALID_LOCALIZATION_BOUNDARY');
  }
  if (asset.kind !== 'SP_ARTWORK' || asset.normalPortraitClaim !== false) {
    throw new Error('INVALID_ASSET_BOUNDARY');
  }

  return {
    version: 1,
    heroId: canonical.heroId,
    display: {
      name: localization.displayLabel,
      asset: {
        key: asset.assetKey,
        kind: asset.kind,
        sha256: asset.expected.sha256,
        width: asset.expected.width,
        height: asset.expected.height
      }
    },
    facts: canonical.facts
  };
}

export function serializeHero6Consumer() {
  return `${JSON.stringify(stable(buildHero6Consumer()), null, 2)}\n`;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const outputPath = path.join(root, 'data/generated/hero/6.v1.json');
  const next = serializeHero6Consumer();
  if (process.argv.includes('--check')) {
    const current = fs.readFileSync(outputPath, 'utf8');
    if (current !== next) {
      console.error('GENERATED_HERO_6_STALE');
      process.exit(1);
    }
    console.log('PASS_HERO_6_GENERATED_CURRENT');
  } else {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, next);
    console.log(outputPath);
  }
}
