---
name: tier-one-mini-game-standard
description: Applies first-tier studio mini-game product quality standards to UI, UX, liveops, monetization, audio, ads, rewards, and gameplay presentation. Use when designing, proposing, implementing, or reviewing any player-facing mini-game feature, especially home screens, activity centers, popups, rewarded ads, shops, reward centers, onboarding, and game UI.
---

# Tier-One Mini-Game Standard

## Core Rule

Treat the target product as a first-tier studio mini-game. Do not ship engineering placeholders, plain white cards, raw text lists, generic buttons, hidden monetization entries, or low-effort visuals for player-facing surfaces.

## When To Apply

Use this skill for:

- Home/lobby design
- Activity center, events, mail, daily tasks, sign-in, achievements
- Rewarded ads, interstitial prompts, ad reward previews
- Shop, SKU cards, payment confirmation, reward claim flows
- Background music, sound effects, haptics, motion feedback
- Gameplay HUD, result screens, stamina/hint shortage flows
- OpenSpec proposals, design docs, tasks, implementation, and UI reviews

## Quality Bar

Every player-facing screen or component should satisfy:

- **Immediate comprehension**: primary action, reward, progress, and commercial state are visible within 3 seconds.
- **Premium hierarchy**: hero area, CTA, secondary actions, resources, and status are visually ranked.
- **Liveops feel**: events, rewards, ads, shop, and campaign progress feel actively operated, not bolted on.
- **Commercial clarity**: paid, ad-based, free, and claimable actions are visually distinct and compliant.
- **Mobile-first polish**: safe areas, thumb reach, large tap targets, readable text, and no horizontal drift.
- **Full state coverage**: loading, empty, disabled, cooldown, cap reached, offline, failed, success, and claimed states.
- **Feedback loop**: important actions produce coordinated visual feedback and sound/haptic feedback when enabled.

## Visual Direction

Prefer:

- Strong art direction: season theme, mascot/character, event key art, atmospheric background.
- Layered depth: glass/metal panels, glow, shadows, gradients, rim light, badges, progress bars.
- High-value CTAs: large primary button, animated shine used sparingly, clear reward preview.
- Operational cards: activity cards, ad offer cards, shop bundles, reward cards with tags and timers.

Avoid:

- Plain white cards on flat background.
- Text-only activity lists.
- Generic grey buttons.
- Hidden ad entries.
- Reward claims without animation or sound.
- Screens that look like admin dashboards.

## Monetization Rules

- Rewarded ad CTA MUST say it requires watching an ad and show the exact reward.
- Paid SKU CTA MUST show price, currency, contents, confirmation, cancel path, and unavailable states.
- Reward center CTA MUST show claimable/claimed/locked/progress state.
- Commercial modules MUST be remotely kill-switchable.
- Rewards MUST use idempotent wallet ledger operations.

## Audio And Motion

- BGM and SFX should support mute, volume, persistence, and first-gesture unlock.
- Play sounds for button tap, reward claim, purchase success, ad completion, popup open, and failure feedback.
- Respect reduced motion and muted users.
- Motion should guide attention, not hide information or block play.

## Review Checklist

Before marking a task complete:

- [ ] Does the screen look like a shipped mini-game, not a prototype?
- [ ] Is the main CTA obvious and thumb-friendly?
- [ ] Are ads, rewards, shop, and events visible where users expect them?
- [ ] Are all states designed, not just the happy path?
- [ ] Are audio/motion feedback and accessibility handled?
- [ ] Are tests or smoke checks covering visibility and flow?

## If The User Says It Looks Cheap

Stop adding backend mechanics. First improve:

1. Composition and hierarchy
2. Theme and art direction
3. CTA visibility
4. Reward/ad/shop clarity
5. Motion/audio feedback
6. Empty/error/loading states
