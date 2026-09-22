# Hero 6 production vertical slice — 4A to 4D

## Purpose

Prove the first production-oriented slice in the new repository without importing Legacy lifecycle or frontend architecture.

Current completed boundary:

```text
actual pinned source evidence
→ explicit identity + semantic admission
→ minimal canonical Hero
→ admitted presentation localization + verified SP artwork reference
→ deterministic generated consumer
```

Presentation runtime ownership is intentionally not decided here. 4E begins only after deciding whether this repository owns presentation or a separate consumer repository does.

## 4A — Evidence + identity admission

Production admission starts from the actual pinned Hero 6 record, not the Snapshot/Delta 3A synthetic `1600` fixture.

Admitted source observation:

```text
CN_ConfigDataHeroInfo
commit 6475e63ee23d18adf733756c26a14fa9e3ed662c
ID=6
Name=利昂
HPCmd_INI=1500
```

The preserved interpretation evidence supports:

```text
ConfigDataHeroInfo.ID → Hero/Unit ID in this source family
HPCmd_INI / 100 → Hero-owned troop HP modifier percentage
```

For this slice only, source identity `CN_ConfigDataHeroInfo.ID=6` is explicitly admitted as canonical Hero key `6`. This is not a global Hero-population claim.

Admitted fact:

```text
CN heroOwnedTroopHpModifierPct = 15
```

## 4B — Minimal canonical

`data/hero/6/canonical.v1.json` contains only the admitted Hero key and one CN-scoped semantic fact. It contains no Stage/Freeze/Status state and no Legacy generated output.

## 4C — Presentation inputs

Korean display localization is presentation-only:

```text
利昂 → 레온
```

It is not used to establish identity.

The reused verified asset is explicitly `SP_ARTWORK`, not a normal portrait. The local asset-reference record preserves the prior contract/result identifiers and expected output digest, while production generation does not execute Legacy Asset Intake.

## 4D — Deterministic generation

`tools/hero-6/generate.mjs` reads only:

```text
canonical.v1.json
localization.ko.v1.json
asset.sp-artwork.v1.json
```

It does not read raw ConfigData, Legacy repositories, migration checkpoints, or semantic evidence at generation time.

Run:

```sh
node tools/hero-6/generate.mjs --check
node --test tests/hero-6-vertical-slice.test.mjs
```

## Non-scope / next decision

Not included yet:

- frontend framework or hosting choice
- normal Hero portrait admission
- relation admission
- all-Hero schema/population migration
- raw-source ingestion framework
- central owner/validator orchestration

Before 4E, decide presentation ownership:

```text
A. this repository owns the minimal presentation runtime
or
B. a separate consumer repository owns presentation
```
