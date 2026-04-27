## Why

The strategy-maze upgrade adds depth, but the product still lacks the sticky loops and high-confidence feedback that make players return: scoring is not fully tied to strategy, VIP benefits are partly only promised, daily/achievement goals are thin, and some platform configs diverge. This change turns the game from “a deeper maze” into a more engaging mini-game with clear mastery goals, daily reasons to return, honest VIP value, better feedback, and tighter tests.

## What Changes

- Add a mastery scoring loop that rewards clean routes, relic extraction, low danger, efficient tool use, speed/steps, and chapter goals.
- Add daily challenge, streak, achievement, and mechanic codex progression so players have short-, mid-, and long-term goals beyond “next level”.
- Make VIP benefits real in gameplay: scanner radius, extra tactical tool slots, daily claims, reward bonus clarity, and shop discount/value labeling.
- Improve in-level feedback: human-readable modifier labels, status chips for phase/freeze/reveal, risk feedback, and mechanic first-time learning.
- Align shop/rewards/ad/event outputs with tactical tools and VIP points so grants are clear and testable.
- Align server defaults with front-end strategy catalog/config to avoid mock/backend drift.
- Add tests for SKU → campaign inventory, VIP effects, mastery scoring, codex/streak/achievement state, and HTTP/mock config consistency.
- Update documentation with the final retention loop and remaining operational expectations.

## Capabilities

### New Capabilities

- `mastery-scoring-loop`: Strategy-aware scoring, mastery badges, risk/tool/relic feedback, and reward multipliers.
- `daily-retention-goals`: Daily challenge, streak rewards, achievement milestones, and mechanic codex progression.
- `gameplay-feedback-polish`: Human-readable in-level feedback, status chips, first-time explanations, and rule-state clarity.
- `economy-consistency-loop`: Unified tactical reward application, VIP/shop clarity, config parity, and high-value economy tests.

### Modified Capabilities

- `adult-strategy-campaign`: Adds strategy-scored objectives and retention goals on top of chaptered progression.
- `tactical-tool-loadout`: Makes VIP slot/radius benefits and tool use feedback fully observable.
- `vip-entitlement-system`: Makes advertised VIP benefits active, testable, and visible.
- `premium-shop-economy`: Requires tactical/VIP contents to be fulfilled, displayed, and tested consistently.
- `reward-center-platform`: Adds achievements, streak/daily claims, and tactical reward contents.
- `premium-minigame-experience-standard`: Strengthens the standard for feedback, long-term motivation, and honest monetization.

## Impact

- Gameplay: `src/campaign/*`, `src/maze/*`, `src/MazeLevelPlay.tsx`, and `src/CampaignShell.tsx`.
- Economy/platform: `src/platform/config.ts`, `src/platform/types.ts`, `server/index.mjs`, `server/src/db/memoryStore.mjs`, rewards/events/ad offer handling.
- UI/style: `src/styles.css`, hub, shop, VIP, prep, play HUD, result screens.
- Tests: campaign strategy, solvability, game state, app smoke, platform smoke, commerce/VIP reward tests.
- Persistence: additive campaign save fields for streak, achievements, codex, daily challenge, and mastery records; legacy saves must migrate safely.
