# Hero 6 -> Exclusive Equipment 416 — 4R

## Purpose

Migrate one already verified relation into the new repository and prove that presentation consumes the relation without reconstructing it.

## Relation

```text
Hero 6
→ Exclusive Equipment 416
→ 청룡의 갑옷
```

Ownership authority is not the Korean name. The migrated evidence preserves the predecessor's direct source semantics:

```text
ConfigDataEquipmentInfo
ID = 416
SkillHero = 6
```

The accepted predecessor source contract defines `SkillHero` as the owner Hero ID for an admitted exclusive-equipment record. Names, descriptions, asset names, ID patterns and release order are rejected ownership resolvers.

The Korean label `청룡의 갑옷` is presentation-only.

## Boundaries

This slice admits one pair only. It does not migrate the entire 167-edge relation population and does not admit general-equipment eligibility.

The generated presentation handoff contains only:

```text
heroId
equipmentId
relationType
displayName
```

It contains no ConfigData field or migration provenance.

## Completion

4R is complete on the Data side when:

1. the direct source provenance for Hero 6 / Equipment 416 is preserved;
2. the pair is explicitly admitted;
3. the canonical relation is generated without inference;
4. the generated relation payload is deterministic;
5. the separate presentation repository can consume the payload without re-deriving ownership.
