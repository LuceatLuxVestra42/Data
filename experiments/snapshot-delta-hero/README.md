# Snapshot / Delta experiment 3A

Purpose: prove, on a small Hero slice, that source changes are detected loss-aware and deterministically, while semantic candidates are derived only from explicit source evidence and are unaffected by Legacy presence.

## Fixed semantic fixture

- source family: `CN_ConfigDataHeroInfo`
- pinned predecessor: `LuceatLuxVestra42/langrisser-future-guide@6475e63ee23d18adf733756c26a14fa9e3ed662c`
- logical path: `data/configdata/ConfigDataHeroInfo.json`
- stable fixture key: `ID=6` (Leon)
- source field: `HPCmd_INI`
- pinned A value: `1500`
- synthetic B value: `1600`
- semantic mapping: `HPCmd_INI / 100 -> CN Hero-owned troop HP modifier percentage`

`HPCmd_INI` absence is **not** interpreted as `0`, `0%`, or unchanged. It is structural absence only in this experiment.

## Boundaries

Snapshot/projection/delta are source evidence, not semantic authority. `RECORD_MISSING` is not canonical deletion. Unknown fields are preserved under `unmodeled` so the projector cannot silently erase schema changes. Legacy artifacts are not inputs to projection, diff, or semantic decision.

## Run

```sh
node --test experiments/snapshot-delta-hero/test/snapshot-delta.test.mjs
```

3B canonical mutation is intentionally out of scope and is not required for experiment 3A completion.
