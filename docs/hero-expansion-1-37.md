# Hero expansion — current five-Hero slice

This slice proves the same Data → generated consumer pattern across five Heroes without creating a global Hero framework.

Current population:

- Hero 1: 马修 / 매튜 — CN Hero-owned troop HP modifier 5% — SP_ARTWORK
- Hero 6: 利昂 / 레온 — CN 15% — BASE_PORTRAIT
- Hero 12: 艾尔文 / 엘윈 — CN 5% — BASE_PORTRAIT
- Hero 15: 莉亚娜 / 리아나 — CN 15% — BASE_PORTRAIT
- Hero 37: 古巨拉 / 쥬그라 — CN 15% — SP_ARTWORK

## New base portrait admissions

Hero 12 and Hero 15 are admitted from the predecessor portrait sample only because that artifact preserves explicit HeroID → Google Drive file IDs and the underlying raw PNGs were independently re-read on 2026-09-23.

Hero 12 source:

- Drive file ID: `1S0Mftmvm4Lu-pdHPvzkant9zfyFGAXNE`
- `Elwin_idle_Normal_default.png`
- 1238 × 1847 RGBA
- PNG SHA256: `fc7d6c625d76e69e367b323cf6bd36af96d64e68cc36f50c922ad5cc69d8bcb9`
- admitted WebP SHA256: `2475f034d9734ebc561bec08faccfbb98636931081efeb17601010f852574a4b`

Hero 15 source:

- Drive file ID: `1cOdLxGc46d9oqJ7Epk7GDZ8wqsZIiF2p`
- `Riana_idle_Normal_default.png`
- 914 × 1654 RGBA
- PNG SHA256: `1fe078b3bb4bf51843bceb23d627015091c4d4bddaf657b0c4ae9be5c1911a22`
- admitted WebP SHA256: `28f074e86b1c16709a67d1cea8da496cf31ab1ec34aed83b7af5de682b677221`

The predecessor generated manifest is used as a locator/provenance carrier, not as semantic authority by itself.

## Explicit exclusions

- CARD_ARTWORK remains excluded.
- Hero 1 and Hero 37 remain SP_ARTWORK because no explicit HeroID → base portrait source evidence was found in the accessible source store.
- A candidate Matthew base PNG exists in Drive, but it is not admitted because the available Drive hierarchy does not provide an explicit HeroID bridge and name/filename matching is insufficient.
- No guessed missing `HPCmd_INI` values are admitted. This is why Hero 5 and Hero 8 were not added in this slice.

Non-scope:

- global Hero population migration
- Hero 1/37 base portrait promotion without explicit evidence
- new relation discovery
- search/filter framework
- raw-source ingestion framework
