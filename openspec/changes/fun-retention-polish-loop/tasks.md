## 1. Retention Data Model

- [x] 1.1 Extend campaign types with mastery records, daily challenge state, streak state, achievements, and mechanic codex entries.
- [x] 1.2 Update save defaults and migration merging so old saves safely receive retention fields.
- [x] 1.3 Add pure retention helpers for day keys, daily challenge selection, mastery evaluation, achievement unlocks, codex recording, and reward grants.

## 2. Mastery And Gameplay Feedback

- [x] 2.1 Wire mastery evaluation into level completion and persist best mastery per level.
- [x] 2.2 Upgrade result screen with strategy score, badge, danger/tool/relic contributors, reward breakdown, and improvement tips.
- [x] 2.3 Replace raw modifier IDs with localized labels in prep, map, and play HUD.
- [x] 2.4 Add active status chips for keys, relics, phase state, freeze, reveal pulse, danger, and tool usage.
- [x] 2.5 Persist first-time mechanic/codex sightings and show concise first-time explanations.

## 3. Daily, Achievement, And Long-Term Loops

- [x] 3.1 Add hub daily challenge card with deterministic level, objective, reward, completion state, and direct start.
- [x] 3.2 Add streak progression and reward claim/update on first clear per day.
- [x] 3.3 Add achievement panel for progress, clean clear, relic, tool-efficient, mastery, and VIP milestones.
- [x] 3.4 Add mechanic codex panel showing discovered mechanics, undiscovered teasers, and small discovery rewards.

## 4. VIP And Tactical Economy

- [x] 4.1 Apply VIP extra loadout slots to tactical tool rendering and interactions.
- [x] 4.2 Apply VIP scanner/reveal radius bonus to gameplay visibility and scanner tool feedback.
- [x] 4.3 Centralize campaign grant logic for SKU, ad, reward, event, VIP daily, achievement, and streak rewards.
- [x] 4.4 Adjust VIP/shop copy so only active benefits are advertised and tactical contents are clearly listed.
- [x] 4.5 Align front-end config, legacy mock server config, and memory backend config for strategy SKUs and VIP products.

## 5. Verification And Documentation

- [x] 5.1 Add unit tests for retention helpers, mastery scoring, streak, achievements, codex, and VIP benefit derivation.
- [x] 5.2 Add gameplay/UI tests for shop tactical grants, VIP points, daily challenge visibility, and achievement/codex visibility.
- [x] 5.3 Add config consistency tests or assertions for strategy catalog parity where practical.
- [x] 5.4 Update README with the final fun-retention loop, daily challenge, mastery, achievements, codex, and VIP behavior.
- [x] 5.5 Run OpenSpec status, targeted tests, full test suite, build, and lints; fix regressions.
