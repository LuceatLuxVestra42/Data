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

const specs = [
  { heroId: 1, base: 'data/hero/1' },
  { heroId: 6, base: 'data/hero/6' },
  { heroId: 37, base: 'data/hero/37' }
];

export function buildHeroIndex() {
  const heroes = specs.map(({heroId, base}) => {
    const canonical = readJson(`${base}/canonical.v1.json`);
    const localization = readJson(`${base}/localization.ko.v1.json`);
    const asset = readJson(`${base}/asset.sp-artwork.v1.json`);

    if (canonical.heroId !== heroId || localization.heroId !== heroId || asset.heroId !== heroId) {
      throw new Error(`HERO_ID_MISMATCH:${heroId}`);
    }
    if (localization.authorityBoundary !== 'PRESENTATION_ONLY' || localization.identityJoinUsed !== false) {
      throw new Error(`INVALID_LOCALIZATION_BOUNDARY:${heroId}`);
    }
    if (asset.kind !== 'SP_ARTWORK' || asset.normalPortraitClaim !== false) {
      throw new Error(`INVALID_ASSET_BOUNDARY:${heroId}`);
    }

    return {
      version: 1,
      heroId,
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
  });

  return { version: 1, heroes };
}

export function serializeHeroIndex() {
  return `${JSON.stringify(stable(buildHeroIndex()), null, 2)}\n`;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const out = path.join(root, 'data/generated/heroes/index.v1.json');
  const next = serializeHeroIndex();
  if (process.argv.includes('--check')) {
    if (fs.readFileSync(out, 'utf8') !== next) {
      console.error('GENERATED_HERO_INDEX_STALE');
      process.exit(1);
    }
    console.log('PASS_HERO_EXPANSION_INDEX_CURRENT');
  } else {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, next);
    console.log(out);
  }
}
