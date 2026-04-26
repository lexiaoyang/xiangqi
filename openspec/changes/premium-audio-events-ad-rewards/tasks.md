## 1. Experience Foundation

- [x] 1.1 Add shared domain types for audio settings, audio cue ids, event definitions, event tasks, event rewards, home popup config, popup frequency records, rewarded ad offers, and offer surfaces
- [x] 1.2 Extend bundled remote config with audio, events, home popups, and rewarded ad offer defaults
- [x] 1.3 Add config validation helpers for audio config, event config, popup config, and offer config
- [x] 1.4 Add local cache namespaces for audio settings, popup display history, event center snapshot, event progress, and pending ad rewards
- [x] 1.5 Add feature flags and kill switches for audio, activity center, home popups, and rewarded ad offers
- [x] 1.6 Add analytics event names and payload builders for audio, event, popup, and ad offer funnels

## 2. Audio System

- [x] 2.1 Implement `AudioManager` with BGM playback, SFX playback, track switching, mute, volume, and safe disposal
- [x] 2.2 Implement first-user-gesture audio unlock flow for browser autoplay restrictions
- [x] 2.3 Add bundled placeholder audio cues or lightweight generated fallback cues for lobby BGM and core SFX
- [x] 2.4 Add audio settings state with music enabled, sound effects enabled, master mute, volume, and persisted restore
- [x] 2.5 Add settings UI for music toggle, sound effects toggle, mute all, and volume control
- [x] 2.6 Play tap SFX for primary lobby, shop, activity, reward, popup, and ad CTA interactions
- [x] 2.7 Play reward, purchase success, ad complete, popup open, and failure feedback SFX
- [x] 2.8 Emit audio setting change, playback success, playback failure, and autoplay blocked analytics
- [x] 2.9 Add tests for first gesture unlock, mute persistence, SFX suppression when muted, and screen music switching

## 3. Activity Center

- [x] 3.1 Add event configuration schema with id, title, subtitle, visual theme, schedule, eligibility, priority, tasks, rewards, and CTA targets
- [x] 3.2 Implement event schedule and eligibility evaluation using server/config time
- [x] 3.3 Add activity center screen to the campaign shell routing model
- [x] 3.4 Add high-visibility home activity center entry with claimable/event badge
- [x] 3.5 Implement activity center home with active event cards, timers, reward previews, recommended action, and polished empty state
- [x] 3.6 Implement event detail panel with artwork, task list, reward track, countdown, and CTA buttons
- [x] 3.7 Implement event task progress ingestion for level clear, stars earned, ad watch, reward claim, shop visit, purchase, and login events
- [x] 3.8 Implement event milestone and task reward claim through the unified wallet ledger
- [x] 3.9 Add anti-abuse checks for impossible event progress and excessive event claim attempts
- [x] 3.10 Add activity center loading, offline cache, expired event, disabled event, and retry states
- [x] 3.11 Emit event exposure, detail open, task progress, reward claim, expiry, and error analytics
- [x] 3.12 Add tests for event schedule, eligibility, task progress, duplicate claim, expired event, and offline cache display

## 4. Home Event Popup

- [x] 4.1 Add home popup config schema with id, campaign id, priority, schedule, visual variant, reward preview, CTA target, frequency cap, and compliance labels
- [x] 4.2 Implement popup eligibility filtering and priority queue selection
- [x] 4.3 Implement popup display history cache with daily cap and "today no longer show" state
- [x] 4.4 Add premium home popup component with artwork area, title, subtitle, reward preview, countdown, close, today no longer show, and primary CTA
- [x] 4.5 Trigger home popup after home screen bootstrap is complete and not while gameplay is active
- [x] 4.6 Implement popup CTA routing to activity detail, rewarded ad offer, shop SKU, reward center, or settings
- [x] 4.7 Add popup safe degradation for invalid config, missing assets, killed module, or unavailable target
- [x] 4.8 Add ad and paid compliance labels inside popup CTA states
- [x] 4.9 Emit popup exposure, click, close, suppression, today-no-longer-show, and conversion analytics
- [x] 4.10 Add tests for priority selection, daily frequency cap, today suppression, CTA routing, invalid config skip, and analytics payloads

## 5. Rewarded Ad Offer Surfaces

- [x] 5.1 Add rewarded ad offer registry schema for stamina, hints, coins, revive/retry, and event progress offers
- [x] 5.2 Implement offer eligibility using placement enabled state, cooldown, daily cap, session cap, consent, minor status, and kill switch
- [x] 5.3 Replace plain home ad button with premium ad offer cards for "看广告领体力" and "看广告得提示"
- [x] 5.4 Add ad offer panel for stamina shortage when starting a level
- [x] 5.5 Add ad offer panel for hint shortage when using hint tool in gameplay
- [x] 5.6 Add rewarded ad offer entry in reward center and activity detail where configured
- [x] 5.7 Add optional post-level result offer for stamina, hint, coins, or retry/revive without interrupting gameplay
- [x] 5.8 Implement ad reward preview/confirmation modal with ad disclosure, reward contents, provider state, and cancel action
- [x] 5.9 Implement stamina reward grant through wallet ledger and sync to campaign resource bar
- [x] 5.10 Implement hint reward grant through wallet ledger and sync to visible hint counts/tool inventory
- [x] 5.11 Add pending completed-ad reward retry queue until show token success or expiry
- [x] 5.12 Add offer states for available, loading, showing, cooldown, cap reached, no fill, failed, disabled, restricted, and rewarded
- [x] 5.13 Play ad start, ad complete, reward grant, and failure SFX
- [x] 5.14 Emit rewarded ad offer exposure, click, preview, load, show, complete, reward, fail, cooldown block, and cap block analytics
- [x] 5.15 Add tests for stamina offer, hint offer, cooldown, daily cap, cancellation before playback, duplicate completion, pending retry, and no-fill failure

## 6. Mock Provider And Server API

- [x] 6.1 Extend mock platform providers with audio config, event config, popup config, and rewarded ad offer config
- [x] 6.2 Add mock provider methods for event center snapshot, event progress ingestion, event reward claim, popup impression recording, and popup suppression
- [x] 6.3 Extend mock ad provider to support hint offers, stamina offers, offer-specific rewards, pending reward retry, and no-fill simulation
- [x] 6.4 Extend mock server `/api/platform/config` to include audio, events, home popups, and rewarded ad offers
- [x] 6.5 Add mock server routes for `/api/platform/events`, `/api/platform/events/progress`, and `/api/platform/events/claim`
- [x] 6.6 Add mock server routes for `/api/platform/popups/impression`, `/api/platform/popups/suppress`, and popup analytics
- [x] 6.7 Add mock server routes for rewarded ad offers and pending ad reward retry
- [x] 6.8 Ensure mock data persistence does not store secrets or real user identifiers

## 7. Premium Mini-Game UI Standard

- [x] 7.1 Apply top-tier mini-game visual standard to home activity entry, ad offer cards, event center, popup, and reward claim states
- [x] 7.2 Replace any plain white card or raw text list in new user-facing surfaces with premium themed panels
- [x] 7.3 Add loading skeletons, polished empty states, disabled states, offline states, and retry states for all new surfaces
- [x] 7.4 Add reduced-motion support for popup, activity, reward, ad, and audio-triggered animations
- [x] 7.5 Add accessible labels and focus handling for popup close, CTA buttons, audio controls, and ad offer confirmations
- [x] 7.6 Add mobile safe-area spacing and small-screen layout checks for home, popup, activity center, and ad offer surfaces

## 8. Testing And Verification

- [x] 8.1 Add unit tests for audio manager state, config validation, event eligibility, popup queue, and ad offer eligibility
- [x] 8.2 Add integration tests for home startup showing activity popup once per frequency window
- [x] 8.3 Add integration tests for activity center task progress and reward claim through wallet ledger
- [x] 8.4 Add integration tests for watch-ad-get-stamina and watch-ad-get-hint flows
- [x] 8.5 Add integration tests for ad completion network failure and pending reward retry
- [x] 8.6 Add UI smoke test ensuring home exposes activity center, ad stamina offer, ad hint offer, shop, reward center, and play CTA
- [x] 8.7 Add regression tests ensuring existing commercial platform flows still pass
- [x] 8.8 Run `npm test`, `npm run build`, and linter diagnostics for changed files

## 9. Documentation And Rollout

- [x] 9.1 Update README with audio, activity center, home popup, rewarded ad offers, and mock config instructions
- [x] 9.2 Document audio asset expectations, fallback strategy, and autoplay limitations
- [x] 9.3 Document event config, popup config, rewarded ad offer config, and analytics event names
- [x] 9.4 Document operational runbooks for disabling audio, disabling popups, disabling events, and disabling specific ad offers
- [x] 9.5 Document quality checklist for one-line major-studio mini-game UI acceptance
- [x] 9.6 Prepare rollout plan: local mock, internal visual QA, ad sandbox QA, event config gray release, production launch
