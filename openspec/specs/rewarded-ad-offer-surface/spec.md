# rewarded-ad-offer-surface Specification

## Purpose
TBD - created by archiving change premium-audio-events-ad-rewards. Update Purpose after archive.
## Requirements
### Requirement: Rewarded Ad Offer Registry
The system SHALL define rewarded ad offers for stamina, hints, coins, revive/retry, and event progress through configuration.

#### Scenario: Offer config loaded
- **WHEN** the client loads monetization configuration
- **THEN** the system receives offer id, placement id, trigger surface, reward contents, daily cap, cooldown, CTA text, disclosure text, and priority

#### Scenario: Offer disabled remotely
- **WHEN** an offer or placement is disabled by remote config
- **THEN** the system hides the offer or renders a disabled state without starting ad loading

### Requirement: Home Ad Offers
The system SHALL make rewarded ad offers visible on the home screen.

#### Scenario: Home stamina offer visible
- **WHEN** the user is on the home screen and the stamina ad offer is eligible
- **THEN** the system displays a clear "看广告领体力" CTA with reward amount and ad label

#### Scenario: Home hint offer visible
- **WHEN** the user is on the home screen and the hint ad offer is eligible
- **THEN** the system displays a clear "看广告得提示" CTA with reward amount and ad label

### Requirement: Resource Shortage Offers
The system SHALL present rewarded ad fallback offers when stamina or hints are insufficient.

#### Scenario: Stamina insufficient
- **WHEN** the user attempts to start a level without enough stamina
- **THEN** the system shows a premium offer panel with options to wait, shop, or watch an ad for stamina

#### Scenario: Hint insufficient
- **WHEN** the user attempts to use a hint without enough hint inventory
- **THEN** the system shows a rewarded ad offer to gain hints if the offer is eligible

### Requirement: Ad Reward Preview and Confirmation
The system SHALL show reward contents before starting a rewarded ad.

#### Scenario: User taps ad offer
- **WHEN** the user taps a rewarded ad offer
- **THEN** the system displays an ad preview or confirmation state with ad disclosure, reward contents, provider state, and cancel action

#### Scenario: User cancels before playback
- **WHEN** the user cancels before ad playback starts
- **THEN** the system does not consume cooldown, cap, or show token

### Requirement: Ad Eligibility States
The system SHALL display ad eligibility states with user-safe reasons.

#### Scenario: Cooldown active
- **WHEN** the offer cooldown has not elapsed
- **THEN** the system displays remaining cooldown time and does not request a new show token

#### Scenario: Daily cap reached
- **WHEN** the user reaches the offer daily cap
- **THEN** the system disables the offer until reset and displays a clear cap reached message

#### Scenario: Provider no fill
- **WHEN** the ad provider reports no fill or load failure
- **THEN** the system displays a non-blocking retry or fallback state without granting rewards

### Requirement: Ad Completion and Reward Grant
The system SHALL grant rewarded ad rewards only after verified completion.

#### Scenario: Stamina ad completed
- **WHEN** the stamina rewarded ad completes with a valid show token
- **THEN** the system grants stamina through the wallet ledger, updates the resource bar, plays reward sound, and shows a claim result animation

#### Scenario: Hint ad completed
- **WHEN** the hint rewarded ad completes with a valid show token
- **THEN** the system grants hint inventory through the wallet ledger and updates all visible hint counts

#### Scenario: Duplicate completion callback
- **WHEN** the same ad completion is submitted more than once
- **THEN** the system returns the original reward result without duplicate grant

### Requirement: Pending Ad Reward Retry
The system SHALL retry reward claims when an ad completed but reward claim submission failed due to network.

#### Scenario: Network fails after completion
- **WHEN** the ad provider confirms completion but the reward claim request fails due to network
- **THEN** the system stores the pending show token and retries claim until success or token expiry

#### Scenario: Pending reward expires
- **WHEN** a pending show token reaches expiry without successful claim
- **THEN** the system marks it expired and shows a user-safe message without granting unverified assets

### Requirement: Ad Offer Analytics
The system SHALL emit correlated funnel events for rewarded ad offers.

#### Scenario: Rewarded ad funnel completes
- **WHEN** a rewarded ad offer is exposed, clicked, loaded, shown, completed, and rewarded
- **THEN** the system emits correlated events with offer id, placement id, show id, reward id, config version, and surface

#### Scenario: Offer blocked by eligibility
- **WHEN** an offer is blocked by cooldown, cap, consent, minor status, provider failure, or kill switch
- **THEN** the system emits a normalized block event with the reason code

