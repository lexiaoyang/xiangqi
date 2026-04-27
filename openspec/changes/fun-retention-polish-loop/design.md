## Context

The current branch already adds adult-oriented strategy mechanics, tactical tools, VIP tiers, and a strategy shop. A deeper audit found remaining product gaps: scoring does not fully reflect strategic play, VIP benefits like scanner radius and extra slots are not fully active, daily/achievement/codex goals are missing, server/mock catalogs can diverge, and the in-level feedback still uses some raw rule IDs. These gaps weaken retention and trust even if the core maze is deeper.

## Goals / Non-Goals

**Goals:**

- Make every clear feel scored and explainable through mastery badges, strategy score, danger/tool/relic feedback, and visible reward bonuses.
- Add daily challenge, streak, achievements, and mechanic codex as lightweight retention systems using additive local save fields.
- Make advertised VIP benefits real and visible in play, especially scanner radius and tactical slot count.
- Align economy presentation and grants so tactical tools/VIP points are consistently applied and tested.
- Improve rule readability through Chinese modifier labels, status chips, and first-time mechanic/codex feedback.
- Add focused tests for the high-risk loops found in audit.

**Non-Goals:**

- Do not add a new backend dependency or third-party SDK.
- Do not require online service availability for daily challenge, streak, achievements, or codex in this pass.
- Do not replace the existing strategy mechanics; refine and connect them.
- Do not implement full animated patrol AI in this pass; rename/clarify static sentry rules and improve feedback.

## Decisions

### Decision 1: Introduce a campaign retention module

Add `src/campaign/retention.ts` for pure functions: `evaluateMastery`, `dailyChallengeFor`, `updateStreak`, `updateAchievements`, `recordCodexSeen`, and labels. Keeping it pure avoids bloating `CampaignShell` and makes tests cheap.

Alternative considered: put logic in `CampaignShell`. Rejected because the component is already large and hidden logic would be hard to test.

### Decision 2: Store additive retention fields in `CampaignSaveV1`

Add `daily`, `achievements`, `codex`, and `masteryRecords` fields. Migration defaults preserve existing progress. This enables offline retention loops now and can later sync to backend.

Alternative considered: use only platform reward center state. Rejected because the current app must remain playable offline and mock/http modes are still being unified.

### Decision 3: Mastery score drives feedback, not hard failure

Mastery will score steps, time, danger, tool usage, relic completion, optional objectives, and VIP reward bonus. It will not block completion. This preserves fairness while making adult strategy matter.

Alternative considered: make traps directly reduce stars. Rejected for this pass because it can invalidate existing balance; instead we add a visible strategy score and badges while keeping star compatibility.

### Decision 4: VIP benefits must have observable effects

VIP scanner radius and tactical slot count will be derived and passed into `MazeLevelPlay`; the VIP panel will only advertise benefits that are actually active. Shop discount remains value labeling unless actual paid pricing changes, and the copy will avoid implying a real payment discount if not implemented.

Alternative considered: leave VIP as presentation. Rejected because the audit found trust issues.

### Decision 5: Daily/achievement/codex are local-first

Daily challenge and streak are based on local/server-day string and deterministic level selection. Achievements are milestone flags derived from save and clear results. Codex unlocks when modifiers are first encountered.

Alternative considered: wait for backend daily task API. Rejected because this iteration is focused on immediate product feel.

## Risks / Trade-offs

- Local daily state can be device-dependent -> Label it as local challenge and keep reward modest.
- More UI can clutter hub -> Use compact premium panels and only expose high-value next actions.
- Mastery may feel arbitrary -> Show score contributors and one actionable improvement tip.
- VIP benefits can still drift -> Add tests for scanner radius/slot derivation and avoid unimplemented discount claims.
- Existing branch already has many uncommitted changes -> Keep edits additive and avoid broad refactors.

## Migration Plan

1. Add retention types and migration defaults.
2. Add pure retention helpers and tests.
3. Wire mastery evaluation into `onPlayResolve` and result UI.
4. Wire daily challenge/streak/achievements/codex into hub and save persistence.
5. Wire VIP slot/radius into `MazeLevelPlay`.
6. Align catalog/server defaults where low-risk.
7. Run targeted tests, full tests, build, lints, and OpenSpec status.
